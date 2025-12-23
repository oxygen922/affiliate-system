<template>
  <div class="publishers">
    <el-card>
      <!-- 操作栏 -->
      <div class="header-actions">
        <el-select
          v-model="statusFilter"
          placeholder="状态筛选"
          style="width: 150px"
          clearable
          @change="handleSearch"
        >
          <el-option label="全部" value="" />
          <el-option label="活跃" value="active" />
          <el-option label="非活跃" value="inactive" />
          <el-option label="暂停" value="suspended" />
        </el-select>
        <el-input
          v-model="searchText"
          placeholder="搜索Publisher..."
          style="width: 300px; margin-left: 20px"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <!-- 表格 -->
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="email" label="邮箱" width="220" />
        <el-table-column prop="profile.company" label="公司名称" width="180" show-overflow-tooltip />
        <el-table-column prop="profile.contactPerson" label="联系人" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="stats.channels" label="渠道数" width="100" align="right" />
        <el-table-column prop="stats.clicks" label="点击数" width="100" align="right" />
        <el-table-column prop="stats.conversions" label="转化数" width="100" align="right" />
        <el-table-column prop="stats.commission" label="总佣金" width="120" align="right">
          <template #default="{ row }">${{ row.stats?.commission || 0 }}</template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="showDetail(row)">详情</el-button>
            <el-button size="small" @click="showCommissionDialog(row)">设置佣金</el-button>
            <el-dropdown @command="(cmd) => handleStatusCommand(cmd, row)">
              <el-button size="small">
                状态<el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="active">活跃</el-dropdown-item>
                  <el-dropdown-item command="inactive">非活跃</el-dropdown-item>
                  <el-dropdown-item command="suspended">暂停</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="fetchData"
          @size-change="fetchData"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="Publisher详情" width="900px">
      <el-descriptions v-if="currentPublisher" :column="2" border>
        <el-descriptions-item label="邮箱" :span="2">{{ currentPublisher.email }}</el-descriptions-item>
        <el-descriptions-item label="公司名称">{{ currentPublisher.profile?.company || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ currentPublisher.profile?.contactPerson || '-' }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ currentPublisher.profile?.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentPublisher.status)">{{ currentPublisher.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ currentPublisher.profile?.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="网站" :span="2">{{ currentPublisher.profile?.website || '-' }}</el-descriptions-item>
        <el-descriptions-item label="注册时间" :span="2">{{ formatDate(currentPublisher.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="渠道数">{{ currentPublisher.stats?.channels || 0 }}</el-descriptions-item>
        <el-descriptions-item label="点击数">{{ currentPublisher.stats?.clicks || 0 }}</el-descriptions-item>
        <el-descriptions-item label="转化数">{{ currentPublisher.stats?.conversions || 0 }}</el-descriptions-item>
        <el-descriptions-item label="总佣金">${{ currentPublisher.stats?.commission || 0 }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 佣金设置对话框 -->
    <el-dialog v-model="commissionVisible" title="设置佣金比例" width="600px">
      <el-form :model="commissionForm" ref="commissionFormRef" label-width="140px">
        <el-form-item label="Publisher">
          <span>{{ currentPublisher?.email }}</span>
        </el-form-item>
        <el-form-item label="适用范围">
          <el-radio-group v-model="commissionForm.scope">
            <el-radio value="global">全局默认</el-radio>
            <el-radio value="offer">特定Offer</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="佣金比例%" prop="rate" v-if="commissionForm.scope === 'global'">
          <el-input-number v-model="commissionForm.rate" :min="0" :max="100" :precision="2" />
          <span style="margin-left: 10px">%</span>
        </el-form-item>
        <template v-if="commissionForm.scope === 'offer'">
          <el-form-item label="选择Offer">
            <el-select v-model="commissionForm.offerId" placeholder="请选择Offer" style="width: 100%">
              <el-option
                v-for="offer in offerList"
                :key="offer.id"
                :label="offer.name"
                :value="offer.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="佣金比例%">
            <el-input-number v-model="commissionForm.rate" :min="0" :max="100" :precision="2" />
            <span style="margin-left: 10px">%</span>
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <el-button @click="commissionVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCommissionSubmit" :loading="commissionSubmitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPublisherList, getPublisherDetail, updatePublisherStatus, setPublisherCommissionRate } from '@/api/publisher'
import { getOfferList } from '@/api/offer'
import dayjs from 'dayjs'

// 数据
const list = ref([])
const loading = ref(false)
const searchText = ref('')
const statusFilter = ref('')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 对话框
const detailVisible = ref(false)
const commissionVisible = ref(false)
const commissionSubmitting = ref(false)

// 当前选中的Publisher
const currentPublisher = ref<any>(null)

// 佣金表单
const commissionFormRef = ref()
const commissionForm = reactive({
  scope: 'global',
  rate: 0,
  offerId: ''
})

// Offer列表（用于选择特定Offer）
const offerList = ref([])

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getPublisherList({
      page: page.value,
      pageSize: pageSize.value,
      search: searchText.value,
      status: statusFilter.value
    })
    list.value = res.data.publishers
    total.value = res.data.total
  } catch (error) {
    console.error('获取数据失败', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  page.value = 1
  fetchData()
}

// 显示详情
const showDetail = async (row: any) => {
  try {
    const res = await getPublisherDetail(row.id)
    currentPublisher.value = res.data
    detailVisible.value = true
  } catch (error) {
    console.error('获取详情失败', error)
  }
}

// 状态命令
const handleStatusCommand = async (cmd: string, row: any) => {
  try {
    await updatePublisherStatus(row.id, cmd)
    ElMessage.success('状态更新成功')
    fetchData()
  } catch (error) {
    console.error('状态更新失败', error)
  }
}

// 显示佣金设置对话框
const showCommissionDialog = async (row: any) => {
  currentPublisher.value = row
  commissionForm.scope = 'global'
  commissionForm.rate = 0
  commissionForm.offerId = ''

  // 如果需要选择Offer，加载Offer列表
  try {
    const res = await getOfferList({ pageSize: 1000 })
    offerList.value = res.data.offers || []
  } catch (error) {
    console.error('加载Offer列表失败', error)
  }

  commissionVisible.value = true
}

// 提交佣金设置
const handleCommissionSubmit = async () => {
  if (commissionForm.scope === 'offer' && !commissionForm.offerId) {
    ElMessage.warning('请选择Offer')
    return
  }

  commissionSubmitting.value = true
  try {
    await setPublisherCommissionRate(
      currentPublisher.value.id,
      commissionForm.rate,
      commissionForm.scope === 'offer' ? commissionForm.offerId : undefined
    )
    ElMessage.success('佣金设置成功')
    commissionVisible.value = false
  } catch (error) {
    console.error('设置佣金失败', error)
  } finally {
    commissionSubmitting.value = false
  }
}

// 状态类型
const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    active: 'success',
    inactive: 'info',
    suspended: 'warning'
  }
  return map[status] || 'info'
}

// 格式化日期
const formatDate = (date: string) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.publishers {
  padding: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
