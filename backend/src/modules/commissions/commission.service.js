/**
 * Commission Service - 佣金业务逻辑层
 * 老王出品：佣金计算核心业务
 */

const { Commission, Conversion, Publisher, Channel, ChannelOffer, Offer } = require('../../models');
const { calculatePublisherCommission } = require('../../utils/commission.util');
const { sequelize } = require('../../config/database');
const logger = require('../../utils/logger.util');

/**
 * 佣金服务类
 */
class CommissionService {
  /**
   * 获取Publisher佣金列表
   */
  async getPublisherCommissions(publisherId, options = {}) {
    const {
      page = 1,
      pageSize = 20,
      channelId,
      status,
      startDate,
      endDate
    } = options;

    const where = { publisherId };

    if (channelId) where.channelId = channelId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[sequelize.Op.gte] = startDate;
      if (endDate) where.createdAt[sequelize.Op.lte] = endDate;
    }

    const { count, rows } = await Commission.findAndCountAll({
      where,
      include: [
        {
          model: Conversion,
          as: 'conversion',
          attributes: ['orderId', 'orderAmount', 'conversionDate']
        },
        {
          model: Channel,
          as: 'channel',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });

    return {
      commissions: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(count / pageSize)
    };
  }

  /**
   * 获取佣金统计
   */
  async getCommissionStats(publisherId, channelId = null) {
    const where = { publisherId };

    if (channelId) where.channelId = channelId;

    const stats = await Commission.findAll({
      where,
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalCommission'],
        [sequelize.fn('SUM', sequelize.case({
          when: { status: 'available' },
          then: sequelize.col('amount')
        })), 'availableCommission'],
        [sequelize.fn('SUM', sequelize.case({
          when: { status: 'locked' },
          then: sequelize.col('amount')
        })), 'lockedCommission'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalRecords']
      ],
      raw: true
    });

    return {
      totalCommission: parseFloat(stats[0]?.totalCommission || 0).toFixed(2),
      availableCommission: parseFloat(stats[0]?.availableCommission || 0).toFixed(2),
      lockedCommission: parseFloat(stats[0]?.lockedCommission || 0).toFixed(2),
      totalRecords: parseInt(stats[0]?.totalRecords || 0)
    };
  }

  /**
   * 计算并创建佣金（转化后调用）
   */
  async calculateAndCreateCommission(conversionId) {
    try {
      const conversion = await Conversion.findByPk(conversionId, {
        include: [
          {
            model: Offer,
            as: 'offer',
            attributes: ['id', 'commissionRate', 'commissionType']
          },
          {
            model: Channel,
            as: 'channel',
            attributes: ['id', 'publisherId', 'defaultCommissionRate']
          }
        ]
      });

      if (!conversion) {
        throw new Error('转化记录不存在');
      }

      // 获取佣金比例（三层查找）
      let publisherShareRate = conversion.channel.defaultCommissionRate;

      // 查找ChannelOffer是否有特殊比例
      const channelOffer = await ChannelOffer.findOne({
        where: {
          channelId: conversion.channelId,
          offerId: conversion.offerId,
          status: 'approved'
        }
      });

      if (channelOffer && channelOffer.commissionRate) {
        publisherShareRate = channelOffer.commissionRate;
      }

      // 计算佣金
      const commissionResult = calculatePublisherCommission(
        conversion.orderAmount,
        conversion.offer.commissionRate,
        publisherShareRate
      );

      // 创建佣金记录
      const commission = await Commission.create({
        publisherId: conversion.channel.publisherId,
        channelId: conversion.channelId,
        conversionId: conversion.id,
        amount: commissionResult.publisherCommission,
        status: 'pending',
        availableAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天后可提现
      });

      // 更新Conversion的佣金信息
      await conversion.update({
        publisherCommission: commissionResult.publisherCommission,
        platformCommission: commissionResult.platformCommission
      });

      // 更新Publisher余额
      const publisher = await Publisher.findByPk(conversion.channel.publisherId);
      await publisher.update({
        balance: parseFloat(publisher.balance) + parseFloat(commissionResult.publisherCommission),
        totalEarned: parseFloat(publisher.totalEarned) + parseFloat(commissionResult.publisherCommission)
      });

      logger.info(`佣金创建成功: ${commission.id}, 金额: ${commissionResult.publisherCommission}`);

      return commission;
    } catch (error) {
      logger.error('创建佣金失败:', error);
      throw error;
    }
  }
}

module.exports = new CommissionService();
