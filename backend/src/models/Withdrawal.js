/**
 * Withdrawal模型 - 提现申请表
 * 老王出品：Publisher提现申请
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Withdrawal = sequelize.define('Withdrawal', {
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
      },
      comment: '指定渠道提现，null表示全部余额'
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: '提现金额'
    },
    fee: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '手续费'
    },
    actualAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: '实际到账金额'
    },
    paymentAccountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'payment_accounts',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'processing', 'completed', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    requestedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    approvedAt: {
      type: DataTypes.DATE
    },
    approvedBy: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    rejectionReason: {
      type: DataTypes.TEXT
    },
    notes: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'withdrawals',
    timestamps: true,
    indexes: [
      { fields: ['publisherId'] },
      { fields: ['channelId'] },
      { fields: ['status'] },
      { fields: ['requestedAt'] }
    ]
  });

  return Withdrawal;
};
