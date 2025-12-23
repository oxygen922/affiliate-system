/**
 * AuditLog模型 - 审核日志表
 * 老王出品：记录所有审核操作
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    entityType: {
      type: DataTypes.ENUM('channel_offer', 'merchant', 'offer', 'withdrawal', 'publisher'),
      allowNull: false
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    action: {
      type: DataTypes.ENUM('create', 'update', 'delete', 'approve', 'reject', 'suspend'),
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reason: {
      type: DataTypes.TEXT,
      comment: '审核理由或备注'
    },
    changes: {
      type: DataTypes.JSON,
      comment: '变更内容（before/after）'
    },
    ipAddress: {
      type: DataTypes.STRING(45)
    },
    userAgent: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'audit_logs',
    timestamps: true,
    indexes: [
      { fields: ['entityType', 'entityId'] },
      { fields: ['userId'] },
      { fields: ['action'] },
      { fields: ['createdAt'] }
    ]
  });

  return AuditLog;
};
