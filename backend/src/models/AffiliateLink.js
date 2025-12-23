/**
 * AffiliateLink模型 - 推广链接表
 * 老王出品：Channel生成的推广链接
 * 增强版本：集成了从affiliate-management-system学到的优秀追踪机制
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AffiliateLink = sequelize.define('AffiliateLink', {
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
    offerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'offers',
        key: 'id'
      }
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: '推广代码'
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '完整推广链接URL'
    },
    name: {
      type: DataTypes.STRING(100),
      comment: '链接名称'
    },
    source: {
      type: DataTypes.STRING(50),
      comment: '流量来源标识'
    },
    clicks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '总点击数'
    },
    uniqueClicks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '独立点击数'
    },
    conversions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '转化数'
    },
    commission: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '总佣金'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'expired'),
      allowNull: false,
      defaultValue: 'active'
    },

    // ============ 老王增强字段：从affiliate-management-system学到的优秀设计 ============

    // 链接验证和限制
    expiresAt: {
      type: DataTypes.DATE,
      comment: '链接过期时间（NULL表示永不过期）'
    },
    maxClicks: {
      type: DataTypes.INTEGER,
      defaultValue: null,
      comment: '最大点击数限制（NULL表示无限制）'
    },

    // 归因模型配置
    attributionModel: {
      type: DataTypes.ENUM('first-click', 'last-click', 'multi-touch', 'time-decay', 'position-based'),
      defaultValue: 'last-click',
      comment: '归因模型（默认last-click最后点击归因）'
    },
    attributionWeight: {
      type: DataTypes.DECIMAL(5, 4),
      defaultValue: 1.0000,
      comment: '归因权重（0.0000-1.0000）'
    },

    // 自定义参数（UTM等）
    customParameters: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: '自定义UTM参数 {utm_source, utm_medium, utm_campaign等}'
    },

    // 元数据（A/B测试、标签等）
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: '元数据（用于A/B测试、标签、备注等）'
    },

    // 最后统计更新时间
    lastStatsUpdate: {
      type: DataTypes.DATE,
      comment: '最后统计更新时间（用于增量统计）'
    }
  }, {
    tableName: 'affiliate_links',
    timestamps: true,
    indexes: [
      { fields: ['channelId'] },
      { fields: ['offerId'] },
      { fields: ['code'] },
      { fields: ['status'] },
      { fields: ['expiresAt'] },                          // 新增：过期时间索引
      { fields: ['attributionModel'] }                     // 新增：归因模型索引
    ]
  });

  return AffiliateLink;
};
