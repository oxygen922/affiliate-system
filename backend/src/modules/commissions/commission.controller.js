/**
 * Commission Controller - 佣金控制器
 * 老王出品：佣金管理API
 */

const commissionService = require('./commission.service');
const { success, paginate } = require('../../utils/response.util');
const { asyncHandler } = require('../../middlewares/error.middleware');
const logger = require('../../utils/logger.util');

/**
 * 佣金控制器
 */
class CommissionController {
  /**
   * 获取我的佣金列表
   * GET /api/publisher/commissions
   */
  getMyCommissions = asyncHandler(async (req, res) => {
    const publisher = req.publisher;
    const options = req.query;

    const result = await commissionService.getPublisherCommissions(publisher.id, options);

    return paginate(res, result.commissions, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    });
  });

  /**
   * 获取佣金统计
   * GET /api/publisher/commissions/stats
   */
  getCommissionStats = asyncHandler(async (req, res) => {
    const publisher = req.publisher;
    const { channelId } = req.query;

    const stats = await commissionService.getCommissionStats(publisher.id, channelId);

    return success(res, stats);
  });

  /**
   * 计算佣金（内部调用或管理员）
   * POST /api/admin/commissions/calculate
   */
  calculateCommission = asyncHandler(async (req, res) => {
    const { conversionId } = req.body;

    const commission = await commissionService.calculateAndCreateCommission(conversionId);

    logger.info(`用户 ${req.user.id} 计算佣金成功: Conversion=${conversionId}`);
    return success(res, commission, '佣金计算成功');
  });
}

module.exports = new CommissionController();
