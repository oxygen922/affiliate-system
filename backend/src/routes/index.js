/**
 * 主路由文件
 * 老王出品：整合所有API路由
 */

const express = require('express');
const router = express.Router();

// 导入各模块路由
const authRoutes = require('../modules/auth/auth.routes');
const channelRoutes = require('../modules/channels/channel.routes');
const upstreamRoutes = require('../modules/upstream/upstream.routes');
const paymentAccountRoutes = require('../modules/payment-accounts/payment-account.routes');
const linkRoutes = require('../modules/links/affiliate-link.routes');
const commissionRoutes = require('../modules/commissions/commission.routes');
const analyticsRoutes = require('../modules/analytics/analytics.routes');
const offerRoutes = require('../modules/offers/offer.routes');

// 挂载路由
router.use('/', authRoutes);
router.use('/', channelRoutes);
router.use('/', upstreamRoutes);
router.use('/', paymentAccountRoutes);
router.use('/', linkRoutes);
router.use('/', commissionRoutes);
router.use('/', analyticsRoutes);
router.use('/', offerRoutes);

/**
 * @route   GET /api
 * @desc    API信息
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({
    name: 'Affiliate Platform API',
    version: '1.0.0',
    description: '次级联盟营销平台API',
    endpoints: {
      auth: '/api/auth/*',
      channels: '/api/{publisher,admin}/channels/*',
      upstream: '/api/admin/upstream-affiliates/*',
      paymentAccounts: '/api/publisher/payment-accounts/*',
      offers: '/api/{publisher,admin}/offers/*'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
