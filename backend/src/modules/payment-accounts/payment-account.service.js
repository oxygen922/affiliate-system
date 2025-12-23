/**
 * PaymentAccount Service - 收款账户业务逻辑层
 * 老王出品：Publisher收款账户管理
 */

const { PaymentAccount, Publisher } = require('../../models');
const { sequelize } = require('../../config/database');
const logger = require('../../utils/logger.util');

/**
 * 收款账户服务类
 */
class PaymentAccountService {
  /**
   * 创建收款账户
   */
  async createPaymentAccount(publisherId, accountData) {
    try {
      // 如果设置为默认账户，取消其他默认账户
      if (accountData.isDefault) {
        await PaymentAccount.update(
          { isDefault: false },
          { where: { publisherId, isDefault: true } }
        );
      }

      const account = await PaymentAccount.create({
        publisherId,
        ...accountData
      });

      logger.info(`收款账户创建成功: ${account.id}, Publisher: ${publisherId}`);
      return account;
    } catch (error) {
      logger.error('创建收款账户失败:', error);
      throw error;
    }
  }

  /**
   * 获取Publisher的收款账户列表
   */
  async getPublisherAccounts(publisherId, options = {}) {
    const {
      page = 1,
      pageSize = 20,
      accountType,
      status
    } = options;

    const where = { publisherId };

    if (accountType) where.accountType = accountType;
    if (status) where.status = status;

    const { count, rows } = await PaymentAccount.findAndCountAll({
      where,
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });

    return {
      accounts: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(count / pageSize)
    };
  }

  /**
   * 获取收款账户详情
   */
  async getAccountById(accountId, publisherId = null) {
    const where = { id: accountId };

    if (publisherId) {
      where.publisherId = publisherId;
    }

    const account = await PaymentAccount.findOne({
      where
    });

    if (!account) {
      throw new Error('收款账户不存在');
    }

    return account;
  }

  /**
   * 更新收款账户
   */
  async updatePaymentAccount(accountId, publisherId, updateData) {
    const account = await PaymentAccount.findOne({
      where: { id: accountId, publisherId }
    });

    if (!account) {
      throw new Error('收款账户不存在或无权限访问');
    }

    // 如果设置为默认，取消其他默认账户
    if (updateData.isDefault) {
      await PaymentAccount.update(
        { isDefault: false },
        { where: { publisherId, id: { [sequelize.Op.ne]: accountId } } }
      );
    }

    await account.update(updateData);
    logger.info(`收款账户更新成功: ${accountId}`);

    return account;
  }

  /**
   * 删除收款账户
   */
  async deletePaymentAccount(accountId, publisherId) {
    const account = await PaymentAccount.findOne({
      where: { id: accountId, publisherId }
    });

    if (!account) {
      throw new Error('收款账户不存在或无权限访问');
    }

    // 检查是否有未完成的提现申请
    const { Withdrawal } = require('../../models');
    const pendingWithdrawals = await Withdrawal.count({
      where: {
        paymentAccountId: accountId,
        status: { [sequelize.Op.in]: ['pending', 'approved', 'processing'] }
      }
    });

    if (pendingWithdrawals > 0) {
      throw new Error('该账户有未完成的提现申请，无法删除');
    }

    await account.destroy();
    logger.info(`收款账户删除成功: ${accountId}`);

    return { message: '收款账户删除成功' };
  }

  /**
   * 设置默认账户
   */
  async setDefaultAccount(accountId, publisherId) {
    const account = await PaymentAccount.findOne({
      where: { id: accountId, publisherId }
    });

    if (!account) {
      throw new Error('收款账户不存在或无权限访问');
    }

    // 取消所有默认账户
    await PaymentAccount.update(
      { isDefault: false },
      { where: { publisherId } }
    );

    // 设置当前账户为默认
    await account.update({ isDefault: true });

    logger.info(`设置默认收款账户成功: ${accountId}, Publisher: ${publisherId}`);

    return account;
  }

  /**
   * 获取默认账户
   */
  async getDefaultAccount(publisherId) {
    const account = await PaymentAccount.findOne({
      where: { publisherId, isDefault: true, status: 'active' }
    });

    return account;
  }
}

module.exports = new PaymentAccountService();
