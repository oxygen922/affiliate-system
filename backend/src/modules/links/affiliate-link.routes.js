/**
 * AffiliateLink Routes - 推广链接路由
 * 老王出品：推广链接管理API路由
 */

const express = require('express');
const router = express.Router();
const affiliateLinkController = require('./affiliate-link.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { publisherOrAdmin } = require('../../middlewares/role.middleware');

/**
 * @route   POST /api/publisher/links
 * @desc    创建推广链接
 * @access  Private (Publisher)
 */
router.post(
  '/publisher/links',
  authenticate,
  publisherOrAdmin,
  affiliateLinkController.createLink
);

/**
 * @route   GET /api/publisher/channels/:id/links
 * @desc    获取Channel的推广链接列表
 * @access  Private (Publisher)
 */
router.get(
  '/publisher/channels/:id/links',
  authenticate,
  publisherOrAdmin,
  affiliateLinkController.getChannelLinks
);

/**
 * @route   GET /api/publisher/links/:id
 * @desc    获取推广链接详情
 * @access  Private (Publisher)
 */
router.get(
  '/publisher/links/:id',
  authenticate,
  publisherOrAdmin,
  affiliateLinkController.getLinkDetail
);

/**
 * @route   PUT /api/publisher/links/:id
 * @desc    更新推广链接
 * @access  Private (Publisher)
 */
router.put(
  '/publisher/links/:id',
  authenticate,
  publisherOrAdmin,
  affiliateLinkController.updateLink
);

/**
 * @route   DELETE /api/publisher/links/:id
 * @desc    删除推广链接
 * @access  Private (Publisher)
 */
router.delete(
  '/publisher/links/:id',
  authenticate,
  publisherOrAdmin,
  affiliateLinkController.deleteLink
);

/**
 * @route   GET /api/publisher/links/:id/stats
 * @desc    获取链接统计数据
 * @access  Private (Publisher)
 */
router.get(
  '/publisher/links/:id/stats',
  authenticate,
  publisherOrAdmin,
  affiliateLinkController.getLinkStats
);

/**
 * @route   POST /api/track/click
 * @desc    记录点击（公开接口）
 * @access  Public
 */
router.post(
  '/track/click',
  affiliateLinkController.trackClick
);

module.exports = router;
