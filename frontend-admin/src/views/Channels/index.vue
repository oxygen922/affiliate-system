<template>
  <div class="channels">
    <el-card>
      <div class="header-actions">
        <el-input v-model="searchText" placeholder="搜索渠道..." style="width: 300px" clearable @input="handleSearch">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="statusFilter" placeholder="状态筛选" style="width: 150px; margin-left: 20px" clearable @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="活跃" value="active" />
          <el-option label="非活跃" value="inactive" />
          <el-option label="暂停" value="suspended" />
        </el-select>
      </div>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="name" label="渠道名称" width="200" />
        <el-table-column prop="publisher.email" label="所属Publisher" width="200" />
        <el-table-column prop="trafficType" label="流量类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.trafficType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="defaultCommissionRate" label="默认佣金%" width="120" align="right">
          <template #default="{ row }">{{ row.defaultCommissionRate }}%</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="stats.clicks" label="点击数" width="100" align="right" />
        <el-table-column prop="stats.conversions" label="转化数" width="100" align="right" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="showDetail(row)">详情</el-button>
            <el-dropdown @command="(cmd) => handleCommand(cmd, row)">
              <el-button size="small">
                更多<el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="active">设为活跃</el-dropdown-item>
                  <el-dropdown-item command="inactive">设为非活跃</el-dropdown-item>
                  <el-dropdown-item command="suspended">暂停</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total"
          layout="total, sizes, prev, pager, next, jumper" @current-change="fetchData" @size-change="fetchData" />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="渠道详情" width="800px">
      <el-descriptions v-if="currentChannel" :column="2" border>
        <el-descriptions-item label="渠道名称">{{ currentChannel.name }}</el-descriptions-item>
        <el-descriptions-item label="所属Publisher">{{ currentChannel.publisher?.email }}</el-descriptions-item>
        <el-descriptions-item label="流量类型">{{ currentChannel.trafficType }}</el-descriptions-item>
        <el-descriptions-item label="默认佣金">{{ currentChannel.defaultCommissionRate }}%</el-descriptions-item>
        <el-descriptions-item label="网站">{{ currentChannel.website || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ currentChannel.status }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ currentChannel.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="点击数">{{ currentChannel.stats?.clicks || 0 }}</el-descriptions-item>
        <el-descriptions-item label="转化数">{{ currentChannel.stats?.conversions || 0 }}</el-descriptions-item>
        <el-descriptions-item label="总佣金">${{ currentChannel.stats?.commission || 0 }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getChannelList, updateChannelStatus } from '@/api/channel'

const list = ref([])
const loading = ref(false)
const searchText = ref('')
const statusFilter = ref('')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const detailVisible = ref(false)
const currentChannel = ref<any>(null)

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getChannelList({ page: page.value, pageSize: pageSize.value, search: searchText.value, status: statusFilter.value })
    list.value = res.data.data
    total.value = res.data.pagination.total
  } finally { loading.value = false }
}

const handleSearch = () => { page.value = 1; fetchData() }
const getStatusType = (status: string) => ({ active: 'success', inactive: 'info', suspended: 'warning' }[status] || 'info')

const showDetail = async (row: any) => {
  const res: any = await getChannelList({ pageSize: 1, search: row.name })
  currentChannel.value = res.data.data[0]
  detailVisible.value = true
}

const handleCommand = async (cmd: string, row: any) => {
  await updateChannelStatus(row.id, cmd)
  ElMessage.success('状态更新成功')
  fetchData()
}

onMounted(fetchData)
</script>

<style scoped>
.channels { padding: 20px; }
.header-actions { display: flex; align-items: center; margin-bottom: 20px; }
.pagination-wrapper { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
