/**
 * UpstreamAffiliate模型 - 上级联盟表 ⭐新增核心
 * 老王出品：管理对接的一级联盟平台
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UpstreamAffiliate = sequelize.define('UpstreamAffiliate', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '联盟名称：CJ, ShareASale, Impact等'
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: '联盟代码：cj, shareasale, impact'
    },
    website: {
      type: DataTypes.STRING(255),
      comment: '联盟官网'
    },
    logo: {
      type: DataTypes.STRING(255),
      comment: 'Logo URL'
    },
    description: {
      type: DataTypes.TEXT,
      comment: '联盟描述'
    },
    apiConfig: {
      type: DataTypes.JSON,
      comment: 'API配置：{apiKey, apiSecret, apiEndpoint, authMethod}'
    },
    syncStatus: {
      type: DataTypes.ENUM('active', 'inactive', 'error'),
      allowNull: false,
      defaultValue: 'inactive',
      comment: '同步状态'
    },
    lastSyncAt: {
      type: DataTypes.DATE,
      comment: '最后同步时间'
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '联盟佣金抽成比例（%）'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
    }
  }, {
    tableName: 'upstream_affiliates',
    timestamps: true,
    indexes: [
      { fields: ['code'] },
      { fields: ['status'] },
      { fields: ['syncStatus'] }
    ]
  });

  return UpstreamAffiliate;
};
