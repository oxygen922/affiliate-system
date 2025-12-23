/**
 * PaymentAccount Routes - 收款账户路由
 * 老王出品：收款账户管理API路由
 */

const express = require('express');
const router = express.Router();
const paymentAccountController = require('./payment-account.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { publisherOrAdmin } = require('../../middlewares/role.middleware');
const { validate, paymentAccountSchemas } = require('../../middlewares/validation.middleware');

/**
 * @route   POST /api/publisher/payment-accounts
 * @desc    创建收款账户
 * @access  Private (Publisher)
 */
router.post(
  '/publisher/payment-accounts',
  authenticate,
  publisherOrAdmin,
  validate(paymentAccountSchemas.create, 'body'),
  paymentAccountController.createAccount
);

/**
 * @route   GET /api/publisher/payment-accounts
 * @desc    获取我的收款账户列表
 * @access  Private (Publisher)
 */
router.get(
  '/publisher/payment-accounts',
  authenticate,
  publisherOrAdmin,
  paymentAccountController.getMyAccounts
);

/**
 * @route   GET /api/publisher/payment-accounts/default
 * @desc    获取默认账户
 * @access  Private (Publisher)
 */
router.get(
  '/publisher/payment-accounts/default',
  authenticate,
  publisherOrAdmin,
  paymentAccountController.getDefaultAccount
);

/**
 * @route   GET /api/publisher/payment-accounts/:id
 * @desc    获取收款账户详情
 * @access  Private (Publisher)
 */
router.get(
  '/publisher/payment-accounts/:id',
  authenticate,
  publisherOrAdmin,
  paymentAccountController.getAccountDetail
);

/**
 * @route   PUT /api/publisher/payment-accounts/:id
 * @desc    更新收款账户
 * @access  Private (Publisher)
 */
router.put(
  '/publisher/payment-accounts/:id',
  authenticate,
  publisherOrAdmin,
  validate(paymentAccountSchemas.update, 'body'),
  paymentAccountController.updateAccount
);

/**
 * @route   PUT /api/publisher/payment-accounts/:id/set-default
 * @desc    设置默认账户
 * @access  Private (Publisher)
 */
router.put(
  '/publisher/payment-accounts/:id/set-default',
  authenticate,
  publisherOrAdmin,
  paymentAccountController.setDefaultAccount
);

/**
 * @route   DELETE /api/publisher/payment-accounts/:id
 * @desc    删除收款账户
 * @access  Private (Publisher)
 */
router.delete(
  '/publisher/payment-accounts/:id',
  authenticate,
  publisherOrAdmin,
  paymentAccountController.deleteAccount
);

module.exports = router;
