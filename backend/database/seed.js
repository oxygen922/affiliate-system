/**
 * 数据库种子脚本
 * 老王出品：创建测试数据
 */

require('dotenv').config();
const { sequelize, User, Publisher, Channel, UpstreamAffiliate, Merchant, Offer } = require('../src/models');
const bcrypt = require('bcryptjs');
const logger = require('../src/utils/logger.util');

async function seed() {
  try {
    logger.info('🌱 开始创建测试数据...');

    // 1. 创建管理员用户
    logger.info('创建管理员用户...');
    const adminPassword = await bcrypt.hash('admin123456', 10);
    const admin = await User.findOrCreate({
      where: { email: 'admin@example.com' },
      defaults: {
        email: 'admin@example.com',
        password: adminPassword,
        role: 'admin',
        status: 'active'
      }
    });
    logger.info(`✅ 管理员用户: ${admin[0].email}`);

    // 2. 创建测试Publisher
    logger.info('创建测试Publisher...');
    const testUserPassword = await bcrypt.hash('test123456', 10);
    const testUser = await User.findOrCreate({
      where: { email: 'publisher@test.com' },
      defaults: {
        email: 'publisher@test.com',
        password: testUserPassword,
        role: 'publisher',
        status: 'active'
      }
    });

    const testPublisher = await Publisher.findOrCreate({
      where: { userId: testUser[0].id },
      defaults: {
        userId: testUser[0].id,
        name: '测试Publisher',
        company: '测试公司',
        website: 'https://test.com',
        phone: '13800138000',
        defaultCommissionRate: 80,
        balance: 1000,
        totalEarned: 5000,
        status: 'active'
      }
    });
    logger.info(`✅ 测试Publisher: ${testPublisher[0].name}`);

    // 3. 创建测试Channel
    logger.info('创建测试Channel...');
    const testChannel = await Channel.findOrCreate({
      where: { name: '测试网站流量' },
      defaults: {
        publisherId: testPublisher[0].id,
        name: '测试网站流量',
        description: '用于测试的网站流量渠道',
        website: 'https://test-channel.com',
        trafficType: 'website',
        defaultCommissionRate: 80,
        status: 'active',
        stats: {
          clicks: 1500,
          conversions: 75,
          commission: 500
        }
      }
    });
    logger.info(`✅ 测试Channel: ${testChannel[0].name}`);

    // 4. 创建上级联盟
    logger.info('创建上级联盟...');
    const upstreams = [
      {
        name: 'Commission Junction (CJ)',
        code: 'cj',
        website: 'https://www.cj.com',
        description: '全球最大的联盟营销平台之一',
        commissionRate: 20,
        syncStatus: 'active',
        status: 'active'
      },
      {
        name: 'ShareASale',
        code: 'shareasale',
        website: 'https://www.shareasale.com',
        description: '领先的联盟营销网络',
        commissionRate: 25,
        syncStatus: 'active',
        status: 'active'
      },
      {
        name: 'Impact',
        code: 'impact',
        website: 'https://www.impact.com',
        description: '现代化联盟营销平台',
        commissionRate: 15,
        syncStatus: 'active',
        status: 'active'
      }
    ];

    for (const upstream of upstreams) {
      await UpstreamAffiliate.findOrCreate({
        where: { code: upstream.code },
        defaults: upstream
      });
    }
    logger.info(`✅ 创建了 ${upstreams.length} 个上级联盟`);

    // 5. 创建商家
    logger.info('创建商家...');
    const cjUpstream = await UpstreamAffiliate.findOne({ where: { code: 'cj' } });
    const merchants = [
      {
        upstreamAffiliateId: cjUpstream.id,
        merchantIdInPlatform: '12345',
        name: 'Amazon',
        website: 'https://www.amazon.com',
        category: '电商',
        commissionRate: 5,
        status: 'active',
        syncStatus: 'synced'
      },
      {
        upstreamAffiliateId: cjUpstream.id,
        merchantIdInPlatform: '12346',
        name: 'eBay',
        website: 'https://www.ebay.com',
        category: '电商',
        commissionRate: 6,
        status: 'active',
        syncStatus: 'synced'
      },
      {
        upstreamAffiliateId: cjUpstream.id,
        merchantIdInPlatform: '12347',
        name: 'Walmart',
        website: 'https://www.walmart.com',
        category: '电商',
        commissionRate: 4,
        status: 'active',
        syncStatus: 'synced'
      },
      {
        upstreamAffiliateId: cjUpstream.id,
        merchantIdInPlatform: '12348',
        name: 'Best Buy',
        website: 'https://www.bestbuy.com',
        category: '电子产品',
        commissionRate: 3,
        status: 'active',
        syncStatus: 'synced'
      },
      {
        upstreamAffiliateId: cjUpstream.id,
        merchantIdInPlatform: '12349',
        name: 'Target',
        website: 'https://www.target.com',
        category: '零售',
        commissionRate: 4,
        status: 'active',
        syncStatus: 'synced'
      }
    ];

    for (const merchant of merchants) {
      await Merchant.findOrCreate({
        where: { merchantIdInPlatform: merchant.merchantIdInPlatform },
        defaults: merchant
      });
    }
    logger.info(`✅ 创建了 ${merchants.length} 个商家`);

    // 6. 创建Offer
    logger.info('创建Offer...');
    const amazonMerchant = await Merchant.findOne({ where: { name: 'Amazon' } });
    const offers = [
      {
        merchantId: amazonMerchant.id,
        offerIdInPlatform: 'amazon-electronics',
        name: 'Amazon Electronics - 电子产品分类',
        description: 'Amazon电子产品分类推广计划，包括手机、电脑、相机等',
        commissionType: 'percentage',
        commissionRate: 5,
        trackingLink: 'https://www.amazon.com/ref=as_xx_xx_?tag={affiliate_id}&offer={offer_id}',
        countries: ['US', 'CA', 'UK'],
        offerType: 'cps',
        status: 'active',
        needsApproval: false,
        startDate: new Date(),
        endDate: null
      },
      {
        merchantId: amazonMerchant.id,
        offerIdInPlatform: 'amazon-books',
        name: 'Amazon Books - 图书分类',
        description: 'Amazon图书分类推广计划',
        commissionType: 'percentage',
        commissionRate: 4.5,
        trackingLink: 'https://www.amazon.com/ref=as_xx_xx_?tag={affiliate_id}&offer={offer_id}',
        countries: ['US', 'CA', 'UK'],
        offerType: 'cps',
        status: 'active',
        needsApproval: false,
        startDate: new Date(),
        endDate: null
      },
      {
        merchantId: amazonMerchant.id,
        offerIdInPlatform: 'amazon-fashion',
        name: 'Amazon Fashion - 时尚分类',
        description: 'Amazon时尚分类推广计划，包括服装、鞋类、配饰等',
        commissionType: 'percentage',
        commissionRate: 6,
        trackingLink: 'https://www.amazon.com/ref=as_xx_xx_?tag={affiliate_id}&offer={offer_id}',
        countries: ['US', 'CA', 'UK'],
        offerType: 'cps',
        status: 'active',
        needsApproval: false,
        startDate: new Date(),
        endDate: null
      }
    ];

    for (const offer of offers) {
      await Offer.findOrCreate({
        where: { offerIdInPlatform: offer.offerIdInPlatform },
        defaults: offer
      });
    }
    logger.info(`✅ 创建了 ${offers.length} 个Offer`);

    logger.info('🎉 测试数据创建完成！');
    logger.info('');
    logger.info('📝 登录信息：');
    logger.info('   管理员: admin@example.com / admin123456');
    logger.info('   测试Publisher: publisher@test.com / test123456');
    logger.info('');

    process.exit(0);
  } catch (error) {
    logger.error('❌ 创建测试数据失败:', error);
    process.exit(1);
  }
}

// 执行种子脚本
seed();
