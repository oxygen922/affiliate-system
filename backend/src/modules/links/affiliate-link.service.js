/**
 * AffiliateLink Service - 推广链接业务逻辑层
 * 老王出品：推广链接管理核心业务
 */

const { AffiliateLink, Channel, ChannelOffer, Offer, Click, Conversion } = require('../../models');
const { generateAffiliateCode, calculatePublisherCommission } = require('../../utils/commission.util');
const logger = require('../../utils/logger.util');

/**
 * 推广链接服务类
 */
class AffiliateLinkService {
  /**
   * 生成推广链接代码
   */
  generateCode() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * 创建推广链接
   */
  async createAffiliateLink(channelId, offerId, publisherId, linkData) {
    try {
      // 验证Channel归属
      const channel = await Channel.findOne({
        where: { id: channelId, publisherId }
      });

      if (!channel) {
        throw new Error('Channel不存在或无权限访问');
      }

      // 验证Offer
      const offer = await Offer.findOne({
        where: { id: offerId, status: 'active' }
      });

      if (!offer) {
        throw new Error('Offer不存在或未激活');
      }

      // 检查Channel是否已申请此Offer
      const channelOffer = await ChannelOffer.findOne({
        where: {
          channelId,
          offerId,
          status: 'approved'
        }
      });

      if (!channelOffer) {
        throw new Error('Channel未申请此Offer或申请未通过');
      }

      // 生成推广代码
      const code = this.generateCode();

      // 构建推广链接URL
      const baseUrl = linkData.baseUrl || process.env.BASE_URL || 'http://localhost:3000';
      const trackingUrl = `${baseUrl}/ref/${code}`;

      // 创建推广链接
      const affiliateLink = await AffiliateLink.create({
        channelId,
        offerId,
        code,
        url: trackingUrl,
        name: linkData.name || `${channel.name} - ${offer.name}`,
        source: linkData.source,
        status: 'active'
      });

      logger.info(`推广链接创建成功: ${affiliateLink.id}, Code: ${code}`);
      return affiliateLink;
    } catch (error) {
      logger.error('创建推广链接失败:', error);
      throw error;
    }
  }

  /**
   * 获取Channel的推广链接列表
   */
  async getChannelLinks(channelId, publisherId = null, options = {}) {
    const {
      page = 1,
      pageSize = 20,
      offerId,
      status
    } = options;

    const where = { channelId };

    if (publisherId) {
      // 验证Channel归属
      const channel = await Channel.findOne({
        where: { id: channelId, publisherId }
      });

      if (!channel) {
        throw new Error('Channel不存在或无权限访问');
      }
    }

    if (offerId) where.offerId = offerId;
    if (status) where.status = status;

    const { count, rows } = await AffiliateLink.findAndCountAll({
      where,
      include: [
        {
          model: Offer,
          as: 'offer',
          attributes: ['id', 'name', 'commissionRate', 'landingPage']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });

    return {
      links: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(count / pageSize)
    };
  }

  /**
   * 获取推广链接详情
   */
  async getLinkById(linkId, publisherId = null) {
    const where = { id: linkId };

    const link = await AffiliateLink.findOne({
      where,
      include: [
        {
          model: Offer,
          as: 'offer',
          include: [
            {
              model: require('../../models').Merchant,
              as: 'merchant',
              attributes: ['id', 'name', 'logo']
            }
          ]
        },
        {
          model: Channel,
          as: 'channel'
        }
      ]
    });

    if (!link) {
      throw new Error('推广链接不存在');
    }

    // 权限验证
    if (publisherId && link.channel.publisherId !== publisherId) {
      throw new Error('无权限访问此链接');
    }

    return link;
  }

  /**
   * 更新推广链接
   */
  async updateLink(linkId, publisherId, updateData) {
    const link = await AffiliateLink.findOne({
      where: { id: linkId },
      include: [
        {
          model: Channel,
          as: 'channel'
        }
      ]
    });

    if (!link) {
      throw new Error('推广链接不存在');
    }

    // 权限验证
    if (link.channel.publisherId !== publisherId) {
      throw new Error('无权限访问此链接');
    }

    await link.update(updateData);
    logger.info(`推广链接更新成功: ${linkId}`);

    return link;
  }

  /**
   * 删除推广链接
   */
  async deleteLink(linkId, publisherId) {
    const link = await AffiliateLink.findOne({
      where: { id: linkId },
      include: [
        {
          model: Channel,
          as: 'channel'
        }
      ]
    });

    if (!link) {
      throw new Error('推广链接不存在');
    }

    // 权限验证
    if (link.channel.publisherId !== publisherId) {
      throw new Error('无权限访问此链接');
    }

    await link.destroy();
    logger.info(`推广链接删除成功: ${linkId}`);

    return { message: '推广链接删除成功' };
  }

  /**
   * 获取链接统计数据
   */
  async getLinkStats(linkId, publisherId = null, startDate = null, endDate = null) {
    const link = await AffiliateLink.findOne({
      where: { id: linkId },
      include: [
        {
          model: Channel,
          as: 'channel'
        }
      ]
    });

    if (!link) {
      throw new Error('推广链接不存在');
    }

    // 权限验证
    if (publisherId && link.channel.publisherId !== publisherId) {
      throw new Error('无权限访问此链接');
    }

    const where = { linkId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[require('../../models').sequelize.Op.gte] = startDate;
      if (endDate) where.createdAt[require('../../models').sequelize.Op.lte] = endDate;
    }

    // 统计点击
    const clicks = await Click.findAll({
      where,
      attributes: [
        [require('../../models').sequelize.fn('COUNT', require('../../models').sequelize.fn('DISTINCT', require('../../models').sequelize.col('sessionId'))), 'uniqueClicks'],
        [require('../../models').sequelize.fn('COUNT', require('../../models').sequelize.col('id')), 'totalClicks']
      ],
      raw: true
    });

    // 统计转化
    const conversions = await Conversion.findAll({
      where: { linkId },
      attributes: [
        [require('../../models').sequelize.fn('COUNT', require('../../models').sequelize.col('id')), 'totalConversions'],
        [require('../../models').sequelize.fn('SUM', require('../../models').sequelize.col('orderAmount')), 'totalOrderAmount'],
        [require('../../models').sequelize.fn('SUM', require('../../models').sequelize.col('publisherCommission')), 'totalCommission']
      ],
      raw: true
    });

    const stats = {
      linkId,
      totalClicks: clicks[0]?.totalClicks || 0,
      uniqueClicks: clicks[0]?.uniqueClicks || 0,
      totalConversions: conversions[0]?.totalConversions || 0,
      totalOrderAmount: parseFloat(conversions[0]?.totalOrderAmount || 0).toFixed(2),
      totalCommission: parseFloat(conversions[0]?.totalCommission || 0).toFixed(2),
      conversionRate: 0,
      epc: 0 // 每点击收益
    };

    // 计算转化率
    if (stats.uniqueClicks > 0) {
      stats.conversionRate = ((stats.totalConversions / stats.uniqueClicks) * 100).toFixed(2);
    }

    // 计算EPC
    if (stats.totalClicks > 0) {
      stats.epc = (stats.totalCommission / stats.totalClicks).toFixed(2);
    }

    return stats;
  }

  /**
   * 记录点击（供追踪使用）
   */
  async recordClick(linkId, clickData) {
    try {
      const link = await AffiliateLink.findByPk(linkId);

      if (!link || link.status !== 'active') {
        throw new Error('推广链接不存在或未激活');
      }

      // 创建点击记录
      const click = await Click.create({
        linkId,
        channelId: link.channelId,
        sessionId: clickData.sessionId,
        ip: clickData.ip,
        userAgent: clickData.userAgent,
        referrer: clickData.referrer,
        country: clickData.country,
        city: clickData.city,
        device: clickData.device,
        browser: clickData.browser
      });

      // 更新链接点击数
      await link.update({
        clicks: link.clicks + 1
      });

      logger.info(`点击记录成功: Link=${linkId}, Click=${click.id}`);
      return click;
    } catch (error) {
      logger.error('记录点击失败:', error);
      throw error;
    }
  }
}

module.exports = new AffiliateLinkService();
