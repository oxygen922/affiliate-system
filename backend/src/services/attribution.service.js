/**
 * 归因计算服务
 * 老王出品：从affiliate-management-system学到的优秀归因机制
 *
 * 支持的归因模型：
 * 1. first-click（首次点击归因）：100%归因给首次点击
 * 2. last-click（最后点击归因）：100%归因给最后点击（默认）
 * 3. multi-touch（多点触控归因）：所有触点平均分配
 * 4. time-decay（时间衰减归因）：越接近转化的点击权重越高
 * 5. position-based（位置基础归因）：首次40%，最后40%，中间20%
 */

const logger = require('../utils/logger');

/**
 * 归因服务类
 */
class AttributionService {
  constructor(config = {}) {
    this.defaultModel = config.model || 'last-click';
    this.attributionWindow = config.window || 30; // 归因窗口（天）
  }

  /**
   * 计算归因
   * 老王备注：根据指定的归因模型，计算多个触点的归因权重
   *
   * @param {string} model - 归因模型（first-click, last-click等）
   * @param {Array} touchpoints - 触点数组（点击记录）
   * @returns {Array} 带有权重的触点数组
   */
  calculate(model, touchpoints) {
    if (!touchpoints || touchpoints.length === 0) {
      return [];
    }

    const models = {
      'first-click': this.firstClick.bind(this),
      'last-click': this.lastClick.bind(this),
      'multi-touch': this.multiTouch.bind(this),
      'time-decay': this.timeDecay.bind(this),
      'position-based': this.positionBased.bind(this)
    };

    const calculateFunction = models[model] || models['last-click'];

    try {
      const result = calculateFunction(touchpoints);

      logger.info(`Attribution calculated: model=${model}, touchpoints=${touchpoints.length}`);

      return result;
    } catch (error) {
      logger.error('Attribution calculation error:', error);
      // 发生错误时使用默认模型（last-click）
      return models['last-click'].call(this, touchpoints);
    }
  }

  /**
   * 首次点击归因
   * 老王备注：100%归因给首次点击（品牌认知活动）
   */
  firstClick(touchpoints) {
    return touchpoints.map((tp, index) => ({
      ...tp.toJSON ? tp.toJSON() : tp,
      attributionModel: 'first-click',
      attributionWeight: index === 0 ? 1.0 : 0,
      touchpoint: index === 0 ? 'first' : 'ignored'
    }));
  }

  /**
   * 最后点击归因
   * 老王备注：100%归因给最后点击（直接转化活动，默认模型）
   */
  lastClick(touchpoints) {
    return touchpoints.map((tp, index) => ({
      ...tp.toJSON ? tp.toJSON() : tp,
      attributionModel: 'last-click',
      attributionWeight: index === touchpoints.length - 1 ? 1.0 : 0,
      touchpoint: index === touchpoints.length - 1 ? 'last' : 'ignored'
    }));
  }

  /**
   * 多点触控归因
   * 老王备注：所有触点平均分配（复杂决策流程）
   */
  multiTouch(touchpoints) {
    const weight = touchpoints.length > 0 ? 1 / touchpoints.length : 0;

    return touchpoints.map((tp) => ({
      ...tp.toJSON ? tp.toJSON() : tp,
      attributionModel: 'multi-touch',
      attributionWeight: parseFloat(weight.toFixed(4)),
      touchpoint: 'multi'
    }));
  }

  /**
   * 时间衰减归因
   * 老王备注：越接近转化的点击权重越高（长期转化周期）
   */
  timeDecay(touchpoints) {
    const now = new Date();
    const timeDiffMs = now - new Date(touchpoints[touchpoints.length - 1].createdAt);
    const decayWindowMs = this.attributionWindow * 24 * 60 * 60 * 1000;

    return touchpoints.map((tp) => {
      const tpData = tp.toJSON ? tp.toJSON() : tp;
      const timeDiff = now - new Date(tp.createdAt);

      // 时间衰减公式：权重 = e^(-时间差 / 归因窗口)
      const decayFactor = Math.exp(-timeDiff / decayWindowMs);

      return {
        ...tpData,
        attributionModel: 'time-decay',
        attributionWeight: parseFloat(decayFactor.toFixed(4)),
        touchpoint: 'time-decay'
      };
    }));
  }

  /**
   * 位置基础归因
   * 老王备注：首次40%，最后40%，中间20%（平衡品牌认知和直接转化）
   */
  positionBased(touchpoints) {
    if (touchpoints.length === 0) return [];

    if (touchpoints.length === 1) {
      // 只有一个触点，100%归因
      return [{
        ...touchpoints[0].toJSON ? touchpoints[0].toJSON() : touchpoints[0],
        attributionModel: 'position-based',
        attributionWeight: 1.0,
        touchpoint: 'only'
      }];
    }

    return touchpoints.map((tp, index) => {
      let weight = 0;
      let touchpoint = 'middle';

      if (index === 0) {
        // 首次点击：40%
        weight = 0.4;
        touchpoint = 'first';
      } else if (index === touchpoints.length - 1) {
        // 最后点击：40%
        weight = 0.4;
        touchpoint = 'last';
      } else {
        // 中间触点：20%平分
        weight = 0.2 / (touchpoints.length - 2);
        touchpoint = 'middle';
      }

      return {
        ...tp.toJSON ? tp.toJSON() : tp,
        attributionModel: 'position-based',
        attributionWeight: parseFloat(weight.toFixed(4)),
        touchpoint
      };
    });
  }

  /**
   * 获取归因窗口内的所有触点
   * 老王备注：查询指定时间窗口内的点击记录
   */
  async getTouchpointsInWindow(customerId, offerId, conversionTime) {
    const Click = require('../models/Click');
    const { Op } = require('sequelize');

    const windowStart = new Date(conversionTime);
    windowStart.setDate(windowStart.getDate() - this.attributionWindow);

    const touchpoints = await Click.findAll({
      where: {
        customerId,
        offerId,
        isValid: true,  // 只统计有效点击
        createdAt: {
          [Op.between]: [windowStart, conversionTime]
        }
      },
      order: [['createdAt', 'ASC']]
    });

    return touchpoints;
  }

  /**
   * 计算佣金分配
   * 老王备注：根据归因权重，将总佣金分配给各个触点
   *
   * @param {Array} touchpointsWithWeights - 带权重的触点数组
   * @param {number} totalCommission - 总佣金
   * @returns {Array} 分配后的触点数组（每个触点带有应得佣金）
   */
  distributeCommission(touchpointsWithWeights, totalCommission) {
    return touchpointsWithWeights.map(tp => ({
      ...tp,
      commission: parseFloat((totalCommission * tp.attributionWeight).toFixed(2))
    }));
  }

  /**
   * 更新点击的归因信息
   * 老王备注：将计算好的归因数据保存到点击记录中
   */
  async updateClickAttribution(clickId, attributionData) {
    const Click = require('../models/Click');

    await Click.update(
      {
        attributionModel: attributionData.model,
        attributionWeight: attributionData.weight,
        touchpoint: attributionData.touchpoint,
        conversionData: attributionData.conversionData || {}
      },
      { where: { id: clickId } }
    );
  }

  /**
   * 获取归因模型列表
   */
  getAvailableModels() {
    return [
      {
        id: 'first-click',
        name: '首次点击归因',
        description: '100%归因给首次点击，适用于品牌认知活动',
        recommended: false
      },
      {
        id: 'last-click',
        name: '最后点击归因',
        description: '100%归因给最后点击，适用于直接转化活动',
        recommended: true
      },
      {
        id: 'multi-touch',
        name: '多点触控归因',
        description: '所有触点平均分配，适用于复杂决策流程',
        recommended: false
      },
      {
        id: 'time-decay',
        name: '时间衰减归因',
        description: '越接近转化的点击权重越高，适用于长期转化周期',
        recommended: false
      },
      {
        id: 'position-based',
        name: '位置基础归因',
        description: '首次40%，最后40%，中间20%，平衡品牌和转化',
        recommended: false
      }
    ];
  }
}

// 创建单例实例
const attributionService = new AttributionService({
  model: process.env.DEFAULT_ATTRIBUTION_MODEL || 'last-click',
  window: parseInt(process.env.ATTRIBUTION_WINDOW) || 30
});

module.exports = attributionService;
