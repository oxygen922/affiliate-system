/**
 * Analytics Controller - 数据统计控制器
 * 老王出品：数据统计API
 */

const analyticsService = require('./analytics.service');
const { success } = require('../../utils/response.util');
const { asyncHandler } = require('../../middlewares/error.middleware');
const logger = require('../../utils/logger.util');

/**
 * 数据统计控制器
 */
class AnalyticsController {
  /**
   * 获取管理员仪表盘
   * GET /api/admin/analytics/dashboard
   */
  getAdminDashboard = asyncHandler(async (req, res) => {
    const stats = await analyticsService.getAdminDashboard();

    return success(res, stats);
  });

  /**
   * 获取Publisher统计
   * GET /api/publisher/analytics/overview
   */
  getPublisherStats = asyncHandler(async (req, res) => {
    const publisher = req.publisher;

    const stats = await analyticsService.getPublisherStats(publisher.id);

    return success(res, stats);
  });

  /**
   * 获取Channel表现排行
   * GET /api/admin/analytics/top-channels
   */
  getTopChannels = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const channels = await analyticsService.getTopChannels(parseInt(limit));

    return success(res, channels);
  });

  /**
   * 获取Offer表现排行
   * GET /api/admin/analytics/top-offers
   */
  getTopOffers = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const offers = await analyticsService.getTopOffers(parseInt(limit));

    return success(res, offers);
  });
}

module.exports = new AnalyticsController();
