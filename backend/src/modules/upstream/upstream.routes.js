/**
 * UpstreamAffiliate Routes - 上级联盟路由
 * 老王出品：上级联盟管理API路由
 */

const express = require('express');
const router = express.Router();
const upstreamController = require('./upstream.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { adminOnly } = require('../../middlewares/role.middleware');
const { validate, upstreamAffiliateSchemas } = require('../../middlewares/validation.middleware');

/**
 * @route   POST /api/admin/upstream-affiliates
 * @desc    创建上级联盟
 * @access  Private (Admin)
 */
router.post(
  '/admin/upstream-affiliates',
  authenticate,
  adminOnly,
  validate(upstreamAffiliateSchemas.create, 'body'),
  upstreamController.createUpstream
);

/**
 * @route   GET /api/admin/upstream-affiliates
 * @desc    获取上级联盟列表
 * @access  Private (Admin)
 */
router.get(
  '/admin/upstream-affiliates',
  authenticate,
  adminOnly,
  upstreamController.getUpstreamList
);

/**
 * @route   GET /api/admin/upstream-affiliates/:id
 * @desc    获取上级联盟详情
 * @access  Private (Admin)
 */
router.get(
  '/admin/upstream-affiliates/:id',
  authenticate,
  adminOnly,
  upstreamController.getUpstreamDetail
);

/**
 * @route   PUT /api/admin/upstream-affiliates/:id
 * @desc    更新上级联盟
 * @access  Private (Admin)
 */
router.put(
  '/admin/upstream-affiliates/:id',
  authenticate,
  adminOnly,
  validate(upstreamAffiliateSchemas.update, 'body'),
  upstreamController.updateUpstream
);

/**
 * @route   DELETE /api/admin/upstream-affiliates/:id
 * @desc    删除上级联盟
 * @access  Private (Admin)
 */
router.delete(
  '/admin/upstream-affiliates/:id',
  authenticate,
  adminOnly,
  upstreamController.deleteUpstream
);

/**
 * @route   POST /api/admin/upstream-affiliates/:id/import-merchants
 * @desc    批量导入商家
 * @access  Private (Admin)
 */
router.post(
  '/admin/upstream-affiliates/:id/import-merchants',
  authenticate,
  adminOnly,
  upstreamController.importMerchants
);

/**
 * @route   GET /api/admin/upstream-affiliates/:id/stats
 * @desc    获取上级联盟统计
 * @access  Private (Admin)
 */
router.get(
  '/admin/upstream-affiliates/:id/stats',
  authenticate,
  adminOnly,
  upstreamController.getUpstreamStats
);

/**
 * @route   POST /api/admin/upstream-affiliates/:id/sync
 * @desc    手动触发同步
 * @access  Private (Admin)
 */
router.post(
  '/admin/upstream-affiliates/:id/sync',
  authenticate,
  adminOnly,
  upstreamController.manualSync
);

module.exports = router;
