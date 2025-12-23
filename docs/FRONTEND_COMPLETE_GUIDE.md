# 🎨 前端完整开发指南

## 📋 所有页面完整代码示例

### 页面1：上级联盟管理（UpstreamAffiliates）

**文件位置：** `src/views/UpstreamAffiliates/index.vue`

```vue
<template>
  <div class="upstream-affiliates">
    <el-card>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          添加联盟
        </el-button>
      </div>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="name" label="联盟名称" />
        <el-table-column prop="code" label="代码" />
        <el-table-column label="同步状态">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.syncStatus)">
              {{ row.syncStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button size="small" @click="showImportDialog(row)">导入商家</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 对话框... -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getUpstreamList, deleteUpstream, importMerchants } from '@/api/upstream'

const list = ref([])
const loading = ref(false)

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getUpstreamList()
    list.value = res.data.upstreams
  } finally {
    loading.value = false
  }
}

const handleDelete = async (row: any) => {
  await deleteUpstream(row.id)
  ElMessage.success('删除成功')
  fetchData()
}

const getStatusType = (status: string) => {
  const map = { active: 'success', inactive: 'info', error: 'danger' }
  return map[status as keyof typeof map] || 'info'
}

onMounted(() => fetchData())
</script>

<style scoped>
.upstream-affiliates { padding: 20px; }
.header-actions { margin-bottom: 20px; }
</style>
```

---

### 页面2：渠道管理（Channels）

**API文件：** `src/api/channel.ts`

```typescript
import request from '@/utils/request'

export function getChannelList(params?: any) {
  return request({
    url: '/admin/channels',
    method: 'GET',
    params
  })
}

export function updateChannelStatus(id: string, status: string) {
  return request({
    url: `/admin/channels/${id}/status`,
    method: 'PUT',
    data: { status }
  })
}
```

**页面代码：** `src/views/Channels/index.vue`

```vue
<template>
  <div class="channels">
    <el-card>
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="name" label="渠道名称" />
        <el-table-column prop="publisher.email" label="所属Publisher" />
        <el-table-column prop="trafficType" label="流量类型" />
        <el-table-column prop="defaultCommissionRate" label="默认佣金%" />
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button size="small" @click="handleUpdateStatus(row)">
              更新状态
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getChannelList, updateChannelStatus } from '@/api/channel'

const list = ref([])
const loading = ref(false)

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getChannelList()
    list.value = res.data.data
  } finally {
    loading.value = false
  }
}

const handleUpdateStatus = async (row: any) => {
  await updateChannelStatus(row.id, row.status === 'active' ? 'inactive' : 'active')
  ElMessage.success('状态更新成功')
  fetchData()
}

onMounted(() => fetchData())
</script>

<style scoped>
.channels { padding: 20px; }
</style>
```

---

### 页面3：Offer管理（Offers）

**API文件：** `src/api/offer.ts`

```typescript
import request from '@/utils/request'

export function getOfferList(params?: any) {
  return request({
    url: '/admin/offers',
    method: 'GET',
    params
  })
}

export function createOffer(data: any) {
  return request({
    url: '/admin/offers',
    method: 'POST',
    data
  })
}

export function approveOffer(id: string, status: string, reason?: string) {
  return request({
    url: `/admin/offers/${id}/approve`,
    method: 'POST',
    data: { status, reason }
  })
}
```

**页面代码：** `src/views/Offers/index.vue`

```vue
<template>
  <div class="offers">
    <el-card>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog">添加Offer</el-button>
      </div>

      <el-table :data="list" v-loading="loading">
        <el-table-column prop="name" label="Offer名称" />
        <el-table-column prop="merchant.name" label="商家" />
        <el-table-column prop="commissionRate" label="佣金率%" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button size="small" type="success" @click="handleApprove(row)">
              通过
            </el-button>
            <el-button size="small" type="danger" @click="handleReject(row)">
              拒绝
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getOfferList, approveOffer } from '@/api/offer'

const list = ref([])
const loading = ref(false)

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getOfferList()
    list.value = res.data.offers
  } finally {
    loading.value = false
  }
}

const handleApprove = async (row: any) => {
  await approveOffer(row.id, 'approved')
  ElMessage.success('审核通过')
  fetchData()
}

const handleReject = async (row: any) => {
  await approveOffer(row.id, 'rejected', '不符合要求')
  ElMessage.success('已拒绝')
  fetchData()
}

const getStatusType = (status: string) => {
  const map = { active: 'success', pending: 'warning', suspended: 'danger' }
  return map[status as keyof typeof map] || 'info'
}

onMounted(() => fetchData())
</script>

<style scoped>
.offers { padding: 20px; }
.header-actions { margin-bottom: 20px; }
</style>
```

---

### 页面4：数据统计（Analytics）

**页面代码：** `src/views/Analytics/index.vue`

```vue
<template>
  <div class="analytics">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value">{{ stats.totalPublishers }}</div>
          <div class="stat-label">总Publisher数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value">{{ stats.totalChannels }}</div>
          <div class="stat-label">总渠道数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value">${{ stats.todayCommission }}</div>
          <div class="stat-label">今日佣金</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value">${{ stats.monthlyCommission }}</div>
          <div class="stat-label">本月佣金</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>Channel表现排行</span>
          </template>
          <el-table :data="topChannels" size="small">
            <el-table-column prop="name" label="渠道名称" />
            <el-table-column prop="conversionCount" label="转化数" />
            <el-table-column prop="totalCommission" label="总佣金" />
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <span>Offer表现排行</span>
          </template>
          <el-table :data="topOffers" size="small">
            <el-table-column prop="name" label="Offer名称" />
            <el-table-column prop="conversionCount" label="转化数" />
            <el-table-column prop="totalOrderAmount" label="总订单额" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from '@/utils/request'

const stats = ref({
  totalPublishers: 0,
  totalChannels: 0,
  todayCommission: 0,
  monthlyCommission: 0
})

const topChannels = ref([])
const topOffers = ref([])

const fetchData = async () => {
  try {
    const res = await axios.get('/admin/analytics/dashboard')
    stats.value = res.data.data.overview
  } catch (error) {
    console.error('获取统计数据失败', error)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.analytics { padding: 20px; }
.stat-card { text-align: center; }
.stat-value { font-size: 28px; font-weight: bold; color: #409eff; }
.stat-label { margin-top: 10px; color: #909399; }
</style>
```

---

## 🚀 Publisher端和广告主端快速搭建

### Publisher端初始化

**命令：**
```bash
cd ../frontend-publisher
npm create vite@latest . -- --template vue-ts
npm install
npm install vue-router@4 pinia element-plus axios @element-plus/icons-vue
```

**关键页面：**
- 渠道管理（我的渠道）
- Offer市场（浏览Offer）
- 推广链接（我的链接）
- 佣金统计（我的收益）
- 提现管理（申请提现）

### 广告主端初始化

**命令：**
```bash
cd ../frontend-advertiser
npm create vite@latest . -- --template vue-ts
npm install
npm install vue-router@4 pinia element-plus axios @element-plus/icons-vue
```

**关键页面：**
- Offer管理（我的Offer）
- 推广效果（数据统计）
- 财务管理（充值、账单）

---

## 📝 开发技巧

### 1. 复用组件
```vue
<!-- 创建通用组件 -->
<!-- components/Common/TablePage.vue -->
<template>
  <div class="table-page">
    <el-card>
      <slot name="actions"></slot>
      <el-table :data="data" v-loading="loading">
        <slot name="columns"></slot>
      </el-table>
      <el-pagination
        v-model:current-page="page"
        :total="total"
        @current-change="$emit('fetch')"
      />
    </el-card>
  </div>
</template>
```

### 2. 组合式函数
```typescript
// composables/useTable.ts
export function useTable(apiFunc: Function) {
  const list = ref([])
  const loading = ref(false)
  const page = ref(1)
  const total = ref(0)

  const fetchData = async () => {
    loading.value = true
    try {
      const res = await apiFunc({ page: page.value })
      list.value = res.data.data
      total.value = res.data.total
    } finally {
      loading.value = false
    }
  }

  return { list, loading, page, total, fetchData }
}
```

### 3. 快速开发模板
```vue
<template>
  <div class="page">
    <el-card>
      <!-- 1. 操作按钮 -->
      <!-- 2. 搜索筛选 -->
      <!-- 3. 数据表格 -->
      <!-- 4. 分页 -->
    </el-card>

    <!-- 对话框（可选） -->
  </div>
</template>

<script setup lang="ts">
// 1. 导入API
// 2. 定义响应式数据
// 3. 编写业务逻辑
// 4. onMounted加载数据
</script>

<style scoped>
.page { padding: 20px; }
</style>
```

---

## ✅ 检查清单

### 管理后台（frontend-admin）
- [x] 项目初始化
- [x] 路由配置
- [x] 登录页面
- [x] 布局组件
- [ ] 上级联盟管理（框架已完成）
- [ ] 渠道管理（框架已完成）
- [ ] Offer管理（框架已完成）
- [ ] Publisher管理（框架已完成）
- [ ] 数据统计（框架已完成）

### Publisher端（frontend-publisher）
- [ ] 项目初始化
- [ ] 登录注册
- [ ] 渠道管理
- [ ] Offer市场
- [ ] 推广链接
- [ ] 佣金统计
- [ ] 提现管理

### 广告主端（frontend-advertiser）
- [ ] 项目初始化
- [ ] 登录注册
- [ ] Offer管理
- [ ] 推广效果
- [ ] 数据统计

---

**老王出品，必属精品！继续加油！** 💪
