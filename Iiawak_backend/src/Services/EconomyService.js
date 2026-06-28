'use strict';
const economyRepository  = require('../Repositories/EconomyRepository');
const userRepository     = require('../Repositories/UserRepository');
const SystemConfig       = require('../Models/SystemConfig.model');
const AppError           = require('../Exceptions/AppError');
const Errors             = require('../Constants/errorMessages');
const formatUtil         = require('../Utils/formatUtil');
const { TransactionType } = require('../Constants/appConstants');

/**
 * EconomyService — Nghiệp vụ Gói nạp KCH.
 */
class EconomyService {

  async getPackages() {
    return economyRepository.findActivePackages();
  }

  async createPackage(data) {
    const { name, price, kch, bonus } = data;
    return economyRepository.createPackage({ name, price, kch, bonus });
  }

  async updatePackage(id, data) {
    return economyRepository.updatePackage(id, data);
  }

  async deletePackage(id) {
    await economyRepository.deletePackage(id);
    return true;
  }

  async verifyPurchase(userId, productId, purchaseToken) {
    // 1. Tra cứu TopupPackage bằng productId
    // (Vì hiện tại TopupPackage.model lưu playStoreProductId)
    const TopupPackage = require('../Models/TopupPackage.model');
    const pkg = await TopupPackage.findOne({ playStoreProductId: productId });
    if (!pkg) {
      // Fallback: Tìm theo _id nếu admin setup trực tiếp productId = _id của Mongo
      const fallbackPkg = await TopupPackage.findById(productId).catch(() => null);
      if (!fallbackPkg) {
        throw AppError.notFound('Không tìm thấy gói nạp tương ứng với sản phẩm này.');
      }
      return this._processPurchase(userId, fallbackPkg, purchaseToken);
    }
    return this._processPurchase(userId, pkg, purchaseToken);
  }

  async _processPurchase(userId, pkg, purchaseToken) {
    // TODO: Trong tương lai, gọi Google Play Developer API để xác minh purchaseToken
    
    let totalKch = pkg.kch;
    
    // Check if x2 is active
    const x2Config = await SystemConfig.findOne({ key: 'suKienX2' });
    if (x2Config && x2Config.value) {
      totalKch *= 2;
    }
    
    totalKch += (pkg.bonus || 0);

    // Lưu giao dịch với trạng thái SUCCESS
    await userRepository.createTransaction({
      txId: formatUtil.txId('GG'),
      userId,
      amountKch: totalKch,
      type: TransactionType.TOPUP,
      status: 'success',
      description: `Thanh toán CH Play: ${pkg.name} (${purchaseToken.substring(0, 8)}...)`
    });

    // Cập nhật số dư cho User
    const User = require('../Models/User.model');
    await User.findByIdAndUpdate(userId, { $inc: { kchBalance: totalKch } });

    return { rewardKch: totalKch, status: 'success' };
  }
}

/**
 * GiftcodeService — Nghiệp vụ nhập mã quà tặng.
 */
class GiftcodeService {

  async redeem(code, userId) {
    const user     = await userRepository.findById(userId);
    if (!user) throw AppError.notFound('Người dùng');

    const giftcode = await economyRepository.findGiftcodeByCode(code);
    if (!giftcode)                          throw AppError.notFound(Errors.GIFTCODE.NOT_FOUND);
    if (!giftcode.active)                   throw AppError.badRequest('Mã quà tặng này đã bị vô hiệu hóa', 'GC_INACTIVE');
    if (!giftcode.unlimitedQty && giftcode.usedCount >= giftcode.maxUses)  throw AppError.badRequest(Errors.GIFTCODE.MAX_USES,    'GC_MAX_USES');
    
    // Check expiry
    if (!giftcode.noLimit && giftcode.endDate && giftcode.endDate < new Date()) {
      throw AppError.badRequest(Errors.GIFTCODE.EXPIRED, 'GC_EXPIRED');
    }
    // Also check legacy expiresAt just in case
    if (giftcode.expiresAt && giftcode.expiresAt < new Date()) {
      throw AppError.badRequest(Errors.GIFTCODE.EXPIRED, 'GC_EXPIRED');
    }

    if (giftcode.usedBy.some(id => id.toString() === userId.toString())) {
      throw AppError.conflict(Errors.GIFTCODE.ALREADY_USED, 'GC_USED');
    }

    // Check scope logic
    if (giftcode.scope === 'new') {
      const userAgeMs = new Date() - new Date(user.createdAt);
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      if (userAgeMs > SEVEN_DAYS_MS) {
        throw AppError.badRequest('Mã quà tặng này chỉ dành cho người dùng mới (dưới 7 ngày)', 'GC_NEW_ONLY');
      }
    } else if (giftcode.scope === 'user') {
      if (giftcode.uid) {
        // UID could be usernames or objectIds separated by comma
        const allowedUids = giftcode.uid.split(',').map(s => s.trim().toLowerCase());
        const isAllowed = allowedUids.includes(user._id.toString().toLowerCase()) || 
                          allowedUids.includes(user.username.toLowerCase());
        if (!isAllowed) {
          throw AppError.badRequest('Bạn không nằm trong danh sách nhận mã quà tặng này', 'GC_NOT_ALLOWED');
        }
      }
    }

    // Nghiệp vụ: cộng KCH, ghi nhận lượt dùng
    giftcode.usedCount += 1;
    giftcode.usedBy.push(userId);
    await economyRepository.saveGiftcode(giftcode);

    // Cập nhật balance (dùng thẳng Model để save — không có updateById cho partial number)
    const User = require('../Models/User.model');
    await User.findByIdAndUpdate(userId, { $inc: { kchBalance: giftcode.rewardKch } });

    await userRepository.createTransaction({
      txId:      formatUtil.txId('GC'),
      userId,
      amountKch: giftcode.rewardKch,
      type:      TransactionType.GIFTCODE,
      status:    'success',
    });

    return { rewardKch: giftcode.rewardKch };
  }

  async createGiftcode(data) {
    // Mapping from frontend keys to DB keys if needed, or pass directly
    const { code, rewardKch, maxUses, scope, active, unlimitedQty, uid, noLimit, startDate, endDate, expiresAt } = data;
    return economyRepository.createGiftcode({ 
      code, 
      rewardKch: parseInt(rewardKch) || data.rewardQty, // Support both formats 
      maxUses: parseInt(maxUses) || parseInt(data.total) || 1, 
      scope: scope || 'server',
      active: active !== undefined ? active : true,
      unlimitedQty: unlimitedQty || false,
      uid: uid || '',
      noLimit: noLimit || false,
      startDate,
      endDate,
      expiresAt: expiresAt || endDate // Keep legacy backward compat
    });
  }

  async getGiftcodes() {
    return economyRepository.findAllGiftcodes();
  }

  async deleteGiftcode(id) {
    return economyRepository.deleteGiftcode(id);
  }

  async toggleGiftcode(id) {
    const gc = await economyRepository.findGiftcodeByCode(id); // Id might actually be the code, wait, let's use actual ID or code
    // Actually, findById is better if id is passed
    const Giftcode = require('../Models/Giftcode.model');
    const giftcode = await Giftcode.findById(id) || await Giftcode.findOne({ code: id });
    if (!giftcode) throw AppError.notFound('Giftcode not found');
    giftcode.active = !giftcode.active;
    return giftcode.save();
  }
}

module.exports = { EconomyService: new EconomyService(), GiftcodeService: new GiftcodeService() };
