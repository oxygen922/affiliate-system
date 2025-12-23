/**
 * Analytics Routes - 数据统计路由
 * 老王出品：数据统计API路由
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { adminOnly, publisherOrAdmin } = require('../../middlewares/role.middleware');

/**
 * @route   GET /api/admin/analytics/dashboard
 * @desc    获取管理员仪表盘数据
 * @access  Private (Admin)
 */
router.get(
  '/admin/analytics/dashboard',
  authenticate,
  adminOnly,
  analyticsController.getAdminDashboard
);

/**
 * @route   GET /api/admin/analytics/top-channels
 * @desc    获取Channel表现排行
 * @access  Private (Admin)
 */
router.get(
  '/admin/analytics/top-channels',
  authenticate,
  adminOnly,
  analyticsController.getTopChannels
);

/**
 * @route   GET /api/admin/analytics/top-offers
 * @desc    获取Offer表现排行
 * @access  Private (Admin)
 */
router.get(
  '/admin/analytics/top-offers',
  authenticate,
  adminOnly,
  analyticsController.getTopOffers
);

/**
 * @route   GET /api/publisher/analytics/overview
 * @desc    获取Publisher统计概览
 * @access  Private (Publisher)
 */
router.get(
  '/publisher/analytics/overview',
  authenticate,
  publisherOrAdmin,
  analyticsController.getPublisherStats
);

module.exports = router;
