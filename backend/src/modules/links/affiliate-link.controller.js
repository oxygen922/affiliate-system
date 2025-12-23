/**
 * AffiliateLink Controller - 推广链接控制器
 * 老王出品：推广链接管理API
 */

const affiliateLinkService = require('./affiliate-link.service');
const { success, paginate } = require('../../utils/response.util');
const { asyncHandler } = require('../../middlewares/error.middleware');
const logger = require('../../utils/logger.util');

/**
 * 推广链接控制器
 */
class AffiliateLinkController {
  /**
   * 创建推广链接
   * POST /api/publisher/links
   */
  createLink = asyncHandler(async (req, res) => {
    const publisher = req.publisher;
    const { channelId, offerId, ...linkData } = req.body;

    const link = await affiliateLinkService.createAffiliateLink(
      channelId,
      offerId,
      publisher.id,
      linkData
    );

    logger.info(`用户 ${publisher.id} 创建推广链接成功: ${link.id}`);
    return success(res, link, '推广链接创建成功', 201);
  });

  /**
   * 获取Channel的推广链接列表
   * GET /api/publisher/channels/:id/links
   */
  getChannelLinks = asyncHandler(async (req, res) => {
    const { id: channelId } = req.params;
    const publisher = req.publisher;
    const options = req.query;

    const result = await affiliateLinkService.getChannelLinks(
      channelId,
      publisher.id,
      options
    );

    return paginate(res, result.links, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    });
  });

  /**
   * 获取推广链接详情
   * GET /api/publisher/links/:id
   */
  getLinkDetail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const publisher = req.publisher;

    const link = await affiliateLinkService.getLinkById(id, publisher.id);

    return success(res, link);
  });

  /**
   * 更新推广链接
   * PUT /api/publisher/links/:id
   */
  updateLink = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const publisher = req.publisher;
    const updateData = req.body;

    const link = await affiliateLinkService.updateLink(id, publisher.id, updateData);

    logger.info(`用户 ${publisher.id} 更新推广链接成功: ${id}`);
    return success(res, link, '推广链接更新成功');
  });

  /**
   * 删除推广链接
   * DELETE /api/publisher/links/:id
   */
  deleteLink = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const publisher = req.publisher;

    const result = await affiliateLinkService.deleteLink(id, publisher.id);

    logger.info(`用户 ${publisher.id} 删除推广链接成功: ${id}`);
    return success(res, result, '推广链接删除成功');
  });

  /**
   * 获取链接统计数据
   * GET /api/publisher/links/:id/stats
   */
  getLinkStats = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const publisher = req.publisher;
    const { startDate, endDate } = req.query;

    const stats = await affiliateLinkService.getLinkStats(
      id,
      publisher.id,
      startDate,
      endDate
    );

    return success(res, stats);
  });

  /**
   * 记录点击（公开接口，用于追踪）
   * POST /api/track/click
   */
  trackClick = asyncHandler(async (req, res) => {
    const { code, ...clickData } = req.body;

    // 根据code查找link
    const { AffiliateLink } = require('../../models');
    const link = await AffiliateLink.findOne({
      where: { code, status: 'active' }
    });

    if (!link) {
      return success(res, null, '推广链接不存在或未激活', 404);
    }

    const click = await affiliateLinkService.recordClick(link.id, clickData);

    return success(res, { clickId: click.id }, '点击记录成功');
  });
}

module.exports = new AffiliateLinkController();
