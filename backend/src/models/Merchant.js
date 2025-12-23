/**
 * Merchant模型 - 商家表 ⭐重新设计
 * 老王出品：从上级联盟导入的商家信息
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Merchant = sequelize.define('Merchant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    upstreamAffiliateId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'upstream_affiliates',
        key: 'id'
      },
      comment: '所属上级联盟'
    },
    merchantIdInPlatform: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '在原联盟平台的商家ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '商家名称'
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    logo: {
      type: DataTypes.STRING(255),
      comment: '商家Logo'
    },
    description: {
      type: DataTypes.TEXT
    },
    category: {
      type: DataTypes.STRING(50),
      comment: '商家分类'
    },
    tags: {
      type: DataTypes.JSON,
      comment: '商家标签：["blacklist", "premium", "verified"]'
    },
    geoTargeting: {
      type: DataTypes.JSON,
      comment: '地理限制：["US", "CA", "UK"]'
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '默认佣金率（%）'
    },
    cookieDuration: {
      type: DataTypes.INTEGER,
      comment: 'Cookie有效期（天）'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      allowNull: false,
      defaultValue: 'active'
    },
    syncStatus: {
      type: DataTypes.ENUM('synced', 'pending', 'error'),
      allowNull: false,
      defaultValue: 'synced',
      comment: '同步状态'
    },
    lastSyncAt: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'merchants',
    timestamps: true,
    indexes: [
      { fields: ['upstreamAffiliateId'] },
      { fields: ['merchantIdInPlatform'] },
      { fields: ['status'] },
      { fields: ['category'] }
    ]
  });

  return Merchant;
};
