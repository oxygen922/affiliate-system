/**
 * Click模型 - 点击记录表
 * 老王出品：记录所有点击
 * 增强版本：集成了从affiliate-management-system学到的归因追踪机制
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Click = sequelize.define('Click', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    linkId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'affiliate_links',
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
    offerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'offers',
        key: 'id'
      },
      comment: '关联的Offer ID（便于快速查询）'
    },
    referralCode: {
      type: DataTypes.STRING(20),
      comment: '推荐码（对应AffiliateLink.code）'
    },

    // 用户识别
    customerId: {
      type: DataTypes.STRING(100),
      comment: '客户/用户唯一标识（用于去重和归因）'
    },
    sessionId: {
      type: DataTypes.STRING(100),
      comment: '会话ID'
    },

    // 环境信息
    ip: {
      type: DataTypes.STRING(45),
      comment: 'IP地址'
    },
    userAgent: {
      type: DataTypes.TEXT,
      comment: 'User Agent'
    },
    referrer: {
      type: DataTypes.TEXT,
      comment: '来源页面'
    },

    // 地理位置信息
    country: {
      type: DataTypes.STRING(2),
      comment: '国家代码'
    },
    city: {
      type: DataTypes.STRING(50),
      comment: '城市'
    },

    // 设备和浏览器信息
    device: {
      type: DataTypes.STRING(20),
      comment: '设备类型：desktop, mobile, tablet'
    },
    browser: {
      type: DataTypes.STRING(50),
      comment: '浏览器'
    },

    // 转化状态
    converted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否转化'
    },
    conversionId: {
      type: DataTypes.UUID,
      references: {
        model: 'conversions',
        key: 'id'
      },
      comment: '关联的转化ID（如果已转化）'
    },

    // ============ 老王增强字段：从affiliate-management-system学到的归因机制 ============

    // 归因数据
    attributionModel: {
      type: DataTypes.ENUM('first-click', 'last-click', 'multi-touch', 'time-decay', 'position-based'),
      comment: '使用的归因模型'
    },
    attributionWeight: {
      type: DataTypes.DECIMAL(5, 4),
      defaultValue: 1.0000,
      comment: '归因权重（0.0000-1.0000）'
    },
    touchpoint: {
      type: DataTypes.STRING(20),
      comment: '触点类型（first, last, multi, time-decay, position）'
    },

    // 验证信息
    isValid: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否为有效点击（通过验证）'
    },
    invalidReason: {
      type: DataTypes.STRING(100),
      comment: '无效原因（如果isValid=false）'
    },

    // 转化数据（预存，用于后续分析）
    conversionData: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: '转化相关数据（订单号、金额等，在转化时填充）'
    }
  }, {
    tableName: 'clicks',
    timestamps: true,
    indexes: [
      { fields: ['linkId'] },
      { fields: ['channelId'] },
      { fields: ['offerId'] },                    // 新增：Offer ID索引
      { fields: ['referralCode'] },               // 新增：推荐码索引
      { fields: ['customerId'] },                 // 新增：客户ID索引（用于去重）
      { fields: ['sessionId'] },
      { fields: ['ip'] },
      { fields: ['createdAt'] },
      { fields: ['converted'] },                  // 优化：转化状态索引
      { fields: ['attributionModel'] },           // 新增：归因模型索引
      { fields: ['isValid'] }                     // 新增：验证状态索引
    ]
  });

  return Click;
};
