/**
 * Channel Controller - 渠道控制器
 * 老王出品：Channel API接口
 */

const channelService = require('./channel.service');
const { success, error: errorResponse, paginate } = require('../../utils/response.util');
const { asyncHandler } = require('../../middlewares/error.middleware');
const logger = require('../../utils/logger.util');

/**
 * Channel控制器
 */
class ChannelController {
  /**
   * 创建Channel
   * POST /api/publisher/channels
   */
  createChannel = asyncHandler(async (req, res) => {
    const publisher = req.publisher;
    const channelData = req.body;

    const channel = await channelService.createChannel(publisher.id, channelData);

    logger.info(`用户 ${publisher.id} 创建Channel成功: ${channel.id}`);
    return success(res, channel, 'Channel创建成功', 201);
  });

  /**
   * 获取我的Channel列表
   * GET /api/publisher/channels
   */
  getMyChannels = asyncHandler(async (req, res) => {
    const publisher = req.publisher;
    const options = req.query;

    const result = await channelService.getPublisherChannels(publisher.id, options);

    return paginate(res, result.channels, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    });
  });

  /**
   * 获取Channel详情
   * GET /api/publisher/channels/:id
   */
  getChannelDetail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const publisher = req.publisher;

    const channel = await channelService.getChannelById(id, publisher.id);

    return success(res, channel);
  });

  /**
   * 更新Channel
   * PUT /api/publisher/channels/:id
   */
  updateChannel = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const publisher = req.publisher;
    const updateData = req.body;

    const channel = await channelService.updateChannel(id, publisher.id, updateData);

    logger.info(`用户 ${publisher.id} 更新Channel成功: ${id}`);
    return success(res, channel, 'Channel更新成功');
  });

  /**
   * 删除Channel
   * DELETE /api/publisher/channels/:id
   */
  deleteChannel = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const publisher = req.publisher;

    const result = await channelService.deleteChannel(id, publisher.id);

    logger.info(`用户 ${publisher.id} 删除Channel成功: ${id}`);
    return success(res, result, 'Channel删除成功');
  });

  /**
   * Channel申请Offer
   * POST /api/publisher/channels/:id/offers
   */
  applyForOffer = asyncHandler(async (req, res) => {
    const { id: channelId } = req.params;
    const { offerId, ...applyData } = req.body;
    const publisher = req.publisher;

    const channelOffer = await channelService.applyForOffer(
      channelId,
      offerId,
      publisher.id,
      applyData
    );

    logger.info(`Channel ${channelId} 申请Offer ${offerId} 成功`);
    return success(res, channelOffer, 'Offer申请成功', 201);
  });

  /**
   * 获取Channel的Offer列表
   * GET /api/publisher/channels/:id/offers
   */
  getChannelOffers = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const publisher = req.publisher;

    const channelOffers = await channelService.getChannelOffers(id, publisher.id);

    return success(res, channelOffers);
  });

  /**
   * 获取Channel统计数据
   * GET /api/publisher/channels/:id/stats
   */
  getChannelStats = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const publisher = req.publisher;
    const { startDate, endDate } = req.query;

    const stats = await channelService.getChannelStats(
      id,
      publisher.id,
      startDate,
      endDate
    );

    return success(res, stats);
  });

  /**
   * 【管理员】获取所有Channel列表
   * GET /api/admin/channels
   */
  adminGetAllChannels = asyncHandler(async (req, res) => {
    const options = req.query;

    // 管理员可以查看所有Channel，不限制publisherId
    // 复用service方法，但传null作为publisherId
    const result = await channelService.getPublisherChannels(null, options);

    return paginate(res, result.channels, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    });
  });

  /**
   * 【管理员】获取Channel详情
   * GET /api/admin/channels/:id
   */
  adminGetChannelDetail = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // 管理员查看，不限制publisherId
    const channel = await channelService.getChannelById(id);

    return success(res, channel);
  });

  /**
   * 【管理员】更新Channel状态
   * PUT /api/admin/channels/:id/status
   */
  adminUpdateChannelStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const { Channel } = require('../../models');
    const channel = await Channel.findByPk(id);

    if (!channel) {
      return errorResponse(res, 'Channel不存在', 404);
    }

    await channel.update({ status });

    logger.info(`管理员更新Channel ${id} 状态为 ${status}`);
    return success(res, channel, 'Channel状态更新成功');
  });
}

module.exports = new ChannelController();
