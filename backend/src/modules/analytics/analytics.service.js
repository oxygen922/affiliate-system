/**
 * Analytics Service - 数据统计业务逻辑层
 * 老王出品：数据分析核心业务
 */

const { Publisher, Channel, Conversion, Commission, Offer, Click } = require('../../models');
const { sequelize } = require('../../config/database');
const logger = require('../../utils/logger.util');

/**
 * 数据统计服务类
 */
class AnalyticsService {
  /**
   * 管理员仪表盘数据
   */
  async getAdminDashboard() {
    try {
      // 核心指标统计
      const [
        totalPublishers,
        totalChannels,
        totalOffers,
        totalConversions,
        totalCommission
      ] = await Promise.all([
        Publisher.count(),
        Channel.count(),
        Offer.count({ where: { status: 'active' } }),
        Conversion.count(),
        Commission.sum('amount', { where: { status: 'available' } })
      ]);

      // 今日新增
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        todayPublishers,
        todayConversions,
        todayCommission
      ] = await Promise.all([
        Publisher.count({ where: { createdAt: { [sequelize.Op.gte]: today } } }),
        Conversion.count({ where: { conversionDate: { [sequelize.Op.gte]: today } } }),
        Commission.sum('amount', {
          where: {
            status: 'available',
            createdAt: { [sequelize.Op.gte]: today }
          }
        })
      ]);

      // 本月数据
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const monthlyCommission = await Commission.sum('amount', {
        where: {
          status: 'available',
          createdAt: { [sequelize.Op.gte]: thisMonth }
        }
      });

      return {
        overview: {
          totalPublishers,
          totalChannels,
          totalOffers,
          totalConversions,
          totalCommission: parseFloat(totalCommission || 0).toFixed(2)
        },
        today: {
          newPublishers: todayPublishers,
          newConversions: todayConversions,
          commission: parseFloat(todayCommission || 0).toFixed(2)
        },
        monthly: {
          commission: parseFloat(monthlyCommission || 0).toFixed(2)
        }
      };
    } catch (error) {
      logger.error('获取管理员仪表盘数据失败:', error);
      throw error;
    }
  }

  /**
   * Publisher统计概览
   */
  async getPublisherStats(publisherId) {
    try {
      const publisher = await Publisher.findByPk(publisherId);

      if (!publisher) {
        throw new Error('Publisher不存在');
      }

      // Channel统计
      const channelCount = await Channel.count({
        where: { publisherId }
      });

      // 佣金统计
      const commissionStats = await Commission.findAll({
        where: { publisherId },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('amount')), 'totalCommission'],
          [sequelize.fn('SUM', sequelize.case({
            when: { status: 'available' },
            then: sequelize.col('amount')
          })), 'availableCommission']
        ],
        raw: true
      });

      // 转化统计
      const conversionStats = await Conversion.findAll({
        where: { publisherId },
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalConversions'],
          [sequelize.fn('SUM', sequelize.col('orderAmount')), 'totalOrderAmount']
        ],
        raw: true
      });

      return {
        publisherId,
        balance: publisher.balance,
        totalEarned: publisher.totalEarned,
        channelCount,
        totalCommission: parseFloat(commissionStats[0]?.totalCommission || 0).toFixed(2),
        availableCommission: parseFloat(commissionStats[0]?.availableCommission || 0).toFixed(2),
        totalConversions: parseInt(conversionStats[0]?.totalConversions || 0),
        totalOrderAmount: parseFloat(conversionStats[0]?.totalOrderAmount || 0).toFixed(2)
      };
    } catch (error) {
      logger.error('获取Publisher统计失败:', error);
      throw error;
    }
  }

  /**
   * Channel表现排行
   */
  async getTopChannels(limit = 10) {
    try {
      const channels = await Channel.findAll({
        include: [
          {
            model: Conversion,
            as: 'conversionRecords',
            attributes: []
          }
        ],
        attributes: [
          'id',
          'name',
          'publisherId',
          [sequelize.fn('COUNT', sequelize.col('conversionRecords.id')), 'conversionCount'],
          [sequelize.fn('SUM', sequelize.col('conversionRecords.publisherCommission')), 'totalCommission']
        ],
        group: ['Channel.id'],
        order: [[sequelize.literal('totalCommission'), 'DESC']],
        limit,
        raw: false
      });

      return channels.map(ch => ({
        id: ch.id,
        name: ch.name,
        publisherId: ch.publisherId,
        conversionCount: parseInt(ch.dataValues.conversionCount || 0),
        totalCommission: parseFloat(ch.dataValues.totalCommission || 0).toFixed(2)
      }));
    } catch (error) {
      logger.error('获取Channel排行失败:', error);
      throw error;
    }
  }

  /**
   * Offer表现排行
   */
  async getTopOffers(limit = 10) {
    try {
      const offers = await Offer.findAll({
        include: [
          {
            model: Conversion,
            as: 'conversionRecords',
            attributes: []
          }
        ],
        attributes: [
          'id',
          'name',
          'commissionRate',
          [sequelize.fn('COUNT', sequelize.col('conversionRecords.id')), 'conversionCount'],
          [sequelize.fn('SUM', sequelize.col('conversionRecords.orderAmount')), 'totalOrderAmount']
        ],
        group: ['Offer.id'],
        order: [[sequelize.literal('totalOrderAmount'), 'DESC']],
        limit,
        raw: false
      });

      return offers.map(offer => ({
        id: offer.id,
        name: offer.name,
        commissionRate: offer.commissionRate,
        conversionCount: parseInt(offer.dataValues.conversionCount || 0),
        totalOrderAmount: parseFloat(offer.dataValues.totalOrderAmount || 0).toFixed(2)
      }));
    } catch (error) {
      logger.error('获取Offer排行失败:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();
