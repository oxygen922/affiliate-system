/**
 * Commission Routes - 佣金路由
 * 老王出品：佣金管理API路由
 */

const express = require('express');
const router = express.Router();
const commissionController = require('./commission.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { publisherOrAdmin, adminOnly } = require('../../middlewares/role.middleware');

/**
 * @route   GET /api/publisher/commissions
 * @desc    获取我的佣金列表
 * @access  Private (Publisher)
 */
router.get(
  '/publisher/commissions',
  authenticate,
  publisherOrAdmin,
  commissionController.getMyCommissions
);

/**
 * @route   GET /api/publisher/commissions/stats
 * @desc    获取佣金统计
 * @access  Private (Publisher)
 */
router.get(
  '/publisher/commissions/stats',
  authenticate,
  publisherOrAdmin,
  commissionController.getCommissionStats
);

/**
 * @route   POST /api/admin/commissions/calculate
 * @desc    计算佣金
 * @access  Private (Admin)
 */
router.post(
  '/admin/commissions/calculate',
  authenticate,
  adminOnly,
  commissionController.calculateCommission
);

module.exports = router;
