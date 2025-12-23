/**
 * 点击追踪中间件
 * 老王出品：集成了从affiliate-management-system学到的优秀追踪机制
 *
 * 功能：
 * 1. 记录详细的点击信息（IP、UserAgent、Referrer等）
 * 2. 实现点击验证（防刷、防重复等）
 * 3. 设置归因Cookie（用于转化归因）
 * 4. 支持多种归因模型
 */

const { v4: uuidv4 } = require('uuid');
const Click = require('../models/Click');
const AffiliateLink = require('../models/AffiliateLink');
const logger = require('../utils/logger');

/**
 * 点击追踪配置
 */
const config = {
  attributionWindow: 30,              // 归因窗口（天）
  cookieExpiry: 30,                   // Cookie过期时间（天）
  duplicateClickWindow: 24,           // 重复点击检测窗口（小时）
  suspiciousIPThreshold: 100,         // 可疑IP点击阈值（每天）
  clickValidation: true,              // 启用点击验证
};

/**
 * 点击验证函数
 * 老王备注：验证点击是否有效（防止刷单、重复点击等）
 */
async function validateClick(clickData) {
  const errors = [];

  // 1. 检查链接是否存在
  const link = await AffiliateLink.findByPk(clickData.linkId);
  if (!link) {
    return { valid: false, reason: 'link_not_found' };
  }

  // 2. 检查链接状态
  if (link.status !== 'active') {
    return { valid: false, reason: 'link_inactive' };
  }

  // 3. 检查链接是否过期
  if (link.expiresAt && new Date() > link.expiresAt) {
    return { valid: false, reason: 'link_expired' };
  }

  // 4. 检查点击上限
  if (link.maxClicks && link.clicks >= link.maxClicks) {
    return { valid: false, reason: 'link_max_clicks_reached' };
  }

  // 5. 检查重复点击（同一IP、同一链接、24小时内）
  if (clickData.ip) {
    const duplicateClick = await Click.findOne({
      where: {
        linkId: clickData.linkId,
        ip: clickData.ip,
        createdAt: {
          [require('sequelize').Op.gte]: new Date(Date.now() - config.duplicateClickWindow * 60 * 60 * 1000)
        }
      }
    });

    if (duplicateClick) {
      return { valid: false, reason: 'duplicate_click' };
    }
  }

  // 6. 检查可疑IP（短时间内大量点击）
  if (clickData.ip) {
    const clickCount = await Click.count({
      where: {
        ip: clickData.ip,
        createdAt: {
          [require('sequelize').Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24小时内
        }
      }
    });

    if (clickCount >= config.suspiciousIPThreshold) {
      return { valid: false, reason: 'suspicious_ip' };
    }
  }

  return { valid: true };
}

/**
 * 归因Cookie设置
 * 老王备注：设置归因Cookie，用于后续转化归因
 */
function setAttributionCookie(res, attributionData) {
  const cookieValue = JSON.stringify(attributionData);

  res.cookie('attribution', cookieValue, {
    maxAge: config.cookieExpiry * 24 * 60 * 60 * 1000,  // 转换为毫秒
    httpOnly: true,                                       // 防止XSS攻击
    secure: process.env.NODE_ENV === 'production',        // 生产环境使用HTTPS
    sameSite: 'lax'                                       // CSRF保护
  });
}

/**
 * 归因数据计算
 * 老王备注：根据归因模型计算归因权重
 */
function calculateAttribution(model) {
  const models = {
    'first-click': { touchpoint: 'first', weight: 1.0 },
    'last-click': { touchpoint: 'last', weight: 1.0 },
    'multi-touch': { touchpoint: 'multi', weight: 0.5 },
    'time-decay': { touchpoint: 'time-decay', weight: 1.0 },  // 实际应根据时间计算
    'position-based': { touchpoint: 'position', weight: 0.4 }
  };

  return models[model] || models['last-click'];
}

/**
 * 点击追踪中间件
 * 老王备注：处理/click/:code路由，记录点击并重定向到目标URL
 */
async function trackClick(req, res, next) {
  try {
    const { code } = req.params;

    // 获取客户端信息
    const clickData = {
      linkId: req.link.id,
      channelId: req.link.channelId,
      offerId: req.link.offerId,
      referralCode: code,

      // 用户识别
      customerId: req.cookies.customerId || uuidv4(),       // 如果没有则生成新ID
      sessionId: req.sessionID || uuidv4(),

      // 环境信息
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer || req.headers.referer || '',

      // 设备信息（简化版，实际可以使用ua-parser-js等库）
      device: parseDevice(req.headers['user-agent']),
      browser: parseBrowser(req.headers['user-agent']),

      // 归因数据
      attributionModel: req.link.attributionModel || 'last-click',
    };

    // 计算归因
    const attribution = calculateAttribution(clickData.attributionModel);
    clickData.attributionWeight = attribution.weight;
    clickData.touchpoint = attribution.touchpoint;

    // 点击验证
    let isValid = true;
    let invalidReason = null;

    if (config.clickValidation) {
      const validation = await validateClick(clickData);
      isValid = validation.valid;
      invalidReason = validation.reason;
    }

    clickData.isValid = isValid;
    clickData.invalidReason = invalidReason;

    // 记录点击到数据库
    const click = await Click.create(clickData);

    // 设置客户ID Cookie（用于识别同一用户）
    if (!req.cookies.customerId) {
      res.cookie('customerId', clickData.customerId, {
        maxAge: 365 * 24 * 60 * 60 * 1000,  // 1年
        httpOnly: true
      });
    }

    // 如果点击有效，设置归因Cookie
    if (isValid) {
      setAttributionCookie(res, {
        clickId: click.id,
        channelId: clickData.channelId,
        offerId: clickData.offerId,
        referralCode: code,
        attributionModel: clickData.attributionModel,
        timestamp: new Date()
      });

      // 更新链接点击统计
      await req.link.increment('clicks');

      // 如果是独立点击（同一客户24小时内第一次点击）
      const isUnique = await isUniqueClick(clickData.linkId, clickData.customerId);
      if (isUnique) {
        await req.link.increment('uniqueClicks');
      }

      logger.info(`Click recorded: ${click.id} for link ${req.link.code}`);
    } else {
      logger.warn(`Invalid click blocked: ${invalidReason} for link ${req.link.code}`);
    }

    // 重定向到目标URL
    res.redirect(req.link.url);

  } catch (error) {
    logger.error('Click tracking error:', error);
    res.status(500).json({ error: 'Click tracking failed' });
  }
}

/**
 * 解析设备类型
 * 老王备注：简化版设备识别
 */
function parseDevice(userAgent) {
  if (!userAgent) return 'unknown';

  const ua = userAgent.toLowerCase();

  if (/mobile|android|iphone|ipad|phone/i.test(ua)) {
    return 'mobile';
  } else if (/tablet|ipad/i.test(ua)) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

/**
 * 解析浏览器
 * 老王备注：简化版浏览器识别
 */
function parseBrowser(userAgent) {
  if (!userAgent) return 'unknown';

  const ua = userAgent.toLowerCase();

  if (/chrome/i.test(ua)) return 'Chrome';
  if (/firefox/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
  if (/edge/i.test(ua)) return 'Edge';
  if (/opera/i.test(ua)) return 'Opera';
  if (/msie|trident/i.test(ua)) return 'IE';

  return 'Unknown';
}

/**
 * 检查是否为独立点击
 * 老王备注：同一客户24小时内第一次点击该链接
 */
async function isUniqueClick(linkId, customerId) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const existingClick = await Click.findOne({
    where: {
      linkId,
      customerId,
      createdAt: {
        [require('sequelize').Op.gte]: twentyFourHoursAgo
      }
    }
  });

  return !existingClick;
}

module.exports = {
  trackClick,
  validateClick,
  setAttributionCookie,
  calculateAttribution,
  config
};
