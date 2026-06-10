'use strict';
const economyRepository  = require('../../3_DataAccess/Repositories/EconomyRepository');
const userRepository     = require('../../3_DataAccess/Repositories/UserRepository');
const AppError           = require('../../4_Core/Exceptions/AppError');
const Errors             = require('../../4_Core/Constants/errorMessages');
const formatUtil         = require('../../4_Core/Utils/formatUtil');
const { TransactionType } = require('../../4_Core/Constants/appConstants');

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
    if (giftcode.usedCount >= giftcode.maxUses)  throw AppError.badRequest(Errors.GIFTCODE.MAX_USES,    'GC_MAX_USES');
    if (giftcode.expiresAt && giftcode.expiresAt < new Date()) throw AppError.badRequest(Errors.GIFTCODE.EXPIRED, 'GC_EXPIRED');
    if (giftcode.usedBy.some(id => id.toString() === userId.toString())) {
      throw AppError.conflict(Errors.GIFTCODE.ALREADY_USED, 'GC_USED');
    }

    // Nghiệp vụ: cộng KCH, ghi nhận lượt dùng
    giftcode.usedCount += 1;
    giftcode.usedBy.push(userId);
    await economyRepository.saveGiftcode(giftcode);

    // Cập nhật balance (dùng thẳng Model để save — không có updateById cho partial number)
    const User = require('../../3_DataAccess/Models/User.model');
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
    const { code, rewardKch, maxUses, expiresAt } = data;
    return economyRepository.createGiftcode({ code, rewardKch, maxUses, expiresAt });
  }
}

module.exports = { EconomyService: new EconomyService(), GiftcodeService: new GiftcodeService() };
