/**
 * Offer Service - Offer业务逻辑层
 * 老王出品：Offer管理核心业务
 */

const { Offer, Merchant, UpstreamAffiliate, ChannelOffer } = require('../../models');
const { sequelize } = require('../../config/database');
const logger = require('../../utils/logger.util');

/**
 * Offer服务类
 */
class OfferService {
  /**
   * 创建Offer（管理员）
   */
  async createOffer(offerData) {
    try {
      // 检查商家是否存在
      const merchant = await Merchant.findByPk(offerData.merchantId);
      if (!merchant) {
        throw new Error('商家不存在');
      }

      // 检查商家标签，判断是否需要审核
      let needsApproval = false;
      if (merchant.tags && merchant.tags.includes('blacklist')) {
        needsApproval = true;
      }

      const offer = await Offer.create({
        ...offerData,
        status: needsApproval ? 'pending' : 'active',
        needsApproval
      });

      logger.info(`Offer创建成功: ${offer.id}, 需要审核: ${needsApproval}`);
      return offer;
    } catch (error) {
      logger.error('创建Offer失败:', error);
      throw error;
    }
  }

  /**
   * 获取Offer列表
   */
  async getOffers(options = {}) {
    const {
      page = 1,
      pageSize = 20,
      status,
      merchantId,
      offerType,
      search
    } = options;

    const where = {};

    if (status) where.status = status;
    if (merchantId) where.merchantId = merchantId;
    if (offerType) where.offerType = offerType;
    if (search) {
      where[sequelize.Op.or] = [
        { name: { [sequelize.Op.like]: `%${search}%` } },
        { description: { [sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Offer.findAndCountAll({
      where,
      include: [
        {
          model: Merchant,
          as: 'merchant',
          attributes: ['id', 'name', 'website', 'logo']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });

    return {
      offers: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(count / pageSize)
    };
  }

  /**
   * 获取Offer详情
   */
  async getOfferById(offerId) {
    const offer = await Offer.findByPk(offerId, {
      include: [
        {
          model: Merchant,
          as: 'merchant',
          include: [
            {
              model: UpstreamAffiliate,
              as: 'upstreamAffiliate',
              attributes: ['id', 'name', 'code', 'logo']
            }
          ]
        }
      ]
    });

    if (!offer) {
      throw new Error('Offer不存在');
    }

    // 统计此Offer被多少Channel申请
    const channelOfferCount = await ChannelOffer.count({
      where: { offerId }
    });

    const offerData = offer.toJSON();
    offerData.channelOfferCount = channelOfferCount;

    return offerData;
  }

  /**
   * 更新Offer
   */
  async updateOffer(offerId, updateData) {
    const offer = await Offer.findByPk(offerId);

    if (!offer) {
      throw new Error('Offer不存在');
    }

    await offer.update(updateData);
    logger.info(`Offer更新成功: ${offerId}`);

    return offer;
  }

  /**
   * 删除Offer
   */
  async deleteOffer(offerId) {
    const offer = await Offer.findByPk(offerId);

    if (!offer) {
      throw new Error('Offer不存在');
    }

    // 检查是否有关联的ChannelOffer
    const channelOfferCount = await ChannelOffer.count({
      where: { offerId }
    });

    if (channelOfferCount > 0) {
      throw new Error(`该Offer已被${channelOfferCount}个Channel申请，无法删除`);
    }

    await offer.destroy();
    logger.info(`Offer删除成功: ${offerId}`);

    return { message: 'Offer删除成功' };
  }

  /**
   * 审核Offer
   */
  async approveOffer(offerId, status, reason = null) {
    const offer = await Offer.findByPk(offerId);

    if (!offer) {
      throw new Error('Offer不存在');
    }

    await offer.update({
      status: status === 'approved' ? 'active' : 'suspended'
    });

    logger.info(`Offer审核${status}: ${offerId}, 原因: ${reason}`);

    return offer;
  }

  /**
   * Offer市场（Publisher浏览）
   */
  async getOfferMarket(options = {}) {
    const {
      page = 1,
      pageSize = 20,
      category,
      country,
      offerType,
      search
    } = options;

    const where = { status: 'active' };

    if (offerType) where.offerType = offerType;
    if (search) {
      where[sequelize.Op.or] = [
        { name: { [sequelize.Op.like]: `%${search}%` } },
        { description: { [sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Offer.findAndCountAll({
      where,
      include: [
        {
          model: Merchant,
          as: 'merchant',
          attributes: ['id', 'name', 'logo', 'category', 'tags'],
          where: category ? { category } : undefined
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });

    return {
      offers: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(count / pageSize)
    };
  }
}

module.exports = new OfferService();
