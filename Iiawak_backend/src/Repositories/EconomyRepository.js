'use strict';
const TopupPackage = require('../Models/TopupPackage.model');
const Giftcode     = require('../Models/Giftcode.model');

/**
 * EconomyRepository — Queries cho TopupPackage & Giftcode.
 */
class EconomyRepository {

  // ── Topup Packages ────────────────────────────────────────────────────────

  async findActivePackages() {
    return TopupPackage.find({ isActive: true }).sort({ price: 1 });
  }

  async findPackageById(id) {
    return TopupPackage.findById(id);
  }

  async createPackage(data) {
    const pkg = new TopupPackage(data);
    return pkg.save();
  }

  async updatePackage(id, data) {
    return TopupPackage.findByIdAndUpdate(id, data, { new: true });
  }

  async deletePackage(id) {
    return TopupPackage.findByIdAndDelete(id);
  }

  // ── Giftcodes ─────────────────────────────────────────────────────────────

  async findGiftcodeByCode(code) {
    return Giftcode.findOne({ code });
  }

  async saveGiftcode(giftcode) {
    return giftcode.save();
  }

  async findAllGiftcodes() {
    return Giftcode.find().sort({ createdAt: -1 });
  }

  async updateGiftcode(id, data) {
    return Giftcode.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteGiftcode(id) {
    return Giftcode.findByIdAndDelete(id);
  }

  async createGiftcode(data) {
    const gc = new Giftcode(data);
    return gc.save();
  }
}

module.exports = new EconomyRepository();
