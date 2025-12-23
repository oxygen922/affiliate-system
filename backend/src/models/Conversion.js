/**
 * Conversion模型 - 转化记录表
 * 老王出品：记录所有转化
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Conversion = sequelize.define('Conversion', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    channelId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'channels',
        key: 'id'
      }
    },
    linkId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'affiliate_links',
        key: 'id'
      }
    },
    offerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'offers',
        key: 'id'
      }
    },
    clickId: {
      type: DataTypes.UUID,
      references: {
        model: 'clicks',
        key: 'id'
      }
    },
    orderId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '订单ID'
    },
    orderAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: '订单金额'
    },
    commission: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: '佣金金额'
    },
    publisherCommission: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'Publisher获得的佣金'
    },
    platformCommission: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: '平台获得的佣金'
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'paid'),
      allowNull: false,
      defaultValue: 'pending',
      comment: '转化状态'
    },
    conversionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '转化时间'
    },
    customerInfo: {
      type: DataTypes.JSON,
      comment: '客户信息（脱敏）：{country, device, newCustomer}'
    },
    products: {
      type: DataTypes.JSON,
      comment: '商品信息：[{id, name, quantity, price}]'
    },
    rejectionReason: {
      type: DataTypes.TEXT
    },
    approvedAt: {
      type: DataTypes.DATE
    },
    paidAt: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'conversions',
    timestamps: true,
    indexes: [
      { fields: ['channelId'] },
      { fields: ['linkId'] },
      { fields: ['offerId'] },
      { fields: ['orderId'] },
      { fields: ['status'] },
      { fields: ['conversionDate'] }
    ]
  });

  return Conversion;
};
