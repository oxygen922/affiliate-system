/**
 * 模型索引文件
 * 老王出品：统一导出所有模型并建立关联
 */

const { sequelize } = require('../config/database');

// 导入所有模型
const User = require('./User')(sequelize);
const Publisher = require('./Publisher')(sequelize);
const Channel = require('./Channel')(sequelize);
const PaymentAccount = require('./PaymentAccount')(sequelize);
const UpstreamAffiliate = require('./UpstreamAffiliate')(sequelize);
const Merchant = require('./Merchant')(sequelize);
const Offer = require('./Offer')(sequelize);
const ChannelOffer = require('./ChannelOffer')(sequelize);
const AffiliateLink = require('./AffiliateLink')(sequelize);
const Click = require('./Click')(sequelize);
const Conversion = require('./Conversion')(sequelize);
const Commission = require('./Commission')(sequelize);
const Withdrawal = require('./Withdrawal')(sequelize);
const Payment = require('./Payment')(sequelize);
const Statement = require('./Statement')(sequelize);
const AuditLog = require('./AuditLog')(sequelize);

// 建立模型关联
const setupAssociations = () => {
  // User关联
  User.hasOne(Publisher, { foreignKey: 'userId', as: 'publisher' });
  Publisher.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // Publisher关联
  Publisher.hasMany(Channel, { foreignKey: 'publisherId', as: 'channels' });
  Channel.belongsTo(Publisher, { foreignKey: 'publisherId', as: 'publisher' });

  Publisher.hasMany(PaymentAccount, { foreignKey: 'publisherId', as: 'paymentAccounts' });
  PaymentAccount.belongsTo(Publisher, { foreignKey: 'publisherId', as: 'publisher' });

  Publisher.hasMany(Withdrawal, { foreignKey: 'publisherId', as: 'withdrawals' });
  Withdrawal.belongsTo(Publisher, { foreignKey: 'publisherId', as: 'publisher' });

  // Channel关联 ⭐核心
  Channel.hasMany(ChannelOffer, { foreignKey: 'channelId', as: 'channelOffers' });
  ChannelOffer.belongsTo(Channel, { foreignKey: 'channelId', as: 'channel' });

  Channel.hasMany(AffiliateLink, { foreignKey: 'channelId', as: 'affiliateLinks' });
  AffiliateLink.belongsTo(Channel, { foreignKey: 'channelId', as: 'channel' });

  Channel.hasMany(Conversion, { foreignKey: 'channelId', as: 'conversionRecords' });
  Conversion.belongsTo(Channel, { foreignKey: 'channelId', as: 'channel' });

  Channel.hasMany(Commission, { foreignKey: 'channelId', as: 'commissions' });
  Commission.belongsTo(Channel, { foreignKey: 'channelId', as: 'channel' });

  // UpstreamAffiliate关联
  UpstreamAffiliate.hasMany(Merchant, { foreignKey: 'upstreamAffiliateId', as: 'merchants' });
  Merchant.belongsTo(UpstreamAffiliate, { foreignKey: 'upstreamAffiliateId', as: 'upstreamAffiliate' });

  // Merchant关联
  Merchant.hasMany(Offer, { foreignKey: 'merchantId', as: 'offers' });
  Offer.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });

  // Offer关联
  Offer.hasMany(ChannelOffer, { foreignKey: 'offerId', as: 'channelOffers' });
  ChannelOffer.belongsTo(Offer, { foreignKey: 'offerId', as: 'offer' });

  Offer.hasMany(AffiliateLink, { foreignKey: 'offerId', as: 'affiliateLinks' });
  AffiliateLink.belongsTo(Offer, { foreignKey: 'offerId', as: 'offer' });

  Offer.hasMany(Conversion, { foreignKey: 'offerId', as: 'conversionRecords' });
  Conversion.belongsTo(Offer, { foreignKey: 'offerId', as: 'offer' });

  // ChannelOffer关联
  ChannelOffer.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

  // AffiliateLink关联
  AffiliateLink.hasMany(Click, { foreignKey: 'linkId', as: 'clickRecords' });
  Click.belongsTo(AffiliateLink, { foreignKey: 'linkId', as: 'link' });

  AffiliateLink.hasMany(Conversion, { foreignKey: 'linkId', as: 'conversionRecords' });
  Conversion.belongsTo(AffiliateLink, { foreignKey: 'linkId', as: 'affiliateLink' });

  // Click关联
  Click.belongsTo(Channel, { foreignKey: 'channelId', as: 'channel' });

  // Conversion关联
  Conversion.hasOne(Commission, { foreignKey: 'conversionId', as: 'commissionRecord' });
  Commission.belongsTo(Conversion, { foreignKey: 'conversionId', as: 'conversion' });

  Conversion.belongsTo(Click, { foreignKey: 'clickId', as: 'click' });

  // Commission关联
  Commission.belongsTo(Publisher, { foreignKey: 'publisherId', as: 'publisher' });
  Commission.belongsTo(Withdrawal, { foreignKey: 'withdrawalId', as: 'withdrawal' });
  Commission.belongsTo(Payment, { foreignKey: 'paymentId', as: 'payment' });

  // Withdrawal关联
  Withdrawal.belongsTo(Channel, { foreignKey: 'channelId', as: 'channel' });
  Withdrawal.belongsTo(PaymentAccount, { foreignKey: 'paymentAccountId', as: 'paymentAccount' });
  Withdrawal.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
  Withdrawal.hasOne(Payment, { foreignKey: 'withdrawalId', as: 'payment' });
  Payment.belongsTo(Withdrawal, { foreignKey: 'withdrawalId', as: 'withdrawal' });

  // Payment关联
  Payment.belongsTo(Publisher, { foreignKey: 'publisherId', as: 'publisher' });
  Payment.belongsTo(Channel, { foreignKey: 'channelId', as: 'channel' });
  Payment.belongsTo(PaymentAccount, { foreignKey: 'paymentAccountId', as: 'paymentAccount' });
  Payment.belongsTo(User, { foreignKey: 'processedBy', as: 'processor' });

  // Statement关联
  Statement.belongsTo(Publisher, { foreignKey: 'publisherId', as: 'publisher' });
  Statement.belongsTo(Channel, { foreignKey: 'channelId', as: 'channel' });

  // AuditLog关联
  AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
};

// 建立关联
setupAssociations();

// 导出所有模型和sequelize实例
module.exports = {
  sequelize,
  User,
  Publisher,
  Channel,
  PaymentAccount,
  UpstreamAffiliate,
  Merchant,
  Offer,
  ChannelOffer,
  AffiliateLink,
  Click,
  Conversion,
  Commission,
  Withdrawal,
  Payment,
  Statement,
  AuditLog
};
