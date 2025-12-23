/**
 * PaymentAccount Controller - 收款账户控制器
 * 老王出品：收款账户管理API
 */

const paymentAccountService = require('./payment-account.service');
const { success, paginate } = require('../../utils/response.util');
const { asyncHandler } = require('../../middlewares/error.middleware');
const logger = require('../../utils/logger.util');

/**
 * 收款账户控制器
 */
class PaymentAccountController {
  /**
   * 创建收款账户
   * POST /api/publisher/payment-accounts
   */
  createAccount = asyncHandler(async (req, res) => {
    const publisher = req.publisher;
    const accountData = req.body;

    const account = await paymentAccountService.createPaymentAccount(publisher.id, accountData);

    logger.info(`用户 ${publisher.id} 创建收款账户成功: ${account.id}`);
    return success(res, account, '收款账户创建成功', 201);
  });

  /**
   * 获取我的收款账户列表
   * GET /api/publisher/payment-accounts
   */
  getMyAccounts = asyncHandler(async (req, res) => {
    const publisher = req.publisher;
    const options = req.query;

    const result = await paymentAccountService.getPublisherAccounts(publisher.id, options);

    return paginate(res, result.accounts, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    });
  });

  /**
   * 获取收款账户详情
   * GET /api/publisher/payment-accounts/:id
   */
  getAccountDetail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const publisher = req.publisher;

    const account = await paymentAccountService.getAccountById(id, publisher.id);

    return success(res, account);
  });

  /**
   * 更新收款账户
   * PUT /api/publisher/payment-accounts/:id
   */
  updateAccount = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const publisher = req.publisher;
    const updateData = req.body;

    const account = await paymentAccountService.updatePaymentAccount(id, publisher.id, updateData);

    logger.info(`用户 ${publisher.id} 更新收款账户成功: ${id}`);
    return success(res, account, '收款账户更新成功');
  });

  /**
   * 删除收款账户
   * DELETE /api/publisher/payment-accounts/:id
   */
  deleteAccount = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const publisher = req.publisher;

    const result = await paymentAccountService.deletePaymentAccount(id, publisher.id);

    logger.info(`用户 ${publisher.id} 删除收款账户成功: ${id}`);
    return success(res, result, '收款账户删除成功');
  });

  /**
   * 设置默认账户
   * PUT /api/publisher/payment-accounts/:id/set-default
   */
  setDefaultAccount = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const publisher = req.publisher;

    const account = await paymentAccountService.setDefaultAccount(id, publisher.id);

    logger.info(`用户 ${publisher.id} 设置默认账户成功: ${id}`);
    return success(res, account, '默认账户设置成功');
  });

  /**
   * 获取默认账户
   * GET /api/publisher/payment-accounts/default
   */
  getDefaultAccount = asyncHandler(async (req, res) => {
    const publisher = req.publisher;

    const account = await paymentAccountService.getDefaultAccount(publisher.id);

    return success(res, account);
  });
}

module.exports = new PaymentAccountController();
