/**
 * Offer Controller - Offer控制器
 * 老王出品：Offer管理API
 */

const offerService = require('./offer.service');
const { success, paginate } = require('../../utils/response.util');
const { asyncHandler } = require('../../middlewares/error.middleware');
const logger = require('../../utils/logger.util');

/**
 * Offer控制器
 */
class OfferController {
  /**
   * 创建Offer
   * POST /api/admin/offers
   */
  createOffer = asyncHandler(async (req, res) => {
    const offerData = req.body;

    const offer = await offerService.createOffer(offerData);

    logger.info(`用户 ${req.user.id} 创建Offer成功: ${offer.id}`);
    return success(res, offer, 'Offer创建成功', 201);
  });

  /**
   * 获取Offer列表（管理员）
   * GET /api/admin/offers
   */
  getOffers = asyncHandler(async (req, res) => {
    const options = req.query;

    const result = await offerService.getOffers(options);

    return paginate(res, result.offers, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    });
  });

  /**
   * 获取Offer详情
   * GET /api/admin/offers/:id
   */
  getOfferDetail = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const offer = await offerService.getOfferById(id);

    return success(res, offer);
  });

  /**
   * 更新Offer
   * PUT /api/admin/offers/:id
   */
  updateOffer = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const offer = await offerService.updateOffer(id, updateData);

    logger.info(`用户 ${req.user.id} 更新Offer成功: ${id}`);
    return success(res, offer, 'Offer更新成功');
  });

  /**
   * 删除Offer
   * DELETE /api/admin/offers/:id
   */
  deleteOffer = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await offerService.deleteOffer(id);

    logger.info(`用户 ${req.user.id} 删除Offer成功: ${id}`);
    return success(res, result, 'Offer删除成功');
  });

  /**
   * 审核Offer
   * POST /api/admin/offers/:id/approve
   */
  approveOffer = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;

    const offer = await offerService.approveOffer(id, status, reason);

    logger.info(`用户 ${req.user.id} 审核Offer成功: ${id}, Status: ${status}`);
    return success(res, offer, `Offer${status === 'approved' ? '通过' : '拒绝'}审核`);
  });

  /**
   * Offer市场（Publisher浏览）
   * GET /api/publisher/offers/market
   */
  getOfferMarket = asyncHandler(async (req, res) => {
    const options = req.query;

    const result = await offerService.getOfferMarket(options);

    return paginate(res, result.offers, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    });
  });
}

module.exports = new OfferController();
