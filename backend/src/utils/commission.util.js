/**
 * 佣金计算工具
 * 老王出品：核心佣金计算逻辑
 * 增强版本：集成了从affiliate-management-system学到的量级奖励和层级奖励系统
 */

/**
 * 计算Publisher佣金（基础版本）
 *
 * 计算公式：订单金额 × Offer佣金率 × Publisher分成比例 = 实际佣金
 *
 * @param {Number} orderAmount - 订单金额
 * @param {Number} offerCommissionRate - Offer佣金率（百分比，如10表示10%）
 * @param {Number} publisherShareRate - Publisher分成比例（百分比，如90表示90%）
 * @returns {Object} 佣金明细
 *
 * @example
 * calculatePublisherCommission(100, 10, 90)
 * // 返回:
 * // {
 * //   orderAmount: 100,
 * //   totalCommission: 10,           // 100 × 10% = 10
 * //   publisherCommission: 9,        // 10 × 90% = 9
 * //   platformCommission: 1,         // 10 × 10% = 1
 * //   offerCommissionRate: 10,
 * //   publisherShareRate: 90
 * // }
 */
function calculatePublisherCommission(orderAmount, offerCommissionRate, publisherShareRate) {
  // 参数验证
  if (orderAmount < 0 || offerCommissionRate < 0 || publisherShareRate < 0) {
    throw new Error('金额和比例不能为负数');
  }

  if (publisherShareRate > 100) {
    throw new Error('Publisher分成比例不能超过100%');
  }

  // 计算总佣金（Offer佣金）
  const totalCommission = (orderAmount * offerCommissionRate) / 100;

  // 计算Publisher佣金
  const publisherCommission = (totalCommission * publisherShareRate) / 100;

  // 计算平台抽成
  const platformCommission = totalCommission - publisherCommission;

  return {
    orderAmount: parseFloat(orderAmount.toFixed(2)),
    totalCommission: parseFloat(totalCommission.toFixed(2)),
    publisherCommission: parseFloat(publisherCommission.toFixed(2)),
    platformCommission: parseFloat(platformCommission.toFixed(2)),
    offerCommissionRate,
    publisherShareRate
  };
}

/**
 * 计算增强版佣金（老王出品：包含量级奖励和层级奖励）
 *
 * 计算公式：
 * 基础佣金 = 订单金额 × Offer佣金率 × Publisher分成比例
 * 量级奖励 = 订单金额 × 量级奖励百分比
 * 层级奖励 = 固定层级奖励金额
 * 最终佣金 = 基础佣金 + 量级奖励 + 层级奖励
 *
 * @param {Number} orderAmount - 订单金额
 * @param {Number} offerCommissionRate - Offer佣金率
 * @param {Number} publisherShareRate - Publisher分成比例
 * @param {Object} options - 可选配置
 * @param {Array} options.volumeBonuses - 量级奖励配置 [{threshold: 1000, bonus: 2}]
 * @param {Object} options.tier - 层级配置 {level: 2, rate: 15, bonus: 5}
 * @returns {Object} 详细佣金明细
 *
 * @example
 * calculateEnhancedCommission(100, 10, 90, {
 *   volumeBonuses: [{threshold: 100, bonus: 2}],
 *   tier: {level: 2, bonus: 5}
 * })
 * // 返回:
 * // {
 * //   orderAmount: 100,
 * //   baseCommission: 9,           // 基础佣金
 * //   volumeBonus: 2,              // 量级奖励（100元订单额外2%）
 * //   tierBonus: 5,                // 层级奖励（层级2固定奖励5元）
 * //   totalCommission: 16,         // 9 + 2 + 5 = 16
 * //   platformCommission: 1,
 * //   breakdown: {...}
 * // }
 */
function calculateEnhancedCommission(orderAmount, offerCommissionRate, publisherShareRate, options = {}) {
  // 1. 计算基础佣金
  const base = calculatePublisherCommission(orderAmount, offerCommissionRate, publisherShareRate);

  // 2. 计算量级奖励（老王备注：根据订单金额给予额外奖励）
  const volumeBonus = calculateVolumeBonus(orderAmount, options.volumeBonuses || []);

  // 3. 计算层级奖励（老王备注：根据Publisher层级给予固定奖励）
  const tierBonus = calculateTierBonus(options.tier);

  // 4. 计算最终佣金
  const finalPublisherCommission = base.publisherCommission + volumeBonus + tierBonus;

  return {
    orderAmount: base.orderAmount,
    // 基础佣金
    baseCommission: base.publisherCommission,
    // 量级奖励
    volumeBonus: parseFloat(volumeBonus.toFixed(2)),
    // 层级奖励
    tierBonus: parseFloat(tierBonus.toFixed(2)),
    // 总佣金
    totalCommission: base.totalCommission,
    // Publisher最终佣金
    publisherCommission: parseFloat(finalPublisherCommission.toFixed(2)),
    // 平台佣金
    platformCommission: base.platformCommission,
    // 详细明细
    breakdown: {
      offerCommissionRate,
      publisherShareRate,
      baseRate: offerCommissionRate * publisherShareRate / 100,
      volumeRate: (volumeBonus / orderAmount * 100).toFixed(2),
      tierAmount: tierBonus
    }
  };
}

/**
 * 计算量级奖励
 * 老王备注：根据订单金额计算额外奖励百分比
 *
 * @param {Number} orderAmount - 订单金额
 * @param {Array} volumeBonuses - 量级配置 [{threshold: 1000, bonus: 2}]
 * @returns {Number} 量级奖励金额
 *
 * @example
 * calculateVolumeBonus(5000, [{threshold: 1000, bonus: 2}, {threshold: 5000, bonus: 5}])
 * // 返回: 250  (5000 × 5% = 250)
 */
function calculateVolumeBonus(orderAmount, volumeBonuses) {
  if (!volumeBonuses || volumeBonuses.length === 0) {
    return 0;
  }

  let maxBonus = 0;

  // 找到符合条件的最高量级奖励
  for (const vb of volumeBonuses) {
    if (orderAmount >= vb.threshold) {
      maxBonus = Math.max(maxBonus, vb.bonus);
    }
  }

  // 计算奖励金额
  return (orderAmount * maxBonus) / 100;
}

/**
 * 计算层级奖励
 * 老王备注：根据Publisher层级返回固定奖励金额
 *
 * @param {Object} tier - 层级配置 {level, rate, name, bonus}
 * @returns {Number} 层级奖励金额
 *
 * @example
 * calculateTierBonus({level: 2, rate: 15, name: 'Silver', bonus: 5})
 * // 返回: 5
 */
function calculateTierBonus(tier) {
  if (!tier || !tier.bonus) {
    return 0;
  }

  return tier.bonus;
}

/**
 * 批量计算佣金
 * @param {Array} conversions - 转化记录数组
 * @param {Object} commissionRates - 佣金比例配置
 * @param {Object} options - 可选配置（volumeBonuses, tier）
 * @returns {Object} 汇总数据
 */
function calculateBatchCommissions(conversions, commissionRates, options = {}) {
  let totalOrderAmount = 0;
  let totalCommission = 0;
  let totalPublisherCommission = 0;
  let totalPlatformCommission = 0;
  let totalVolumeBonus = 0;
  let totalTierBonus = 0;

  conversions.forEach(conversion => {
    const result = calculateEnhancedCommission(
      conversion.orderAmount,
      conversion.offerCommissionRate,
      commissionRates[conversion.publisherId] || commissionRates.default || 80,
      {
        volumeBonuses: options.volumeBonuses,
        tier: options.tier
      }
    );

    totalOrderAmount += result.orderAmount;
    totalCommission += result.totalCommission;
    totalPublisherCommission += result.publisherCommission;
    totalPlatformCommission += result.platformCommission;
    totalVolumeBonus += result.volumeBonus;
    totalTierBonus += result.tierBonus;
  });

  return {
    totalConversions: conversions.length,
    totalOrderAmount: parseFloat(totalOrderAmount.toFixed(2)),
    totalCommission: parseFloat(totalCommission.toFixed(2)),
    totalPublisherCommission: parseFloat(totalPublisherCommission.toFixed(2)),
    totalPlatformCommission: parseFloat(totalPlatformCommission.toFixed(2)),
    totalVolumeBonus: parseFloat(totalVolumeBonus.toFixed(2)),
    totalTierBonus: parseFloat(totalTierBonus.toFixed(2)),
    averageCommission: conversions.length > 0
      ? parseFloat((totalPublisherCommission / conversions.length).toFixed(2))
      : 0
  };
}

/**
 * 验证佣金比例
 * @param {Number} rate - 佣金比例
 * @returns {Boolean} 是否有效
 */
function isValidCommissionRate(rate) {
  return typeof rate === 'number' && rate >= 0 && rate <= 100;
}

/**
 * 验证量级奖励配置
 * @param {Array} volumeBonuses - 量级奖励配置
 * @returns {Boolean} 是否有效
 */
function isValidVolumeBonusConfig(volumeBonuses) {
  if (!Array.isArray(volumeBonuses)) return false;

  for (const vb of volumeBonuses) {
    if (!vb.threshold || typeof vb.bonus !== 'number') return false;
    if (vb.threshold < 0 || vb.bonus < 0 || vb.bonus > 100) return false;
  }

  return true;
}

/**
 * 验证层级配置
 * @param {Object} tier - 层级配置
 * @returns {Boolean} 是否有效
 */
function isValidTierConfig(tier) {
  if (!tier || typeof tier !== 'object') return false;

  if (tier.level && (typeof tier.level !== 'number' || tier.level < 1)) return false;
  if (tier.rate && (typeof tier.rate !== 'number' || tier.rate < 0 || tier.rate > 100)) return false;
  if (tier.bonus && (typeof tier.bonus !== 'number' || tier.bonus < 0)) return false;

  return true;
}

module.exports = {
  // 基础计算函数
  calculatePublisherCommission,
  calculateBatchCommissions,
  isValidCommissionRate,

  // 老王增强函数
  calculateEnhancedCommission,
  calculateVolumeBonus,
  calculateTierBonus,
  isValidVolumeBonusConfig,
  isValidTierConfig
};
