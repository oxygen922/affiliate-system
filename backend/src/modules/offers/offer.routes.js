/**
 * Offer Routes - Offer路由
 * 老王出品：Offer管理API路由
 */

const express = require('express');
const router = express.Router();
const offerController = require('./offer.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { adminOnly, publisherOrAdmin } = require('../../middlewares/role.middleware');

// 管理员路由

/**
 * @route   POST /api/admin/offers
 * @desc    创建Offer
 * @access  Private (Admin)
 */
router.post(
  '/admin/offers',
  authenticate,
  adminOnly,
  offerController.createOffer
);

/**
 * @route   GET /api/admin/offers
 * @desc    获取Offer列表
 * @access  Private (Admin)
 */
router.get(
  '/admin/offers',
  authenticate,
  adminOnly,
  offerController.getOffers
);

/**
 * @route   GET /api/admin/offers/:id
 * @desc    获取Offer详情
 * @access  Private (Admin)
 */
router.get(
  '/admin/offers/:id',
  authenticate,
  adminOnly,
  offerController.getOfferDetail
);

/**
 * @route   PUT /api/admin/offers/:id
 * @desc    更新Offer
 * @access  Private (Admin)
 */
router.put(
  '/admin/offers/:id',
  authenticate,
  adminOnly,
  offerController.updateOffer
);

/**
 * @route   DELETE /api/admin/offers/:id
 * @desc    删除Offer
 * @access  Private (Admin)
 */
router.delete(
  '/admin/offers/:id',
  authenticate,
  adminOnly,
  offerController.deleteOffer
);

/**
 * @route   POST /api/admin/offers/:id/approve
 * @desc    审核Offer
 * @access  Private (Admin)
 */
router.post(
  '/admin/offers/:id/approve',
  authenticate,
  adminOnly,
  offerController.approveOffer
);

// Publisher路由

/**
 * @route   GET /api/publisher/offers/market
 * @desc    Offer市场
 * @access  Private (Publisher)
 */
router.get(
  '/publisher/offers/market',
  authenticate,
  publisherOrAdmin,
  offerController.getOfferMarket
);

module.exports = router;
