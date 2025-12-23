# 🔍 追踪系统增强方案

> **老王备注：** 这个文档总结了从 affiliate-management-system 项目中学到的优秀追踪机制，并规划如何集成到我们的联盟营销平台中。

---

## 📊 核心功能发现

### 1. 推荐链接生成系统（ReferralEngine）

**文件位置：** `affiliate-management-system/src/core/ReferralEngine.js`

#### 核心功能：

**1.1 智能链接生成**（第81-113行）
```javascript
async createReferralLink(affiliateId, options = {}) {
  const linkData = {
    id: uuidv4(),
    affiliateId,
    code: crypto.randomBytes(8).toString("hex").toUpperCase(), // 16位唯一码
    url: `${baseUrl}?ref=${code}&affiliate=${affiliateId}`,
    createdAt: new Date(),
    expiresAt: calculateExpiryDate(options.expiryDays),
    maxClicks: options.maxClicks || 10000,
    currentClicks: 0,
    isActive: true,
    customParameters: options.customParameters || {}, // 支持自定义UTM参数
    metadata: options.metadata || {}
  }
}
```

**特点：**
- ✅ 唯一推荐码生成（16位十六进制大写）
- ✅ 支持自定义过期时间
- ✅ 支持点击上限限制
- ✅ 支持自定义UTM参数（utm_source, utm_medium等）
- ✅ 支持元数据存储（用于A/B测试等）

**1.2 推荐追踪系统**（第159-202行）
```javascript
async trackReferral(referralData) {
  const trackingData = {
    id: uuidv4(),
    affiliateId: referralData.affiliateId,
    referralCode: referralData.referralCode,
    customerId: referralData.customerId,      // 用户ID（用于去重）
    sessionId: referralData.sessionId,        // 会话ID
    ipAddress: referralData.ipAddress,        // IP地址
    userAgent: referralData.userAgent,        // 浏览器信息
    referrer: referralData.referrer,          // 来源页面
    timestamp: new Date(),
    conversionData: referralData.conversionData || {},
    attributionData: this._calculateAttribution(referralData) // 计算归因
  }
}
```

**记录的信息：**
- ✅ 用户识别（customerId, sessionId）
- ✅ 环境信息（ipAddress, userAgent, referrer）
- ✅ 转化数据（conversionData）
- ✅ 归因数据（attributionData）

---

### 2. 多种归因模型（Attribution Models）

**文件位置：** `ReferralEngine.js` 第71-278行

#### 支持的归因模型：

**2.1 First-Click Attribution（首次点击归因）**
```javascript
_firstClickAttribution(referralData) {
  return {
    model: "first-click",
    weight: 1.0,       // 100%归因给首次点击
    timestamp: new Date(),
    touchpoint: "first"
  }
}
```
**使用场景：** 品牌认知活动，重视第一次接触

**2.2 Last-Click Attribution（最后点击归因）**
```javascript
_lastClickAttribution(referralData) {
  return {
    model: "last-click",
    weight: 1.0,       // 100%归因给最后点击
    timestamp: new Date(),
    touchpoint: "last"
  }
}
```
**使用场景：** 直接转化活动，重视最后一次接触（**默认模型**）

**2.3 Multi-Touch Attribution（多点触控归因）**
```javascript
_multiTouchAttribution(referralData) {
  return {
    model: "multi-touch",
    weight: 0.5,       // 均分归因
    timestamp: new Date(),
    touchpoint: "multi"
  }
}
```
**使用场景：** 复杂决策流程，所有触点平均分配

**2.4 Time-Decay Attribution（时间衰减归因）**
```javascript
_timeDecayAttribution(referralData) {
  const now = new Date()
  const timeDiff = now - new Date(referralData.timestamp)
  const decayFactor = Math.exp(
    -timeDiff / (attributionWindow * 24 * 60 * 60 * 1000)
  )

  return {
    model: "time-decay",
    weight: decayFactor,  // 时间越近权重越高
    timestamp: new Date(),
    touchpoint: "time-decay"
  }
}
```
**使用场景：** 长期转化周期，越接近转化的点击权重越高

**2.5 Position-Based Attribution（位置基础归因）**
```javascript
_positionBasedAttribution(referralData) {
  return {
    model: "position-based",
    weight: 0.4,        // 首次40%，最后40%，中间20%
    timestamp: new Date(),
    touchpoint: "position"
  }
}
```
**使用场景：** 平衡品牌认知和直接转化

---

### 3. 点击验证系统（Click Validation）

**文件位置：** `ReferralEngine.js` 第280-316行

#### 验证规则：

```javascript
async _validateReferral(trackingData) {
  // 1. 检查推荐码是否存在和激活
  const referralLink = _findReferralLinkByCode(trackingData.referralCode)
  if (!referralLink || !referralLink.isActive) return false

  // 2. 检查过期时间
  if (new Date() > referralLink.expiresAt) return false

  // 3. 检查点击上限
  if (referralLink.currentClicks >= referralLink.maxClicks) return false

  // 4. 检查允许的域名白名单
  if (allowedDomains.length > 0) {
    if (!allowedDomains.includes(referrerDomain)) return false
  }

  // 5. 检查阻止的域名黑名单
  if (blockedDomains.length > 0) {
    if (blockedDomains.includes(referrerDomain)) return false
  }

  return true
}
```

**防护措施：**
- ✅ 无效推荐码检测
- ✅ 过期链接检测
- ✅ 点击上限限制
- ✅ 来源域名白名单
- ✅ 来源域名黑名单

---

### 4. 佣金计算引擎（Commission Engine）

**文件位置：** `affiliate-management-system/src/core/CommissionEngine.js`

#### 核心功能：

**4.1 多层级佣金系统**（第27-36行）
```javascript
tiers: [
  { level: 1, rate: 10, name: "Bronze" },  // 10%佣金
  { level: 2, rate: 15, name: "Silver" },  // 15%佣金
  { level: 3, rate: 20, name: "Gold" }     // 20%佣金
]
```

**4.2 量级佣金奖励**（第32-36行）
```javascript
volumeBonuses: [
  { threshold: 1000, bonus: 2 },   // 达到$1000，额外+2%
  { threshold: 5000, bonus: 5 },   // 达到$5000，额外+5%
  { threshold: 10000, bonus: 10 }  // 达到$10000，额外+10%
]
```

**4.3 佣金计算逻辑**（第82-133行）
```javascript
async calculateCommission(affiliateId, amount, options = {}) {
  const affiliate = await _getAffiliateData(affiliateId)
  const commissionRate = _getCommissionRate(affiliate, amount) // 根据层级获取费率
  const baseCommission = _calculateBaseCommission(amount, commissionRate)
  const volumeBonus = _calculateVolumeBonus(affiliate, amount) // 量级奖励
  const tierBonus = _calculateTierBonus(affiliate)             // 层级奖励

  const totalCommission = baseCommission + volumeBonus + tierBonus
  const finalCommission = _applyLimits(totalCommission)        // 应用最小/最大限制

  return {
    id: uuidv4(),
    affiliateId,
    amount,
    commissionRate,
    baseCommission,
    volumeBonus,
    tierBonus,
    totalCommission: finalCommission,
    timestamp: new Date()
  }
}
```

**计算公式：**
```
总佣金 = 基础佣金 + 量级奖励 + 层级奖励
基础佣金 = 订单金额 × 佣金费率
量级奖励 = 订单金额 × 量级百分比
层级奖励 = 固定层级奖励金额
```

---

### 5. 统计分析系统（Analytics）

**文件位置：** `ReferralEngine.js` 第343-396行

#### 统计指标：

```javascript
async getReferralStats(affiliateId, options = {}) {
  return {
    totalReferrals: xxx,              // 总推荐数
    uniqueCustomers: xxx,              // 唯一客户数
    conversionRate: xx.xx,             // 转化率
    topReferrers: [...],               // Top10来源域名
    attributionBreakdown: [...],       // 归因模型分布
    timeSeries: [...],                 // 时间序列数据
    linkPerformance: [...]             // 链接表现数据
  }
}
```

**时间序列分组：**
- 按天分组（daily）
- 按周分组（weekly）
- 按月分组（monthly）

---

## 🎯 集成到我们的平台

### 阶段1：增强AffiliateLink模型

**当前模型字段：**
```javascript
{
  id, channelId, offerId, code, url,
  clicks, conversions, commission
}
```

**需要添加的字段：**
```javascript
{
  // 追踪增强
  ipAddress: DataTypes.STRING(45),        // IP地址
  userAgent: DataTypes.TEXT,              // 浏览器信息
  referrer: DataTypes.TEXT,               // 来源页面
  sessionId: DataTypes.STRING(100),       // 会话ID

  // 验证增强
  expiresAt: DataTypes.DATE,              // 过期时间
  maxClicks: DataTypes.INTEGER,           // 点击上限
  isActive: DataTypes.BOOLEAN,            // 是否激活

  // 归因增强
  attributionModel: DataTypes.ENUM('first-click', 'last-click', 'multi-touch', 'time-decay', 'position-based'),
  attributionWeight: DataTypes.DECIMAL(5, 4), // 归因权重

  // 自定义参数
  customParameters: DataTypes.JSON,       // UTM参数等

  // 元数据
  metadata: DataTypes.JSON                // A/B测试数据等
}
```

### 阶段2：实现点击追踪中间件

**创建文件：** `src/metrics/clickTracking.middleware.js`

```javascript
async function trackClick(req, res, next) {
  const { code } = req.query
  const clickData = {
    affiliateId: req.affiliate.id,
    channelId: req.channel.id,
    offerId: req.offer.id,
    referralCode: code,
    customerId: req.cookies.customerId || generateCustomerId(),
    sessionId: req.sessionID,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    referrer: req.headers.referer,
    timestamp: new Date()
  }

  // 验证点击
  const isValid = await validateClick(clickData)
  if (!isValid) {
    return res.status(400).json({ error: 'Invalid click' })
  }

  // 记录点击
  await Click.create(clickData)

  // 设置归因Cookie（30天）
  res.cookie('attribution', JSON.stringify({
    channelId: clickData.channelId,
    offerId: clickData.offerId,
    referralCode: code,
    timestamp: new Date()
  }), {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true
  })

  next()
}
```

### 阶段3：实现归因计算服务

**创建文件：** `src/services/attribution.service.js`

```javascript
class AttributionService {
  constructor(config = {}) {
    this.defaultModel = config.model || 'last-click'
    this.attributionWindow = config.window || 30 // days
  }

  calculate(attributionModel, touchpoints) {
    const models = {
      'first-click': this.firstClick,
      'last-click': this.lastClick,
      'multi-touch': this.multiTouch,
      'time-decay': this.timeDecay,
      'position-based': this.positionBased
    }

    return models[attributionModel].call(this, touchpoints)
  }

  firstClick(touchpoints) {
    // 100%归因给首次点击
    return touchpoints.map((tp, index) => ({
      ...tp,
      weight: index === 0 ? 1.0 : 0
    }))
  }

  lastClick(touchpoints) {
    // 100%归因给最后点击
    return touchpoints.map((tp, index) => ({
      ...tp,
      weight: index === touchpoints.length - 1 ? 1.0 : 0
    }))
  }

  timeDecay(touchpoints) {
    // 时间越近权重越高
    const now = new Date()
    return touchpoints.map(tp => {
      const timeDiff = now - new Date(tp.timestamp)
      const decayFactor = Math.exp(
        -timeDiff / (this.attributionWindow * 24 * 60 * 60 * 1000)
      )
      return { ...tp, weight: decayFactor }
    })
  }
}
```

### 阶段4：实现量级佣金奖励

**修改文件：** `src/utils/commission.util.js`

```javascript
function calculateCommission(orderAmount, offerCommissionRate, publisherShareRate, options = {}) {
  // 原有计算
  const totalCommission = (orderAmount * offerCommissionRate) / 100
  const publisherCommission = (totalCommission * publisherShareRate) / 100
  const platformCommission = totalCommission - publisherCommission

  // 新增：量级奖励
  const volumeBonus = calculateVolumeBonus(orderAmount, options.volumeBonuses)

  // 新增：层级奖励
  const tierBonus = calculateTierBonus(options.tier)

  const finalCommission = publisherCommission + volumeBonus + tierBonus

  return {
    orderAmount,
    totalCommission,
    publisherCommission: finalCommission,
    platformCommission,
    volumeBonus,
    tierBonus
  }
}

function calculateVolumeBonus(orderAmount, volumeBonuses) {
  if (!volumeBonuses || volumeBonuses.length === 0) return 0

  let bonus = 0
  for (const vb of volumeBonuses) {
    if (orderAmount >= vb.threshold) {
      bonus = Math.max(bonus, (orderAmount * vb.bonus) / 100)
    }
  }
  return bonus
}

function calculateTierBonus(tier) {
  if (!tier || !tier.bonus) return 0
  return tier.bonus
}
```

### 阶段5：增强统计API

**修改文件：** `src/controllers/analytics.controller.js`

**新增端点：**
```javascript
// 获取时间序列数据
router.get('/analytics/timeseries',
  authenticate,
  validateQuery(timeseriesSchemas.getTimeseries),
  analyticsController.getTimeSeriesData
)

// 获取归因分析
router.get('/analytics/attribution',
  authenticate,
  validateQuery(attributionSchemas.getAttribution),
  analyticsController.getAttributionAnalysis
)
```

**返回数据格式：**
```javascript
{
  timeSeries: [
    { date: '2025-01-01', clicks: 100, conversions: 5, commission: 250.00 },
    { date: '2025-01-02', clicks: 120, conversions: 6, commission: 300.00 }
  ],
  attribution: {
    model: 'last-click',
    breakdown: [
      { model: 'last-click', count: 80, percentage: 80 },
      { model: 'first-click', count: 15, percentage: 15 },
      { model: 'multi-touch', count: 5, percentage: 5 }
    ]
  }
}
```

---

## 📋 实施计划

### 第一阶段（核心追踪增强）
- [ ] 增强AffiliateLink模型字段
- [ ] 实现点击追踪中间件
- [ ] 实现点击验证逻辑
- [ ] 创建Click记录表（如果还没有）

### 第二阶段（归因系统）
- [ ] 实现归因计算服务
- [ ] 支持多种归因模型
- [ ] 实现归因Cookie管理
- [ ] 创建归因记录表

### 第三阶段（佣金增强）
- [ ] 实现量级佣金奖励
- [ ] 实现多层级佣金系统
- [ ] 增强佣金计算工具
- [ ] 更新佣金记录表

### 第四阶段（统计增强）
- [ ] 实现时间序列统计
- [ ] 实现归因分析API
- [ ] 实现链接表现分析
- [ ] 前端图表展示

---

## 🔧 配置示例

**系统配置文件：** `src/config/tracking.config.js`

```javascript
module.exports = {
  tracking: {
    enabled: true,
    attributionModel: 'last-click',        // 默认归因模型
    attributionWindow: 30,                 // 归因窗口（天）
    cookieExpiry: 30,                      // Cookie过期时间（天）
    clickValidation: true,                 // 启用点击验证
    duplicateClickWindow: 24,              // 重复点击窗口（小时）
  },

  volumeBonuses: [
    { threshold: 1000, bonus: 2 },         // $1000订单额外2%
    { threshold: 5000, bonus: 5 },         // $5000订单额外5%
    { threshold: 10000, bonus: 10 }        // $10000订单额外10%
  ],

  tierStructure: [
    { level: 1, rate: 10, name: 'Bronze', bonus: 0 },
    { level: 2, rate: 15, name: 'Silver', bonus: 5 },
    { level: 3, rate: 20, name: 'Gold', bonus: 10 }
  ],

  validationRules: {
    maxClicksPerLink: 10000,               // 单链接最大点击数
    linkExpiryDays: 365,                   // 链接过期时间
    allowedDomains: [],                    // 允许的域名白名单
    blockedDomains: [],                    // 阻止的域名黑名单
    suspiciousIPThreshold: 100             // 可疑IP点击阈值
  }
}
```

---

## 📚 参考资料

**来源项目：** `affiliate-management-system`

**核心文件：**
- `src/core/CommissionEngine.js` - 佣金计算引擎
- `src/core/ReferralEngine.js` - 推荐追踪引擎
- `examples/commission-tracking.js` - 使用示例

**学习要点：**
1. ✅ 灵活的佣金计算系统（多层、量级奖励）
2. ✅ 强大的归因模型支持（5种模型）
3. ✅ 完善的点击验证机制
4. ✅ 详细的统计分析功能
5. ✅ 事件驱动架构（EventEmitter）

---

**老王总结：** 这个SB项目虽然很多文件是占位符，但是CommissionEngine和ReferralEngine实现得真tm漂亮！老王我要把这些优秀的设计都集成到我们的平台里，让我们的追踪系统更加强大！💪
