<template>
  <div class="dashboard">
    <!-- 核心指标卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card" v-loading="loading">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409eff">
              <el-icon :size="30"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalPublishers || 0 }}</div>
              <div class="stat-label">总Publisher数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card" v-loading="loading">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67c23a">
              <el-icon :size="30"><Menu /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalChannels || 0 }}</div>
              <div class="stat-label">总渠道数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card" v-loading="loading">
          <div class="stat-content">
            <div class="stat-icon" style="background: #e6a23c">
              <el-icon :size="30"><Goods /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalOffers || 0 }}</div>
              <div class="stat-label">总Offer数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card" v-loading="loading">
          <div class="stat-content">
            <div class="stat-icon" style="background: #f56c6c">
              <el-icon :size="30"><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">${{ stats.totalCommission || 0 }}</div>
              <div class="stat-label">总佣金</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷操作和系统概览 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 快捷操作 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>⚡ 快捷操作</span>
            </div>
          </template>

          <el-space :size="15" wrap>
            <el-button type="primary" @click="$router.push('/upstream-affiliates')">
              <el-icon><Plus /></el-icon>
              添加上级联盟
            </el-button>
            <el-button type="success" @click="$router.push('/offers')">
              <el-icon><Goods /></el-icon>
              审核Offer
              <el-badge v-if="stats.pendingOffers > 0" :value="stats.pendingOffers" class="badge" />
            </el-button>
            <el-button type="warning" @click="$router.push('/publishers')">
              <el-icon><User /></el-icon>
              管理Publisher
            </el-button>
            <el-button type="info" @click="$router.push('/analytics')">
              <el-icon><TrendCharts /></el-icon>
              查看统计
            </el-button>
          </el-space>
        </el-card>
      </el-col>

      <!-- 系统概览 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>📊 系统概览</span>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="活跃Publisher">{{ stats.activePublishers || 0 }}</el-descriptions-item>
            <el-descriptions-item label="活跃渠道">{{ stats.activeChannels || 0 }}</el-descriptions-item>
            <el-descriptions-item label="活跃Offer">{{ stats.activeOffers || 0 }}</el-descriptions-item>
            <el-descriptions-item label="待审核Offer">
              <el-tag type="warning" v-if="stats.pendingOffers > 0">{{ stats.pendingOffers }}</el-tag>
              <span v-else>0</span>
            </el-descriptions-item>
            <el-descriptions-item label="总点击数">{{ stats.totalClicks || 0 }}</el-descriptions-item>
            <el-descriptions-item label="总转化数">{{ stats.totalConversions || 0 }}</el-descriptions-item>
            <el-descriptions-item label="转化率">{{ stats.conversionRate || 0 }}%</el-descriptions-item>
            <el-descriptions-item label="平均佣金">${{ stats.avgCommission || 0 }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <!-- 待办事项 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>📋 待办事项</span>
              <el-button type="primary" size="small" @click="refreshData">
                <el-icon><Refresh /></el-icon>
                刷新数据
              </el-button>
            </div>
          </template>

          <el-empty v-if="!hasTodos" description="暂无待办事项 🎉" />
          <el-timeline v-else>
            <el-timeline-item
              v-if="stats.pendingOffers > 0"
              :timestamp="`${stats.pendingOffers}个Offer待审核`"
              placement="top"
              type="warning"
            >
              <el-card>
                <h4>Offer审核</h4>
                <p>您有 {{ stats.pendingOffers }} 个Offer待审核，请及时处理</p>
                <el-button type="primary" size="small" @click="$router.push('/offers')">
                  立即处理
                </el-button>
              </el-card>
            </el-timeline-item>

            <el-timeline-item
              v-if="stats.inactivePublishers > 0"
              :timestamp="`${stats.inactivePublishers}个Publisher未激活`"
              placement="top"
              type="info"
            >
              <el-card>
                <h4>Publisher激活</h4>
                <p>您有 {{ stats.inactivePublishers }} 个Publisher未激活，可能需要跟进</p>
                <el-button type="primary" size="small" @click="$router.push('/publishers')">
                  查看详情
                </el-button>
              </el-card>
            </el-timeline-item>

            <el-timeline-item
              timestamp="数据同步"
              placement="top"
              type="success"
            >
              <el-card>
                <h4>系统数据</h4>
                <p>系统运行正常，数据同步状态良好</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getDashboardStats } from '@/api/analytics'

// 数据
const stats = ref<any>({})
const loading = ref(false)

// 是否有待办事项
const hasTodos = computed(() => {
  return stats.value.pendingOffers > 0 || stats.value.inactivePublishers > 0
})

// 获取仪表盘数据
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getDashboardStats()
    stats.value = res.data
  } catch (error) {
    console.error('获取仪表盘数据失败', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = () => {
  fetchData()
  ElMessage.success('数据已刷新')
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
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

.badge {
  margin-left: 5px;
}

:deep(.el-timeline-item__timestamp) {
  color: #606266;
  font-weight: 500;
}
</style>
