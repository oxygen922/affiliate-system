/**
 * Offer模型 - Offer表
 * 老王出品：Offer推广信息
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Offer = sequelize.define('Offer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    merchantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'merchants',
        key: 'id'
      }
    },
    offerIdInPlatform: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '在原联盟平台的Offer ID'
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: 'Offer名称'
    },
    description: {
      type: DataTypes.TEXT
    },
    offerType: {
      type: DataTypes.ENUM('cpa', 'cpc', 'cpl', 'cps', 'hybrid'),
      allowNull: false,
      defaultValue: 'cps',
      comment: 'Offer类型'
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      comment: '佣金率（%）或固定金额'
    },
    commissionType: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      allowNull: false,
      defaultValue: 'percentage'
    },
    countries: {
      type: DataTypes.JSON,
      comment: '允许的国家：["US", "CA", "UK"]'
    },
    trackingLink: {
      type: DataTypes.TEXT,
      comment: '原联盟追踪链接'
    },
    landingPage: {
      type: DataTypes.STRING(255),
      comment: '落地页URL'
    },
    creativeAssets: {
      type: DataTypes.JSON,
      comment: '创意素材：[{type, url, size}]'
    },
    restrictions: {
      type: DataTypes.TEXT,
      comment: '推广限制说明'
    },
    startDate: {
      type: DataTypes.DATE
    },
    endDate: {
      type: DataTypes.DATE
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'pending', 'suspended'),
      allowNull: false,
      defaultValue: 'active'
    },
    needsApproval: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否需要审核'
    }
  }, {
    tableName: 'offers',
    timestamps: true,
    indexes: [
      { fields: ['merchantId'] },
      { fields: ['offerType'] },
      { fields: ['status'] },
      { fields: ['commissionRate'] }
    ]
  });

  return Offer;
};
