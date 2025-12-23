/**
 * ChannelOffer模型 - 渠道申请Offer关联表 ⭐核心表
 * 老王出品：Channel申请Offer的关联关系
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ChannelOffer = sequelize.define('ChannelOffer', {
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
    commissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      comment: '此渠道此Offer的佣金比例（%）'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'suspended'),
      allowNull: false,
      defaultValue: 'pending',
      comment: '申请状态'
    },
    appliedAt: {
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
    tableName: 'channel_offers',
    timestamps: true,
    indexes: [
      { fields: ['channelId'] },
      { fields: ['offerId'] },
      { fields: ['status'] },
      {
        unique: true,
        fields: ['channelId', 'offerId']
      }
    ]
  });

  return ChannelOffer;
};
