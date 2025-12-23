/**
 * PaymentAccount模型 - 收款账户表 ⭐新增
 * 老王出品：Publisher收款账户管理
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PaymentAccount = sequelize.define('PaymentAccount', {
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
    accountType: {
      type: DataTypes.ENUM('bank', 'paypal', 'wechat', 'alipay', 'stripe'),
      allowNull: false,
      comment: '账户类型'
    },
    accountName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '账户名称'
    },
    accountNumber: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '账号'
    },
    bankInfo: {
      type: DataTypes.JSON,
      comment: '银行信息：{bankName, routingNumber, swiftCode, bankAddress}'
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD'
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否默认账户'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
    }
  }, {
    tableName: 'payment_accounts',
    timestamps: true,
    indexes: [
      { fields: ['publisherId'] },
      { fields: ['accountType'] },
      { fields: ['isDefault'] }
    ]
  });

  return PaymentAccount;
};
