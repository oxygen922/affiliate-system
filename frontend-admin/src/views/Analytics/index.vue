<template>
  <div class="analytics">
    <!-- 核心指标卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409eff">
              <el-icon :size="30"><Mouse /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ dashboardStats.totalClicks || 0 }}</div>
              <div class="stat-label">总点击数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67c23a">
              <el-icon :size="30"><Select /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ dashboardStats.totalConversions || 0 }}</div>
              <div class="stat-label">总转化数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #e6a23c">
              <el-icon :size="30"><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ dashboardStats.conversionRate || 0 }}%</div>
              <div class="stat-label">转化率</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #f56c6c">
              <el-icon :size="30"><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">${{ dashboardStats.totalCommission || 0 }}</div>
              <div class="stat-label">总佣金</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Channel表现排行 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card v-loading="topChannelsLoading">
          <template #header>
            <div class="card-header">
              <span>📊 Channel表现排行 (Top 10)</span>
              <el-button type="primary" size="small" @click="refreshTopChannels">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>

          <el-table :data="topChannels" stripe max-height="400">
            <el-table-column type="index" label="排名" width="60" />
            <el-table-column prop="name" label="渠道名称" show-overflow-tooltip />
            <el-table-column prop="publisher.email" label="Publisher" width="180" show-overflow-tooltip />
            <el-table-column prop="stats.clicks" label="点击" width="80" align="right" />
            <el-table-column prop="stats.conversions" label="转化" width="80" align="right" />
            <el-table-column label="转化率" width="80" align="right">
              <template #default="{ row }">
                {{ calculateRate(row.stats.clicks, row.stats.conversions) }}%
              </template>
            </el-table-column>
            <el-table-column prop="stats.commission" label="佣金" width="100" align="right">
              <template #default="{ row }">${{ row.stats.commission || 0 }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- Offer表现排行 -->
      <el-col :span="12">
        <el-card v-loading="topOffersLoading">
          <template #header>
            <div class="card-header">
              <span>🎯 Offer表现排行 (Top 10)</span>
              <el-button type="primary" size="small" @click="refreshTopOffers">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>

          <el-table :data="topOffers" stripe max-height="400">
            <el-table-column type="index" label="排名" width="60" />
            <el-table-column prop="name" label="Offer名称" show-overflow-tooltip />
            <el-table-column prop="merchant.name" label="商家" width="150" show-overflow-tooltip />
            <el-table-column prop="stats.clicks" label="点击" width="80" align="right" />
            <el-table-column prop="stats.conversions" label="转化" width="80" align="right" />
            <el-table-column label="转化率" width="80" align="right">
              <template #default="{ row }">
                {{ calculateRate(row.stats.clicks, row.stats.conversions) }}%
              </template>
            </el-table-column>
            <el-table-column prop="stats.commission" label="佣金" width="100" align="right">
              <template #default="{ row }">${{ row.stats.commission || 0 }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细统计表格 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>📈 数据概览</span>
            </div>
          </template>

          <el-descriptions :column="4" border>
            <el-descriptions-item label="总Publisher数">{{ dashboardStats.totalPublishers || 0 }}</el-descriptions-item>
            <el-descriptions-item label="活跃Publisher">{{ dashboardStats.activePublishers || 0 }}</el-descriptions-item>
            <el-descriptions-item label="总渠道数">{{ dashboardStats.totalChannels || 0 }}</el-descriptions-item>
            <el-descriptions-item label="活跃渠道">{{ dashboardStats.activeChannels || 0 }}</el-descriptions-item>
            <el-descriptions-item label="总Offer数">{{ dashboardStats.totalOffers || 0 }}</el-descriptions-item>
            <el-descriptions-item label="活跃Offer">{{ dashboardStats.activeOffers || 0 }}</el-descriptions-item>
            <el-descriptions-item label="待审核Offer">{{ dashboardStats.pendingOffers || 0 }}</el-descriptions-item>
            <el-descriptions-item label="平均佣金">${{ dashboardStats.avgCommission || 0 }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getDashboardStats, getTopChannels, getTopOffers } from '@/api/analytics'

// 数据
const dashboardStats = ref<any>({})
const topChannels = ref([])
const topOffers = ref([])
const topChannelsLoading = ref(false)
const topOffersLoading = ref(false)

// 获取仪表盘统计数据
const fetchDashboardStats = async () => {
  try {
    const res = await getDashboardStats()
    dashboardStats.value = res.data
  } catch (error) {
    console.error('获取仪表盘数据失败', error)
  }
}

// 获取Top Channels
const fetchTopChannels = async () => {
  topChannelsLoading.value = true
  try {
    const res = await getTopChannels(10)
    topChannels.value = res.data.channels || []
  } catch (error) {
    console.error('获取Top Channels失败', error)
  } finally {
    topChannelsLoading.value = false
  }
}

// 获取Top Offers
const fetchTopOffers = async () => {
  topOffersLoading.value = true
  try {
    const res = await getTopOffers(10)
    topOffers.value = res.data.offers || []
  } catch (error) {
    console.error('获取Top Offers失败', error)
  } finally {
    topOffersLoading.value = false
  }
}

// 刷新Top Channels
const refreshTopChannels = () => {
  fetchTopChannels()
  ElMessage.success('已刷新Channel排行')
}

// 刷新Top Offers
const refreshTopOffers = () => {
  fetchTopOffers()
  ElMessage.success('已刷新Offer排行')
}

// 计算转化率
const calculateRate = (clicks: number, conversions: number) => {
  if (!clicks || clicks === 0) return '0.00'
  return ((conversions / clicks) * 100).toFixed(2)
}

onMounted(() => {
  fetchDashboardStats()
  fetchTopChannels()
  fetchTopOffers()
})
</script>

<style scoped>
.analytics {
  padding: 0;
}

.stat-card {
  cursor: pointer;
  transition: box-shadow 0.3s;
}

.stat-card:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
