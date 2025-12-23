/**
 * Channel模型 - 渠道表 ⭐核心表
 * 老王出品：Channel是推广的基本单位
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Channel = sequelize.define('Channel', {
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '渠道名称'
    },
    description: {
      type: DataTypes.TEXT,
      comment: '渠道描述'
    },
    website: {
      type: DataTypes.STRING(255),
      comment: '渠道网站'
    },
    trafficType: {
      type: DataTypes.ENUM('website', 'social', 'email', 'ppc', 'mobile', 'other'),
      allowNull: false,
      defaultValue: 'website',
      comment: '流量类型'
    },
    defaultCommissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 80.00,
      comment: '此渠道默认佣金比例（%）'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      allowNull: false,
      defaultValue: 'active'
    },
    stats: {
      type: DataTypes.JSON,
      comment: '统计数据：{clicks, conversions, commission}'
    }
  }, {
    tableName: 'channels',
    timestamps: true,
    indexes: [
      { fields: ['publisherId'] },
      { fields: ['status'] },
      { fields: ['trafficType'] }
    ]
  });

  return Channel;
};
