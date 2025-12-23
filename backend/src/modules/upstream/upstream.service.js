/**
 * UpstreamAffiliate Service - 上级联盟业务逻辑层
 * 老王出品：上级联盟管理核心业务
 */

const { UpstreamAffiliate, Merchant, Offer } = require('../../models');
const logger = require('../../utils/logger.util');

/**
 * 上级联盟服务类
 */
class UpstreamAffiliateService {
  /**
   * 创建上级联盟
   */
  async createUpstreamAffiliate(data) {
    try {
      // 检查代码是否已存在
      const existing = await UpstreamAffiliate.findOne({
        where: { code: data.code }
      });

      if (existing) {
        throw new Error('联盟代码已存在');
      }

      const upstream = await UpstreamAffiliate.create({
        ...data,
        syncStatus: 'inactive',
        status: 'active'
      });

      logger.info(`上级联盟创建成功: ${upstream.id}, 代码: ${upstream.code}`);
      return upstream;
    } catch (error) {
      logger.error('创建上级联盟失败:', error);
      throw error;
    }
  }

  /**
   * 获取上级联盟列表
   */
  async getUpstreamAffiliates(options = {}) {
    const {
      page = 1,
      pageSize = 20,
      status,
      syncStatus,
      search
    } = options;

    const where = {};

    if (status) where.status = status;
    if (syncStatus) where.syncStatus = syncStatus;
    if (search) {
      where[require('../../models').sequelize.Op.or] = [
        { name: { [require('../../models').sequelize.Op.like]: `%${search}%` } },
        { code: { [require('../../models').sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await UpstreamAffiliate.findAndCountAll({
      where,
      include: [
        {
          model: Merchant,
          as: 'merchants',
          attributes: ['id'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });

    // 统计每个联盟的商家数、Offer数
    const result = rows.map(upstream => {
      const upstreamData = upstream.toJSON();
      upstreamData.merchantCount = upstreamData.merchants?.length || 0;
      delete upstreamData.merchants;
      return upstreamData;
    });

    return {
      upstreams: result,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(count / pageSize)
    };
  }

  /**
   * 获取上级联盟详情
   */
  async getUpstreamAffiliateById(id) {
    const upstream = await UpstreamAffiliate.findByPk(id, {
      include: [
        {
          model: Merchant,
          as: 'merchants',
          include: [
            {
              model: Offer,
              as: 'offers',
              attributes: ['id']
            }
          ]
        }
      ]
    });

    if (!upstream) {
      throw new Error('上级联盟不存在');
    }

    // 统计商家和Offer数量
    const upstreamData = upstream.toJSON();
    upstreamData.merchantCount = upstreamData.merchants?.length || 0;
    upstreamData.offerCount = upstreamData.merchants?.reduce((sum, m) => sum + (m.offers?.length || 0), 0) || 0;
    delete upstreamData.merchants;

    return upstreamData;
  }

  /**
   * 更新上级联盟
   */
  async updateUpstreamAffiliate(id, updateData) {
    const upstream = await UpstreamAffiliate.findByPk(id);

    if (!upstream) {
      throw new Error('上级联盟不存在');
    }

    await upstream.update(updateData);
    logger.info(`上级联盟更新成功: ${id}`);

    return upstream;
  }

  /**
   * 删除上级联盟
   */
  async deleteUpstreamAffiliate(id) {
    const upstream = await UpstreamAffiliate.findByPk(id);

    if (!upstream) {
      throw new Error('上级联盟不存在');
    }

    // 检查是否有关联的商家
    const merchantCount = await Merchant.count({
      where: { upstreamAffiliateId: id }
    });

    if (merchantCount > 0) {
      throw new Error(`该联盟下还有${merchantCount}个商家，无法删除`);
    }

    await upstream.destroy();
    logger.info(`上级联盟删除成功: ${id}`);

    return { message: '上级联盟删除成功' };
  }

  /**
   * 批量导入商家（预留接口）
   */
  async importMerchants(upstreamId, merchantsData) {
    const upstream = await UpstreamAffiliate.findByPk(upstreamId);

    if (!upstream) {
      throw new Error('上级联盟不存在');
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const merchantData of merchantsData) {
      try {
        // 检查商家是否已存在
        const existing = await Merchant.findOne({
          where: {
            upstreamAffiliateId: upstreamId,
            merchantIdInPlatform: merchantData.merchantIdInPlatform
          }
        });

        if (existing) {
          // 更新现有商家
          await existing.update(merchantData);
        } else {
          // 创建新商家
          await Merchant.create({
            ...merchantData,
            upstreamAffiliateId: upstreamId,
            syncStatus: 'synced'
          });
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          merchant: merchantData.name || merchantData.merchantIdInPlatform,
          error: error.message
        });
      }
    }

    logger.info(`批量导入商家完成: 成功${results.success}个, 失败${results.failed}个`);

    return results;
  }

  /**
   * 更新同步状态
   */
  async updateSyncStatus(id, syncStatus, lastSyncAt = new Date()) {
    const upstream = await UpstreamAffiliate.findByPk(id);

    if (!upstream) {
      throw new Error('上级联盟不存在');
    }

    await upstream.update({ syncStatus, lastSyncAt });

    return upstream;
  }

  /**
   * 获取上级联盟统计数据
   */
  async getUpstreamStats(id) {
    const upstream = await UpstreamAffiliate.findByPk(id, {
      include: [
        {
          model: Merchant,
          as: 'merchants',
          include: [
            {
              model: Offer,
              as: 'offers'
            }
          ]
        }
      ]
    });

    if (!upstream) {
      throw new Error('上级联盟不存在');
    }

    const merchants = upstream.merchants || [];
    const totalMerchants = merchants.length;
    const totalOffers = merchants.reduce((sum, m) => sum + (m.offers?.length || 0), 0);
    const activeOffers = merchants.reduce((sum, m) => {
      return sum + (m.offers?.filter(o => o.status === 'active').length || 0);
    }, 0);

    return {
      upstreamId: upstream.id,
      name: upstream.name,
      code: upstream.code,
      totalMerchants,
      totalOffers,
      activeOffers,
      syncStatus: upstream.syncStatus,
      lastSyncAt: upstream.lastSyncAt
    };
  }
}

module.exports = new UpstreamAffiliateService();
