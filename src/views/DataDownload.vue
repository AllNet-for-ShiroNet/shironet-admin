<template>
  <div class="download-container min-h-screen bg-gray-50 p-6">
    <div class="mb-8">
      <h1 class="text-2xl font-semibold text-gray-800">数据下载</h1>
      <p class="text-gray-600 text-base mt-1">下载服务器上的游戏数据文件</p>
    </div>

    <!-- 标签切换 -->
    <div class="max-w-6xl mx-auto mb-6">
      <div class="flex space-x-2 border-b border-gray-200">
        <button
          @click="switchTab('chunithm')"
          :class="[
            'px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2',
            activeTab === 'chunithm'
              ? 'text-indigo-600 border-indigo-600 bg-indigo-50'
              : 'text-gray-600 border-transparent hover:text-gray-800 hover:bg-gray-50'
          ]"
        >
          <span class="flex items-center">
            <span class="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
            CHUNITHM
          </span>
        </button>
        <button
          @click="switchTab('ongeki')"
          :class="[
            'px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2',
            activeTab === 'ongeki'
              ? 'text-purple-600 border-purple-600 bg-purple-50'
              : 'text-gray-600 border-transparent hover:text-gray-800 hover:bg-gray-50'
          ]"
        >
          <span class="flex items-center">
            <span class="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
            オンゲキ
          </span>
        </button>
      </div>
    </div>

    <!-- 文件列表 -->
    <div class="max-w-6xl mx-auto">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <!-- 加载中 -->
        <div v-if="loading" class="text-center py-12 text-gray-500">
          <svg class="animate-spin mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          加载中...
        </div>

        <!-- 错误 -->
        <div v-else-if="error" class="text-center py-12 text-red-500">
          {{ error }}
          <button @click="loadFiles" class="ml-2 text-indigo-600 underline text-sm">重试</button>
        </div>

        <!-- 文件表格 -->
        <div v-else-if="currentFiles.length > 0" class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">文件名</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">大小</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">更新时间</th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="file in currentFiles" :key="file.key" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <svg class="w-5 h-5 mr-3" :class="activeTab === 'chunithm' ? 'text-indigo-600' : 'text-purple-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <span class="text-sm font-medium text-gray-900">{{ file.name }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">{{ formatSize(file.size) }}</td>
                <td class="px-6 py-4 text-sm text-gray-600">{{ formatDate(file.lastModified) }}</td>
                <td class="px-6 py-4 text-center">
                  <button
                    @click="handleDownload(file)"
                    :disabled="downloadingKeys.has(file.key)"
                    :class="[
                      'inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                      downloadingKeys.has(file.key)
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : activeTab === 'chunithm'
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                    ]"
                  >
                    <svg v-if="!downloadingKeys.has(file.key)" class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    <svg v-else class="animate-spin w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ downloadingKeys.has(file.key) ? '处理中' : '下载' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 空状态 -->
        <div v-else class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <p class="mt-2 text-gray-500">暂无可下载的文件</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { downloadApi, downloadDataTransform, type FileInfo } from '@/api/download'

type Tab = 'chunithm' | 'ongeki'

const activeTab = ref<Tab>('chunithm')
const loading = ref(false)
const error = ref<string | null>(null)
const downloadingKeys = ref<Set<string>>(new Set())

const chunithmFiles = ref<FileInfo[]>([])
const ongekiFiles = ref<FileInfo[]>([])

const currentFiles = computed(() =>
  activeTab.value === 'chunithm' ? chunithmFiles.value : ongekiFiles.value
)

const formatSize = downloadDataTransform.formatFileSize
const formatDate = downloadDataTransform.formatDate

async function loadFiles() {
  loading.value = true
  error.value = null
  try {
    const [chuni, ongeki] = await Promise.all([
      downloadApi.listFiles('chunithm'),
      downloadApi.listFiles('ongeki'),
    ])
    chunithmFiles.value = chuni
    ongekiFiles.value = ongeki
  } catch (e: any) {
    error.value = e.message || '加载文件列表失败'
  } finally {
    loading.value = false
  }
}

async function switchTab(tab: Tab) {
  activeTab.value = tab
}

async function handleDownload(file: FileInfo) {
  if (downloadingKeys.value.has(file.key)) return
  downloadingKeys.value.add(file.key)
  try {
    await downloadApi.downloadFile(file.key)
    ElMessage.success(`${file.name} 下载已开始`)
  } catch (e: any) {
    ElMessage.error(e.message || '下载失败，请重试')
  } finally {
    downloadingKeys.value.delete(file.key)
  }
}

onMounted(loadFiles)
</script>

<style scoped>
.download-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
