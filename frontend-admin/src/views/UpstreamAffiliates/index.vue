<template>
  <div class="upstream-affiliates">
    <el-card>
      <!-- 操作栏 -->
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          添加联盟
        </el-button>
        <el-input
          v-model="searchText"
          placeholder="搜索联盟..."
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
        <el-table-column prop="name" label="联盟名称" width="200" />
        <el-table-column prop="code" label="代码" width="120" />
        <el-table-column prop="website" label="官网" width="200" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column label="同步状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.syncStatus)">
              {{ row.syncStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="merchantCount" label="商家数" width="100" align="right" />
        <el-table-column prop="offerCount" label="Offer数" width="100" align="right" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="showDetail(row)">详情</el-button>
            <el-button size="small" @click="showImportDialog(row)">导入商家</el-button>
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
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
      :title="isEdit ? '编辑联盟' : '添加联盟'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="联盟名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入联盟名称" />
        </el-form-item>
        <el-form-item label="代码" prop="code">
          <el-input v-model="form.code" placeholder="如: cj, shareasale, impact" />
          <div style="color: #909399; font-size: 12px; margin-top: 4px">
            只能包含字母、数字、下划线和横线
          </div>
        </el-form-item>
        <el-form-item label="官网">
          <el-input v-model="form.website" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="联盟描述..." />
        </el-form-item>
        <el-form-item label="佣金抽成%" prop="commissionRate">
          <el-input-number v-model="form.commissionRate" :min="0" :max="100" :precision="2" />
          <span style="margin-left: 10px">%</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 导入商家对话框 -->
    <el-dialog v-model="importVisible" title="批量导入商家" width="800px">
      <el-alert
        title="导入说明"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        请输入商家数据（JSON数组格式），每个商家应包含以下字段：
        <br>
        <code>merchantIdInPlatform</code>（在原联盟的ID）、
        <code>name</code>（商家名称）、
        <code>website</code>（官网）、
        <code>category</code>（分类）等
      </el-alert>

      <el-input
        v-model="importData"
        type="textarea"
        :rows="12"
        placeholder='[
  {
    "merchantIdInPlatform": "12345",
    "name": "示例商家",
    "website": "https://example.com",
    "category": "电商",
    "commissionRate": 10,
    "tags": ["premium"]
  }
]'
      />

      <template #footer>
        <el-button @click="importVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImport" :loading="importing">
          开始导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { getUpstreamList, createUpstream, updateUpstream, deleteUpstream, importMerchants } from '@/api/upstream'

// 数据
const list = ref([])
const loading = ref(false)
const searchText = ref('')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 对话框
const dialogVisible = ref(false)
const importVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const importing = ref(false)

// 表单
const formRef = ref<FormInstance>()
const form = reactive({
  id: '',
  name: '',
  code: '',
  website: '',
  description: '',
  commissionRate: 0
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入联盟名称', trigger: 'blur' }],
  code: [
    { required: true, message: '请输入联盟代码', trigger: 'blur' },
    { pattern: /^[a-z0-9_-]+$/, message: '只能包含小写字母、数字、下划线和横线', trigger: 'blur' }
  ]
}

// 导入数据
const importData = ref('')
const currentUpstream = ref<any>(null)

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getUpstreamList({
      page: page.value,
      pageSize: pageSize.value,
      search: searchText.value
    })
    list.value = res.data.upstreams
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
    code: '',
    website: '',
    description: '',
    commissionRate: 0
  })
  dialogVisible.value = true
}

// 显示详情
const showDetail = async (row: any) => {
  try {
    const res: any = await getUpstreamStats(row.id)
    ElMessageBox.alert(
      `商家数: ${res.data.merchantCount || 0}\nOffer数: ${res.data.offerCount || 0}\n同步状态: ${row.syncStatus}`,
      '联盟详情',
      { confirmButtonText: '关闭' }
    )
  } catch (error) {
    console.error('获取详情失败', error)
  }
}

// 编辑
const handleEdit = (row: any) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除联盟 "${row.name}" 吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteUpstream(row.id)
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
      if (isEdit.value) {
        await updateUpstream(form.id, form)
        ElMessage.success('更新成功')
      } else {
        await createUpstream(form)
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

// 显示导入对话框
const showImportDialog = (row: any) => {
  currentUpstream.value = row
  importData.value = ''
  importVisible.value = true
}

// 执行导入
const handleImport = async () => {
  if (!importData.value.trim()) {
    ElMessage.warning('请输入商家数据')
    return
  }

  try {
    const merchants = JSON.parse(importData.value)
    if (!Array.isArray(merchants)) {
      throw new Error('数据必须是数组格式')
    }

    if (merchants.length === 0) {
      ElMessage.warning('请至少输入一个商家')
      return
    }

    importing.value = true
    const res = await importMerchants(currentUpstream.value.id, merchants)

    ElMessage.success(`导入完成！成功 ${res.data.success} 个，失败 ${res.data.failed} 个`)
    importVisible.value = false
  } catch (error: any) {
    ElMessage.error('数据格式错误：请输入有效的JSON数组')
    console.error('导入失败', error)
  } finally {
    importing.value = false
  }
}

// 状态类型
const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    active: 'success',
    inactive: 'info',
    error: 'danger'
  }
  return map[status] || 'info'
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.upstream-affiliates {
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
