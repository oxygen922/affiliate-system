/**
 * Payment模型 - 付款记录表 ⭐扩展
 * 老王出品：财务付款记录
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    publisherId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'publishers',
        key: 'id'
      }
    },
    channelId: {
      type: DataTypes.UUID,
      references: {
        model: 'channels',
        key: 'id'
      }
    },
    withdrawalId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'withdrawals',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: '付款金额'
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD'
    },
    paymentMethod: {
      type: DataTypes.ENUM('bank_transfer', 'paypal', 'wechat', 'alipay', 'stripe'),
      allowNull: false
    },
    paymentAccountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'payment_accounts',
        key: 'id'
      }
    },
    transactionId: {
      type: DataTypes.STRING(100),
      comment: '交易ID/流水号'
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    processedAt: {
      type: DataTypes.DATE,
      comment: '付款处理时间'
    },
    completedAt: {
      type: DataTypes.DATE,
      comment: '付款完成时间'
    },
    receipt: {
      type: DataTypes.STRING(255),
      comment: '付款凭证URL'
    },
    remark: {
      type: DataTypes.TEXT
    },
    processedBy: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'payments',
    timestamps: true,
    indexes: [
      { fields: ['publisherId'] },
      { fields: ['channelId'] },
      { fields: ['withdrawalId'] },
      { fields: ['transactionId'] },
      { fields: ['status'] },
      { fields: ['completedAt'] }
    ]
  });

  return Payment;
};
