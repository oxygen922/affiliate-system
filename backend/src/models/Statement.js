/**
 * Statement模型 - 对账单表 ⭐新增
 * 老王出品：Publisher对账单
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Statement = sequelize.define('Statement', {
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
    channelId: {
      type: DataTypes.UUID,
      references: {
        model: 'channels',
        key: 'id'
      },
      comment: '渠道对账单，null表示全局对账单'
    },
    statementNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '对账单号'
    },
    period: {
      type: DataTypes.STRING(7),
      allowNull: false,
      comment: '账期：YYYY-MM'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    totalConversions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    totalOrderAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    totalCommission: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    previousBalance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '期初余额'
    },
    earned: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '本期新增佣金'
    },
    withdrawn: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '本期提现'
    },
    endingBalance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '期末余额'
    },
    status: {
      type: DataTypes.ENUM('draft', 'generated', 'sent'),
      allowNull: false,
      defaultValue: 'draft'
    },
    generatedAt: {
      type: DataTypes.DATE
    },
    sentAt: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'statements',
    timestamps: true,
    indexes: [
      { fields: ['publisherId'] },
      { fields: ['channelId'] },
      { fields: ['statementNo'] },
      { fields: ['period'] },
      { fields: ['status'] }
    ]
  });

  return Statement;
};
