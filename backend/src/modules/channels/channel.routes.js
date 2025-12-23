/**
 * Channel Routes - 渠道路由
 * 老王出品：Channel API路由定义
 */

const express = require('express');
const router = express.Router();
const channelController = require('./channel.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { publisherOrAdmin, adminOnly } = require('../../middlewares/role.middleware');
const { validate, channelSchemas, channelOfferSchemas } = require('../../middlewares/validation.middleware');

// Publisher端路由

/**
 * @route   POST /api/publisher/channels
 * @desc    创建Channel
 * @access  Private (Publisher)
 */
router.post(
  '/publisher/channels',
  authenticate,
  publisherOrAdmin,
  validate(channelSchemas.create, 'body'),
  channelController.createChannel
);

/**
 * @route   GET /api/publisher/channels
 * @desc    获取我的Channel列表
 * @access  Private (Publisher)
 */
router.get(
  '/publisher/channels',
  authenticate,
  publisherOrAdmin,
  validate(channelSchemas.query, 'query'),
  channelController.getMyChannels
);

/**
 * @route   GET /api/publisher/channels/:id
 * @desc    获取Channel详情
 * @access  Private (Publisher)
 */
router.get(
  '/publisher/channels/:id',
  authenticate,
  publisherOrAdmin,
  channelController.getChannelDetail
);

/**
 * @route   PUT /api/publisher/channels/:id
 * @desc    更新Channel
 * @access  Private (Publisher)
 */
router.put(
  '/publisher/channels/:id',
  authenticate,
  publisherOrAdmin,
  validate(channelSchemas.update, 'body'),
  channelController.updateChannel
);

/**
 * @route   DELETE /api/publisher/channels/:id
 * @desc    删除Channel
 * @access  Private (Publisher)
 */
router.delete(
  '/publisher/channels/:id',
  authenticate,
  publisherOrAdmin,
  channelController.deleteChannel
);

/**
 * @route   POST /api/publisher/channels/:id/offers
 * @desc    Channel申请Offer
 * @access  Private (Publisher)
 */
router.post(
  '/publisher/channels/:id/offers',
  authenticate,
  publisherOrAdmin,
  validate(channelOfferSchemas.create, 'body'),
  channelController.applyForOffer
);

/**
 * @route   GET /api/publisher/channels/:id/offers
 * @desc    获取Channel的Offer列表
 * @access  Private (Publisher)
 */
router.get(
  '/publisher/channels/:id/offers',
  authenticate,
  publisherOrAdmin,
  channelController.getChannelOffers
);

/**
 * @route   GET /api/publisher/channels/:id/stats
 * @desc    获取Channel统计数据
 * @access  Private (Publisher)
 */
router.get(
  '/publisher/channels/:id/stats',
  authenticate,
  publisherOrAdmin,
  channelController.getChannelStats
);

// 管理员路由

/**
 * @route   GET /api/admin/channels
 * @desc    获取所有Channel列表
 * @access  Private (Admin)
 */
router.get(
  '/admin/channels',
  authenticate,
  adminOnly,
  validate(channelSchemas.query, 'query'),
  channelController.adminGetAllChannels
);

/**
 * @route   GET /api/admin/channels/:id
 * @desc    获取Channel详情（管理员）
 * @access  Private (Admin)
 */
router.get(
  '/admin/channels/:id',
  authenticate,
  adminOnly,
  channelController.adminGetChannelDetail
);

/**
 * @route   PUT /api/admin/channels/:id/status
 * @desc    更新Channel状态
 * @access  Private (Admin)
 */
router.put(
  '/admin/channels/:id/status',
  authenticate,
  adminOnly,
  channelController.adminUpdateChannelStatus
);

module.exports = router;
