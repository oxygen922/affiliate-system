<template>
  <div class="offers">
    <el-card>
      <!-- 操作栏 -->
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          新建Offer
        </el-button>
        <el-select
          v-model="statusFilter"
          placeholder="状态筛选"
          style="width: 150px; margin-left: 20px"
          clearable
          @change="handleSearch"
        >
          <el-option label="全部" value="" />
          <el-option label="待审核" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已拒绝" value="rejected" />
        </el-select>
        <el-input
          v-model="searchText"
          placeholder="搜索Offer..."
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
        <el-table-column prop="name" label="Offer名称" width="200" show-overflow-tooltip />
        <el-table-column prop="merchant.name" label="商家" width="180" show-overflow-tooltip />
        <el-table-column prop="upstreamAffiliate.name" label="上级联盟" width="150" />
        <el-table-column label="佣金" width="150">
          <template #default="{ row }">
            <span v-if="row.commissionType === 'percentage'">
              {{ row.commissionRate }}%
            </span>
            <span v-else>
              ${{ row.commissionRate }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.approvalStatus)">
              {{ getStatusText(row.approvalStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="stats.clicks" label="点击数" width="100" align="right" />
        <el-table-column prop="stats.conversions" label="转化数" width="100" align="right" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="showDetail(row)">详情</el-button>
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-dropdown @command="(cmd) => handleApproveCommand(cmd, row)" v-if="row.approvalStatus === 'pending'">
              <el-button size="small">
                审核<el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="approved">通过</el-dropdown-item>
                  <el-dropdown-item command="rejected">拒绝</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
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

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑Offer' : '新建Offer'"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="Offer名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入Offer名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="Offer描述..." />
        </el-form-item>
        <el-form-item label="原联盟OfferID" prop="offerIdInPlatform">
          <el-input v-model="form.offerIdInPlatform" placeholder="在原联盟平台中的Offer ID" />
        </el-form-item>
        <el-form-item label="佣金类型" prop="commissionType">
          <el-radio-group v-model="form.commissionType">
            <el-radio value="percentage">百分比</el-radio>
            <el-radio value="fixed">固定金额</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="佣金率/金额" prop="commissionRate">
          <el-input-number
            v-model="form.commissionRate"
            :min="0"
            :max="form.commissionType === 'percentage' ? 100 : 10000"
            :precision="2"
          />
          <span style="margin-left: 10px">
            {{ form.commissionType === 'percentage' ? '%' : '$' }}
          </span>
        </el-form-item>
        <el-form-item label="追踪链接" prop="trackingUrl">
          <el-input v-model="form.trackingUrl" placeholder="https://..." />
          <div style="color: #909399; font-size: 12px; margin-top: 4px">
            支持 {affiliate_id} 和 {offer_id} 占位符
          </div>
        </el-form-item>
        <el-form-item label="国家/地区">
          <el-input v-model="form.countries" placeholder="如: US, CA, UK (逗号分隔)" />
        </el-form-item>
        <el-form-item label="有效期开始">
          <el-date-picker
            v-model="form.startDate"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="有效期结束">
          <el-date-picker
            v-model="form.endDate"
            type="datetime"
            placeholder="选择结束时间"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 审核对话框 -->
    <el-dialog v-model="approveVisible" title="审核Offer" width="600px">
      <el-form :model="approveForm" ref="approveFormRef" label-width="120px">
        <el-form-item label="Offer名称">
          <span>{{ currentOffer?.name }}</span>
        </el-form-item>
        <el-form-item label="审核结果">
          <el-radio-group v-model="approveForm.status">
            <el-radio value="approved">通过</el-radio>
            <el-radio value="rejected">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="拒绝原因" v-if="approveForm.status === 'rejected'">
          <el-input
            v-model="approveForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入拒绝原因..."
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="approveVisible = false">取消</el-button>
        <el-button type="primary" @click="handleApproveSubmit" :loading="approving">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="Offer详情" width="800px">
      <el-descriptions v-if="currentOffer" :column="2" border>
        <el-descriptions-item label="Offer名称" :span="2">{{ currentOffer.name }}</el-descriptions-item>
        <el-descriptions-item label="商家">{{ currentOffer.merchant?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="上级联盟">{{ currentOffer.upstreamAffiliate?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="原联盟OfferID">{{ currentOffer.offerIdInPlatform }}</el-descriptions-item>
        <el-descriptions-item label="佣金类型">{{ currentOffer.commissionType === 'percentage' ? '百分比' : '固定金额' }}</el-descriptions-item>
        <el-descriptions-item label="佣金率/金额">
          {{ currentOffer.commissionRate }}{{ currentOffer.commissionType === 'percentage' ? '%' : '$' }}
        </el-descriptions-item>
        <el-descriptions-item label="审核状态">
          <el-tag :type="getStatusType(currentOffer.approvalStatus)">
            {{ getStatusText(currentOffer.approvalStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="国家/地区">{{ currentOffer.countries || '-' }}</el-descriptions-item>
        <el-descriptions-item label="有效期开始">{{ formatDate(currentOffer.startDate) }}</el-descriptions-item>
        <el-descriptions-item label="有效期结束">{{ formatDate(currentOffer.endDate) }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ currentOffer.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="点击数">{{ currentOffer.stats?.clicks || 0 }}</el-descriptions-item>
        <el-descriptions-item label="转化数">{{ currentOffer.stats?.conversions || 0 }}</el-descriptions-item>
        <el-descriptions-item label="总佣金">${{ currentOffer.stats?.commission || 0 }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { getOfferList, createOffer, updateOffer, deleteOffer, approveOffer } from '@/api/offer'
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
const dialogVisible = ref(false)
const approveVisible = ref(false)
const detailVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const approving = ref(false)

// 表单
const formRef = ref<FormInstance>()
const approveFormRef = ref<FormInstance>()
const form = reactive({
  id: '',
  name: '',
  description: '',
  offerIdInPlatform: '',
  commissionType: 'percentage',
  commissionRate: 0,
  trackingUrl: '',
  countries: '',
  startDate: '',
  endDate: ''
})

const approveForm = reactive({
  status: 'approved',
  reason: ''
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入Offer名称', trigger: 'blur' }],
  offerIdInPlatform: [{ required: true, message: '请输入原联盟OfferID', trigger: 'blur' }],
  commissionType: [{ required: true, message: '请选择佣金类型', trigger: 'change' }],
  commissionRate: [{ required: true, message: '请输入佣金率/金额', trigger: 'blur' }],
  trackingUrl: [{ required: true, message: '请输入追踪链接', trigger: 'blur' }]
}

const currentOffer = ref<any>(null)

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getOfferList({
      page: page.value,
      pageSize: pageSize.value,
      search: searchText.value,
      status: statusFilter.value
    })
    list.value = res.data.offers
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

// 显示添加对话框
const showAddDialog = () => {
  isEdit.value = false
  Object.assign(form, {
    id: '',
    name: '',
    description: '',
    offerIdInPlatform: '',
    commissionType: 'percentage',
    commissionRate: 0,
    trackingUrl: '',
    countries: '',
    startDate: '',
    endDate: ''
  })
  dialogVisible.value = true
}

// 显示详情
const showDetail = (row: any) => {
  currentOffer.value = row
  detailVisible.value = true
}

// 编辑
const handleEdit = (row: any) => {
  isEdit.value = true
  Object.assign(form, {
    ...row,
    startDate: row.startDate ? new Date(row.startDate) : '',
    endDate: row.endDate ? new Date(row.endDate) : ''
  })
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除Offer "${row.name}" 吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteOffer(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败', error)
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      const data = {
        ...form,
        startDate: form.startDate ? dayjs(form.startDate).toISOString() : null,
        endDate: form.endDate ? dayjs(form.endDate).toISOString() : null
      }

      if (isEdit.value) {
        await updateOffer(form.id, data)
        ElMessage.success('更新成功')
      } else {
        await createOffer(data)
        ElMessage.success('创建成功')
      }

      dialogVisible.value = false
      fetchData()
    } catch (error) {
      console.error('提交失败', error)
    } finally {
      submitting.value = false
    }
  })
}

// 审核命令
const handleApproveCommand = (cmd: string, row: any) => {
  currentOffer.value = row
  approveForm.status = cmd
  approveForm.reason = ''
  approveVisible.value = true
}

// 提交审核
const handleApproveSubmit = async () => {
  approving.value = true
  try {
    await approveOffer(currentOffer.value.id, approveForm.status, approveForm.reason)
    ElMessage.success('审核完成')
    approveVisible.value = false
    fetchData()
  } catch (error) {
    console.error('审核失败', error)
  } finally {
    approving.value = false
  }
}

// 状态类型
const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return map[status] || 'info'
}

// 状态文本
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return map[status] || status
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
.offers {
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
