/**
 * Commission模型 - 佣金记录表
 * 老王出品：Publisher佣金明细
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Commission = sequelize.define('Commission', {
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
      allowNull: false,
      references: {
        model: 'channels',
        key: 'id'
      }
    },
    conversionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'conversions',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: '佣金金额'
    },
    status: {
      type: DataTypes.ENUM('pending', 'available', 'locked', 'withdrawn', 'paid'),
      allowNull: false,
      default: 'pending',
      comment: '佣金状态'
    },
    availableAt: {
      type: DataTypes.DATE,
      comment: '可提现时间（过了退货期）'
    },
    lockedUntil: {
      type: DataTypes.DATE,
      comment: '锁定时间'
    },
    withdrawalId: {
      type: DataTypes.UUID,
      references: {
        model: 'withdrawals',
        key: 'id'
      }
    },
    paymentId: {
      type: DataTypes.UUID,
      references: {
        model: 'payments',
        key: 'id'
      }
    }
  }, {
    tableName: 'commissions',
    timestamps: true,
    indexes: [
      { fields: ['publisherId'] },
      { fields: ['channelId'] },
      { fields: ['conversionId'] },
      { fields: ['status'] },
      { fields: ['availableAt'] }
    ]
  });

  return Commission;
};
