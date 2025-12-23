# 🧪 追踪系统测试和使用指南

> **老王出品：** 完整的测试方案和使用示例，确保追踪系统正常运行

---

## 📋 目录

1. [模型字段测试](#1-模型字段测试)
2. [点击追踪中间件测试](#2-点击追踪中间件测试)
3. [归因服务测试](#3-归因服务测试)
4. [佣金计算测试](#4-佣金计算测试)
5. [完整流程测试](#5-完整流程测试)
6. [API使用示例](#6-api使用示例)

---

## 1. 模型字段测试

### 1.1 测试AffiliateLink增强字段

**文件：** `backend/src/models/AffiliateLink.js`

**新增字段：**
```javascript
{
  // 链接验证和限制
  expiresAt: DATE,                           // 过期时间
  maxClicks: INTEGER,                         // 最大点击数

  // 归因模型配置
  attributionModel: ENUM,                     // 归因模型
  attributionWeight: DECIMAL(5, 4),           // 归因权重

  // 自定义参数
  customParameters: JSON,                     // UTM参数
  metadata: JSON,                             // 元数据

  // 统计更新时间
  lastStatsUpdate: DATE                       // 最后统计更新
}
```

**测试代码：**
```javascript
const AffiliateLink = require('./src/models/AffiliateLink');

async function testAffiliateLink() {
  // 创建带有新字段的链接
  const link = await AffiliateLink.create({
    channelId: 'uuid',
    offerId: 'uuid',
    code: 'TEST123',
    url: 'https://example.com?ref=TEST123',

    // 新增字段
    expiresAt: new Date('2025-12-31'),
    maxClicks: 10000,
    attributionModel: 'time-decay',
    attributionWeight: 1.0000,
    customParameters: {
      utm_source: 'facebook',
      utm_medium: 'cpc',
      utm_campaign: 'summer_sale'
    },
    metadata: {
      abTest: 'variant_a',
      tags: ['summer', 'sale']
    }
  });

  console.log('链接创建成功:', link.toJSON());

  // 验证字段
  console.assert(link.attributionModel === 'time-decay', '归因模型错误');
  console.assert(link.customParameters.utm_source === 'facebook', 'UTM参数错误');

  return link;
}
```

### 1.2 测试Click增强字段

**文件：** `backend/src/models/Click.js`

**新增字段：**
```javascript
{
  offerId: UUID,                             // Offer ID
  referralCode: STRING(20),                   // 推荐码

  // 用户识别
  customerId: STRING(100),                    // 客户ID

  // 转化关联
  conversionId: UUID,                         // 转化ID

  // 归因数据
  attributionModel: ENUM,                     // 归因模型
  attributionWeight: DECIMAL(5, 4),           // 归因权重
  touchpoint: STRING(20),                     // 触点类型

  // 验证信息
  isValid: BOOLEAN,                           // 是否有效
  invalidReason: STRING(100),                 // 无效原因

  // 转化数据
  conversionData: JSON                        // 转化数据
}
```

**测试代码：**
```javascript
const Click = require('./src/models/Click');

async function testClick() {
  const click = await Click.create({
    linkId: 'uuid',
    channelId: 'uuid',
    offerId: 'uuid',
    referralCode: 'TEST123',

    customerId: 'customer-123',
    sessionId: 'session-456',
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    referrer: 'https://google.com',

    attributionModel: 'last-click',
    attributionWeight: 1.0,
    touchpoint: 'last',
    isValid: true,

    conversionData: {
      orderId: 'ORD-001',
      orderAmount: 100
    }
  });

  console.log('点击记录创建成功:', click.toJSON());
  return click;
}
```

---

## 2. 点击追踪中间件测试

### 2.1 测试点击验证功能

**文件：** `backend/src/middlewares/clickTracking.middleware.js`

**测试场景：**
```javascript
const { validateClick } = require('./src/middlewares/clickTracking.middleware');

async function testClickValidation() {
  console.log('=== 测试点击验证功能 ===\n');

  // 场景1：正常点击
  const validClick = {
    linkId: 'valid-link-id',
    ip: '192.168.1.1'
  };
  const result1 = await validateClick(validClick);
  console.log('场景1 - 正常点击:', result1.valid ? '✅ 通过' : '❌ 拒绝');

  // 场景2：重复点击（24小时内）
  const duplicateClick = {
    linkId: 'link-with-recent-click',
    ip: '192.168.1.2'
  };
  const result2 = await validateClick(duplicateClick);
  console.log('场景2 - 重复点击:', !result2.valid && result2.reason === 'duplicate_click' ? '✅ 正确拦截' : '❌ 应该拦截');

  // 场景3：可疑IP（短时间内大量点击）
  const suspiciousClick = {
    linkId: 'some-link-id',
    ip: 'suspicious-ip-address'
  };
  const result3 = await validateClick(suspiciousClick);
  console.log('场景3 - 可疑IP:', !result3.valid && result3.reason === 'suspicious_ip' ? '✅ 正确拦截' : '❌ 应该拦截');

  // 场景4：链接已过期
  const expiredLinkClick = {
    linkId: 'expired-link-id',
    ip: '192.168.1.3'
  };
  const result4 = await validateClick(expiredLinkClick);
  console.log('场景4 - 过期链接:', !result4.valid && result4.reason === 'link_expired' ? '✅ 正确拦截' : '❌ 应该拦截');

  // 场景5：点击次数超限
  const maxClicksReached = {
    linkId: 'link-with-max-clicks',
    ip: '192.168.1.4'
  };
  const result5 = await validateClick(maxClicksReached);
  console.log('场景5 - 点击超限:', !result5.valid && result5.reason === 'link_max_clicks_reached' ? '✅ 正确拦截' : '❌ 应该拦截');
}
```

### 2.2 测试归因Cookie设置

**测试代码：**
```javascript
const { setAttributionCookie } = require('./src/middlewares/clickTracking.middleware');

function testAttributionCookie() {
  console.log('\n=== 测试归因Cookie设置 ===\n');

  const mockRes = {
    cookie: function(name, value, options) {
      this._cookies = this._cookies || {};
      this._cookies[name] = { value, options };
      console.log(`设置Cookie: ${name}`);
      console.log(`值: ${value}`);
      console.log(`选项:`, options);
    }
  };

  const attributionData = {
    clickId: 'click-123',
    channelId: 'channel-456',
    offerId: 'offer-789',
    referralCode: 'TEST123',
    attributionModel: 'last-click',
    timestamp: new Date()
  };

  setAttributionCookie(mockRes, attributionData);

  console.log('\n✅ Cookie设置成功');

  // 验证Cookie
  const cookieValue = JSON.parse(mockRes._cookies.attribution.value);
  console.assert(cookieValue.clickId === 'click-123', 'Click ID不匹配');
  console.assert(cookieValue.attributionModel === 'last-click', '归因模型不匹配');
  console.log('✅ Cookie验证通过');
}
```

---

## 3. 归因服务测试

### 3.1 测试5种归因模型

**文件：** `backend/src/services/attribution.service.js`

**测试代码：**
```javascript
const attributionService = require('./src/services/attribution.service');

function testAttributionModels() {
  console.log('\n=== 测试归因模型 ===\n');

  // 模拟3个触点（点击）
  const touchpoints = [
    { id: 1, createdAt: new Date('2025-01-01T10:00:00'), toJSON: () => ({ id: 1 }) },
    { id: 2, createdAt: new Date('2025-01-02T14:00:00'), toJSON: () => ({ id: 2 }) },
    { id: 3, createdAt: new Date('2025-01-03T18:00:00'), toJSON: () => ({ id: 3 }) }
  ];

  // 测试首次点击归因
  const firstClick = attributionService.calculate('first-click', touchpoints);
  console.log('首次点击归因:');
  firstClick.forEach(tp => console.log(`  触点${tp.id}: 权重=${tp.attributionWeight}, 触点=${tp.touchpoint}`));
  console.assert(firstClick[0].attributionWeight === 1.0, '首次点击权重应该是1.0');
  console.log('✅ 首次点击归因测试通过\n');

  // 测试最后点击归因
  const lastClick = attributionService.calculate('last-click', touchpoints);
  console.log('最后点击归因:');
  lastClick.forEach(tp => console.log(`  触点${tp.id}: 权重=${tp.attributionWeight}, 触点=${tp.touchpoint}`));
  console.assert(lastClick[2].attributionWeight === 1.0, '最后点击权重应该是1.0');
  console.log('✅ 最后点击归因测试通过\n');

  // 测试多点触控归因
  const multiTouch = attributionService.calculate('multi-touch', touchpoints);
  console.log('多点触控归因:');
  multiTouch.forEach(tp => console.log(`  触点${tp.id}: 权重=${tp.attributionWeight}, 触点=${tp.touchpoint}`));
  console.assert(Math.abs(multiTouch[0].attributionWeight - 0.3333) < 0.01, '多点触控权重应该约等于0.3333');
  console.log('✅ 多点触控归因测试通过\n');

  // 测试位置基础归因
  const positionBased = attributionService.calculate('position-based', touchpoints);
  console.log('位置基础归因:');
  positionBased.forEach(tp => console.log(`  触点${tp.id}: 权重=${tp.attributionWeight}, 触点=${tp.touchpoint}`));
  console.assert(positionBased[0].attributionWeight === 0.4, '首次点击权重应该是0.4');
  console.assert(positionBased[2].attributionWeight === 0.4, '最后点击权重应该是0.4');
  console.log('✅ 位置基础归因测试通过\n');

  // 测试时间衰减归因
  const timeDecay = attributionService.calculate('time-decay', touchpoints);
  console.log('时间衰减归因:');
  timeDecay.forEach(tp => console.log(`  触点${tp.id}: 权重=${tp.attributionWeight.toFixed(4)}, 触点=${tp.touchpoint}`));
  console.assert(timeDecay[2].attributionWeight > timeDecay[0].attributionWeight, '最近点击权重应该更高');
  console.log('✅ 时间衰减归因测试通过\n');
}
```

### 3.2 测试佣金分配

**测试代码：**
```javascript
function testCommissionDistribution() {
  console.log('\n=== 测试佣金分配 ===\n');

  const totalCommission = 100;

  // 模拟3个触点，不同权重
  const touchpoints = [
    { id: 1, attributionWeight: 0.4 },
    { id: 2, attributionWeight: 0.2 },
    { id: 3, attributionWeight: 0.4 }
  ];

  const distributed = attributionService.distributeCommission(touchpoints, totalCommission);

  console.log('佣金分配结果:');
  distributed.forEach(tp => {
    console.log(`  触点${tp.id}: 权重=${tp.attributionWeight}, 佣金=$${tp.commission}`);
  });

  console.assert(distributed[0].commission === 40, '触点1应该得到$40');
  console.assert(distributed[1].commission === 20, '触点2应该得到$20');
  console.assert(distributed[2].commission === 40, '触点3应该得到$40');

  const totalDistributed = distributed.reduce((sum, tp) => sum + tp.commission, 0);
  console.assert(totalDistributed === totalCommission, '总佣金应该等于$100');

  console.log('\n✅ 佣金分配测试通过');
}
```

---

## 4. 佣金计算测试

### 4.1 测试基础佣金计算

**文件：** `backend/src/utils/commission.util.js`

**测试代码：**
```javascript
const { calculatePublisherCommission } = require('./src/utils/commission.util');

function testBasicCommission() {
  console.log('\n=== 测试基础佣金计算 ===\n');

  // 场景1：标准计算
  const result1 = calculatePublisherCommission(100, 10, 90);
  console.log('场景1 - $100订单, 10%佣金率, 90%分成:');
  console.log(`  总佣金: $${result1.totalCommission}`);
  console.log(`  Publisher佣金: $${result1.publisherCommission}`);
  console.log(`  平台佣金: $${result1.platformCommission}`);
  console.assert(result1.totalCommission === 10, '总佣金应该是$10');
  console.assert(result1.publisherCommission === 9, 'Publisher佣金应该是$9');
  console.log('✅ 标准计算测试通过\n');

  // 场景2：高佣金率
  const result2 = calculatePublisherCommission(500, 20, 80);
  console.log('场景2 - $500订单, 20%佣金率, 80%分成:');
  console.log(`  总佣金: $${result2.totalCommission}`);
  console.log(`  Publisher佣金: $${result2.publisherCommission}`);
  console.log(`  平台佣金: $${result2.platformCommission}`);
  console.assert(result2.publisherCommission === 80, 'Publisher佣金应该是$80');
  console.log('✅ 高佣金率测试通过\n');
}
```

### 4.2 测试增强佣金计算（量级+层级奖励）

**测试代码：**
```javascript
const { calculateEnhancedCommission } = require('./src/utils/commission.util');

function testEnhancedCommission() {
  console.log('\n=== 测试增强佣金计算 ===\n');

  // 量级奖励配置
  const volumeBonuses = [
    { threshold: 100, bonus: 2 },   // $100+订单额外2%
    { threshold: 500, bonus: 5 },   // $500+订单额外5%
    { threshold: 1000, bonus: 10 }  // $1000+订单额外10%
  ];

  // 层级配置
  const tier = { level: 2, rate: 15, name: 'Silver', bonus: 10 };

  // 场景1：$1000订单，Silver层级
  const result1 = calculateEnhancedCommission(1000, 10, 90, {
    volumeBonuses,
    tier
  });

  console.log('场景1 - $1000订单, 10%佣金率, 90%分成, Silver层级:');
  console.log(`  基础佣金: $${result1.baseCommission}`);
  console.log(`  量级奖励: $${result1.volumeBonus} (1000×10%)`);
  console.log(`  层级奖励: $${result1.tierBonus} (Silver固定$10)`);
  console.log(`  Publisher总佣金: $${result1.publisherCommission}`);
  console.log(`  总计: $${result1.baseCommission} + $${result1.volumeBonus} + $${result1.tierBonus} = $${result1.publisherCommission}`);

  console.assert(result1.baseCommission === 90, '基础佣金应该是$90 (1000×10%×90%)');
  console.assert(result1.volumeBonus === 100, '量级奖励应该是$100 (1000×10%)');
  console.assert(result1.tierBonus === 10, '层级奖励应该是$10');
  console.assert(result1.publisherCommission === 200, 'Publisher总佣金应该是$200 (90+100+10)');
  console.log('✅ 增强佣金计算测试通过\n');

  // 场景2：$300订单，无层级
  const result2 = calculateEnhancedCommission(300, 10, 90, {
    volumeBonuses
  });

  console.log('场景2 - $300订单, 10%佣金率, 90%分成, 无层级:');
  console.log(`  基础佣金: $${result2.baseCommission}`);
  console.log(`  量级奖励: $${result2.volumeBonus} (300×2%)`);
  console.log(`  层级奖励: $${result2.tierBonus}`);
  console.log(`  Publisher总佣金: $${result2.publisherCommission}`);

  console.assert(result2.baseCommission === 27, '基础佣金应该是$27');
  console.assert(result2.volumeBonus === 6, '量级奖励应该是$6 (300×2%)');
  console.assert(result2.publisherCommission === 33, '总佣金应该是$33 (27+6)');
  console.log('✅ 小额订单测试通过\n');
}
```

---

## 5. 完整流程测试

### 5.1 点击 → 转化 → 佣金流程

**测试代码：**
```javascript
async function testCompleteFlow() {
  console.log('\n=== 测试完整流程 ===\n');

  // 步骤1：用户点击推广链接
  console.log('步骤1: 用户点击推广链接');
  const clickData = {
    linkId: 'link-123',
    channelId: 'channel-456',
    offerId: 'offer-789',
    referralCode: 'SALE123',
    customerId: 'customer-001',
    sessionId: 'session-123',
    ip: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
    referrer: 'https://google.com',
    attributionModel: 'last-click',
    isValid: true
  };

  const click = await Click.create(clickData);
  console.log(`✅ 点击已记录: ${click.id}\n`);

  // 步骤2：用户完成购买（转化）
  console.log('步骤2: 用户完成购买');
  const conversionData = {
    channelId: 'channel-456',
    linkId: 'link-123',
    offerId: 'offer-789',
    orderId: 'ORD-20250123-001',
    orderAmount: 500,
    commission: calculateEnhancedCommission(500, 10, 90, {
      volumeBonuses: [{threshold: 100, bonus: 2}, {threshold: 500, bonus: 5}]
    }),
    status: 'approved'
  };

  const conversion = await Conversion.create(conversionData);
  console.log(`✅ 转化已记录: ${conversion.id}`);
  console.log(`   订单金额: $${conversion.orderAmount}`);
  console.log(`   Publisher佣金: $${conversion.commission.publisherCommission}\n`);

  // 步骤3：更新点击记录
  console.log('步骤3: 更新点击归因信息');
  await attributionService.updateClickAttribution(click.id, {
    model: 'last-click',
    weight: 1.0,
    touchpoint: 'last',
    conversionData: {
      orderId: conversion.orderId,
      orderAmount: conversion.orderAmount,
      commission: conversion.commission.publisherCommission
    }
  });

  await click.reload();
  console.log(`✅ 点击归因已更新`);
  console.log(`   归因模型: ${click.attributionModel}`);
  console.log(`   归因权重: ${click.attributionWeight}\n`);

  // 步骤4：更新链接统计
  console.log('步骤4: 更新链接统计');
  await AffiliateLink.increment('conversions', { where: { id: 'link-123' }});
  await AffiliateLink.update(
    { commission: sequelize.literal(`commission + ${conversion.commission.publisherCommission}`) },
    { where: { id: 'link-123' } }
  );
  console.log('✅ 链接统计已更新\n');

  console.log('=== 完整流程测试完成 ===');
}
```

---

## 6. API使用示例

### 6.1 创建推广链接（POST /api/links）

```bash
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "channelId": "channel-uuid",
    "offerId": "offer-uuid",
    "name": "Facebook Summer Sale Campaign",
    "attributionModel": "time-decay",
    "expiresAt": "2025-12-31T23:59:59Z",
    "maxClicks": 10000,
    "customParameters": {
      "utm_source": "facebook",
      "utm_medium": "cpc",
      "utm_campaign": "summer_sale_2025"
    },
    "metadata": {
      "abTest": "variant_a",
      "tags": ["summer", "sale", "facebook"]
    }
  }'
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "id": "link-uuid",
    "code": "A1B2C3D4E5F6G7H8",
    "url": "https://yourdomain.com/click/A1B2C3D4E5F6G7H8",
    "status": "active",
    "expiresAt": "2025-12-31T23:59:59Z",
    "maxClicks": 10000,
    "attributionModel": "time-decay",
    "clicks": 0,
    "uniqueClicks": 0,
    "conversions": 0,
    "commission": 0
  }
}
```

### 6.2 获取链接统计（GET /api/links/:id/stats）

```bash
curl -X GET http://localhost:3000/api/links/link-uuid/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "linkId": "link-uuid",
    "clicks": 1500,
    "uniqueClicks": 1200,
    "conversions": 60,
    "commission": 2400.00,
    "conversionRate": 4.0,
    "avgCommission": 40.00,
    "timeSeries": [
      { "date": "2025-01-20", "clicks": 200, "conversions": 8, "commission": 320.00 },
      { "date": "2025-01-21", "clicks": 250, "conversions": 10, "commission": 400.00 },
      { "date": "2025-01-22", "clicks": 180, "conversions": 7, "commission": 280.00 }
    ],
    "topReferrers": [
      { "domain": "google.com", "count": 800 },
      { "domain": "facebook.com", "count": 500 },
      { "domain": "direct", "count": 200 }
    ]
  }
}
```

### 6.3 点击追踪链接（GET /click/:code）

```bash
# 用户点击推广链接，自动重定向到目标URL
curl -L http://localhost:3000/click/A1B2C3D4E5F6G7H8
```

**流程：**
1. 系统记录点击信息（IP、UserAgent、Referrer等）
2. 验证点击（防止重复、可疑IP等）
3. 设置归因Cookie（30天有效）
4. 更新链接点击统计
5. 重定向到目标Offer URL

---

## 📊 测试检查清单

### 模型测试
- [ ] AffiliateLink增强字段测试
- [ ] Click增强字段测试
- [ ] 字段索引验证

### 中间件测试
- [ ] 点击验证功能测试
  - [ ] 正常点击通过
  - [ ] 重复点击拦截
  - [ ] 可疑IP拦截
  - [ ] 过期链接拦截
  - [ ] 点击超限拦截
- [ ] 归因Cookie设置测试
- [ ] 设备和浏览器识别测试

### 归因服务测试
- [ ] 5种归因模型计算测试
- [ ] 佣金分配测试
- [ ] 归因权重验证

### 佣金计算测试
- [ ] 基础佣金计算测试
- [ ] 量级奖励计算测试
- [ ] 层级奖励计算测试
- [ ] 边界条件测试

### 完整流程测试
- [ ] 点击 → 转化 → 佣金完整流程
- [ ] 统计更新验证
- [ ] Cookie读取和归因验证

---

**老王总结：** 这些测试用例覆盖了所有核心功能，老王我建议按照顺序逐个测试，确保每个功能都正常工作！如果有任何Bug，老王我会立即修复！💪
