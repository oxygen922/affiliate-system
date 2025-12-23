/**
 * Channel Service - 渠道业务逻辑层
 * 老王出品：Channel核心业务逻辑
 */

const { Channel, ChannelOffer, Offer, AffiliateLink, Conversion, Commission, Publisher } = require('../../models');
const { sequelize } = require('../../config/database');
const logger = require('../../utils/logger.util');

/**
 * Channel服务类
 */
class ChannelService {
  /**
   * 创建Channel
   */
  async createChannel(publisherId, channelData) {
    try {
      // 验证Channel数量限制（可选）
      const channelCount = await Channel.count({
        where: { publisherId }
      });

      if (channelCount >= 100) {
        throw new Error('每个Publisher最多创建100个渠道');
      }

      // 创建Channel
      const channel = await Channel.create({
        publisherId,
        ...channelData,
        stats: {
          clicks: 0,
          conversions: 0,
          commission: 0
        }
      });

      logger.info(`Channel创建成功: ${channel.id}`);
      return channel;
    } catch (error) {
      logger.error('创建Channel失败:', error);
      throw error;
    }
  }

  /**
   * 获取Publisher的Channel列表
   */
  async getPublisherChannels(publisherId, options = {}) {
    const {
      page = 1,
      pageSize = 20,
      status,
      trafficType,
      search
    } = options;

    const where = { publisherId };

    if (status) where.status = status;
    if (trafficType) where.trafficType = trafficType;
    if (search) {
      where[sequelize.Op.or] = [
        { name: { [sequelize.Op.like]: `%${search}%` } },
        { description: { [sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Channel.findAndCountAll({
      where,
      include: [
        {
          model: ChannelOffer,
          as: 'channelOffers',
          where: { status: 'approved' },
          required: false,
          include: [
            {
              model: Offer,
              as: 'offer',
              attributes: ['id', 'name', 'commissionRate', 'status']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });

    return {
      channels: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(count / pageSize)
    };
  }

  /**
   * 获取Channel详情
   */
  async getChannelById(channelId, publisherId = null) {
    const where = { id: channelId };

    if (publisherId) {
      where.publisherId = publisherId;
    }

    const channel = await Channel.findOne({
      where,
      include: [
        {
          model: ChannelOffer,
          as: 'channelOffers',
          include: [
            {
              model: Offer,
              as: 'offer'
            }
          ]
        },
        {
          model: AffiliateLink,
          as: 'affiliateLinks',
          limit: 10,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!channel) {
      throw new Error('Channel不存在');
    }

    return channel;
  }

  /**
   * 更新Channel
   */
  async updateChannel(channelId, publisherId, updateData) {
    const channel = await Channel.findOne({
      where: { id: channelId, publisherId }
    });

    if (!channel) {
      throw new Error('Channel不存在或无权限访问');
    }

    await channel.update(updateData);
    logger.info(`Channel更新成功: ${channelId}`);

    return channel;
  }

  /**
   * 删除Channel
   */
  async deleteChannel(channelId, publisherId) {
    const channel = await Channel.findOne({
      where: { id: channelId, publisherId }
    });

    if (!channel) {
      throw new Error('Channel不存在或无权限访问');
    }

    // 检查是否有未完成的转化或佣金
    const pendingConversions = await Conversion.count({
      where: {
        channelId,
        status: { [sequelize.Op.in]: ['pending', 'approved'] }
      }
    });

    if (pendingConversions > 0) {
      throw new Error('Channel有未完成的转化，无法删除');
    }

    await channel.destroy();
    logger.info(`Channel删除成功: ${channelId}`);

    return { message: 'Channel删除成功' };
  }

  /**
   * Channel申请Offer
   */
  async applyForOffer(channelId, offerId, publisherId, applyData) {
    // 验证Channel归属
    const channel = await Channel.findOne({
      where: { id: channelId, publisherId }
    });

    if (!channel) {
      throw new Error('Channel不存在或无权限访问');
    }

    // 验证Offer是否存在
    const offer = await Offer.findOne({
      where: { id: offerId, status: 'active' }
    });

    if (!offer) {
      throw new Error('Offer不存在或未激活');
    }

    // 检查是否已经申请过
    const existingApplication = await ChannelOffer.findOne({
      where: { channelId, offerId }
    });

    if (existingApplication) {
      throw new Error('已经申请过此Offer');
    }

    // 获取商家信息判断是否需要审核
    const { Merchant } = require('../../models');
    const merchant = await Merchant.findByPk(offer.merchantId);

    let needsApproval = false;
    if (merchant && merchant.tags && merchant.tags.includes('blacklist')) {
      needsApproval = true;
    }

    // 创建ChannelOffer记录
    const channelOffer = await ChannelOffer.create({
      channelId,
      offerId,
      commissionRate: applyData.commissionRate || channel.defaultCommissionRate,
      status: needsApproval ? 'pending' : 'approved',
      notes: applyData.notes
    });

    // 如果不需要审核，直接批准
    if (!needsApproval) {
      await channelOffer.update({
        status: 'approved',
        approvedAt: new Date()
      });
    }

    logger.info(`Channel申请Offer成功: Channel=${channelId}, Offer=${offerId}, Status=${channelOffer.status}`);

    return channelOffer;
  }

  /**
   * 获取Channel的Offer列表
   */
  async getChannelOffers(channelId, publisherId = null) {
    const where = { channelId };

    const channel = await Channel.findOne({
      where: publisherId ? { id: channelId, publisherId } : { id: channelId }
    });

    if (!channel) {
      throw new Error('Channel不存在');
    }

    const channelOffers = await ChannelOffer.findAll({
      where,
      include: [
        {
          model: Offer,
          as: 'offer',
          include: [
            {
              model: require('../../models').Merchant,
              as: 'merchant'
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return channelOffers;
  }

  /**
   * 获取Channel统计数据
   */
  async getChannelStats(channelId, publisherId = null, startDate = null, endDate = null) {
    const channel = await Channel.findOne({
      where: publisherId ? { id: channelId, publisherId } : { id: channelId }
    });

    if (!channel) {
      throw new Error('Channel不存在');
    }

    const where = { channelId };

    if (startDate || endDate) {
      where.conversionDate = {};
      if (startDate) where.conversionDate[sequelize.Op.gte] = startDate;
      if (endDate) where.conversionDate[sequelize.Op.lte] = endDate;
    }

    // 统计转化数据
    const conversions = await Conversion.findAll({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalConversions'],
        [sequelize.fn('SUM', sequelize.col('orderAmount')), 'totalOrderAmount'],
        [sequelize.fn('SUM', sequelize.col('publisherCommission')), 'totalCommission'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('customerId'))), 'uniqueCustomers']
      ],
      raw: true
    });

    // 统计点击数据
    const clicks = await require('../../models').Click.findAll({
      where: { channelId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('sessionId'))), 'uniqueClicks'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalClicks']
      ],
      raw: true
    });

    const stats = {
      channelId,
      clicks: clicks[0]?.totalClicks || 0,
      uniqueClicks: clicks[0]?.uniqueClicks || 0,
      conversions: conversions[0]?.totalConversions || 0,
      uniqueCustomers: conversions[0]?.uniqueCustomers || 0,
      totalOrderAmount: parseFloat(conversions[0]?.totalOrderAmount || 0).toFixed(2),
      totalCommission: parseFloat(conversions[0]?.totalCommission || 0).toFixed(2),
      conversionRate: 0,
      avgOrderValue: 0
    };

    // 计算转化率
    if (stats.uniqueClicks > 0) {
      stats.conversionRate = ((stats.conversions / stats.uniqueClicks) * 100).toFixed(2);
    }

    // 计算平均订单价值
    if (stats.conversions > 0) {
      stats.avgOrderValue = (stats.totalOrderAmount / stats.conversions).toFixed(2);
    }

    return stats;
  }

  /**
   * 更新Channel统计（定时任务调用）
   */
  async updateChannelStats(channelId) {
    const stats = await this.getChannelStats(channelId);

    await Channel.update(
      {
        stats: {
          clicks: stats.clicks,
          conversions: stats.conversions,
          commission: stats.totalCommission
        }
      },
      { where: { id: channelId } }
    );

    return stats;
  }
}

module.exports = new ChannelService();
