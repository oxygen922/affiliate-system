/**
 * UpstreamAffiliate Controller - 上级联盟控制器
 * 老王出品：上级联盟管理API
 */

const upstreamService = require('./upstream.service');
const { success, paginate } = require('../../utils/response.util');
const { asyncHandler } = require('../../middlewares/error.middleware');
const logger = require('../../utils/logger.util');

/**
 * 上级联盟控制器
 */
class UpstreamAffiliateController {
  /**
   * 创建上级联盟
   * POST /api/admin/upstream-affiliates
   */
  createUpstream = asyncHandler(async (req, res) => {
    const data = req.body;

    const upstream = await upstreamService.createUpstreamAffiliate(data);

    logger.info(`用户 ${req.user.id} 创建上级联盟成功: ${upstream.id}`);
    return success(res, upstream, '上级联盟创建成功', 201);
  });

  /**
   * 获取上级联盟列表
   * GET /api/admin/upstream-affiliates
   */
  getUpstreamList = asyncHandler(async (req, res) => {
    const options = req.query;

    const result = await upstreamService.getUpstreamAffiliates(options);

    return paginate(res, result.upstreams, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    });
  });

  /**
   * 获取上级联盟详情
   * GET /api/admin/upstream-affiliates/:id
   */
  getUpstreamDetail = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const upstream = await upstreamService.getUpstreamAffiliateById(id);

    return success(res, upstream);
  });

  /**
   * 更新上级联盟
   * PUT /api/admin/upstream-affiliates/:id
   */
  updateUpstream = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const upstream = await upstreamService.updateUpstreamAffiliate(id, updateData);

    logger.info(`用户 ${req.user.id} 更新上级联盟成功: ${id}`);
    return success(res, upstream, '上级联盟更新成功');
  });

  /**
   * 删除上级联盟
   * DELETE /api/admin/upstream-affiliates/:id
   */
  deleteUpstream = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await upstreamService.deleteUpstreamAffiliate(id);

    logger.info(`用户 ${req.user.id} 删除上级联盟成功: ${id}`);
    return success(res, result, '上级联盟删除成功');
  });

  /**
   * 批量导入商家
   * POST /api/admin/upstream-affiliates/:id/import-merchants
   */
  importMerchants = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { merchants } = req.body;

    if (!Array.isArray(merchants) || merchants.length === 0) {
      return success(res, null, '商家数据不能为空', 400);
    }

    const result = await upstreamService.importMerchants(id, merchants);

    logger.info(`用户 ${req.user.id} 导入商家到联盟 ${id}: 成功${result.success}个`);
    return success(res, result, `商家导入完成：成功${result.success}个，失败${result.failed}个`);
  });

  /**
   * 获取上级联盟统计数据
   * GET /api/admin/upstream-affiliates/:id/stats
   */
  getUpstreamStats = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const stats = await upstreamService.getUpstreamStats(id);

    return success(res, stats);
  });

  /**
   * 手动同步（预留接口）
   * POST /api/admin/upstream-affiliates/:id/sync
   */
  manualSync = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // 更新同步状态为同步中
    await upstreamService.updateSyncStatus(id, 'active');

    // TODO: 这里应该调用实际的同步API
    // 目前只是模拟
    logger.info(`用户 ${req.user.id} 手动触发联盟 ${id} 同步`);

    return success(res, { message: '同步任务已启动' }, '同步任务已启动');
  });
}

module.exports = new UpstreamAffiliateController();
