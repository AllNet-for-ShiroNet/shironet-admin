<template>
  <div class="space-y-4 sm:space-y-6 px-2 sm:px-0">
    <!-- 页面标题和操作栏 -->
    <div :class="[
      'p-4 sm:p-6 rounded-lg border',
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    ]">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div>
          <h2 :class="[
            'text-xl sm:text-2xl font-bold',
            isDark ? 'text-white' : 'text-gray-900'
          ]">公告管理</h2>
          <p :class="[
            'text-xs sm:text-sm mt-1',
            isDark ? 'text-gray-400' : 'text-gray-500'
          ]">管理系统公告和通知信息，支持 Markdown 格式</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <el-button type="primary" @click="showAddDialog = true" size="small" class="text-xs sm:text-sm">
            <span class="material-icons mr-1 sm:mr-2 text-sm">add</span>
            <span class="hidden sm:inline">创建公告</span>
            <span class="sm:hidden">创建</span>
          </el-button>
          <el-button @click="publishBatch" plain size="small" class="text-xs sm:text-sm">
            <span class="material-icons mr-1 sm:mr-2 text-sm">publish</span>
            <span class="hidden sm:inline">批量发布</span>
            <span class="sm:hidden">批量</span>
          </el-button>
        </div>
      </div>
      
      <!-- 搜索和筛选区域 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <el-input
          v-model="searchQuery"
          placeholder="搜索公告标题..."
          clearable
          size="default"
        >
          <template #prefix>
            <span class="material-icons text-gray-400">search</span>
          </template>
        </el-input>
        
        <el-select 
          v-model="statusFilter" 
          placeholder="状态筛选" 
          clearable
          size="default"
        >
          <el-option label="已发布" value="published" />
          <el-option label="草稿" value="draft" />
          <el-option label="已过期" value="expired" />
        </el-select>
        
        <el-select 
          v-model="typeFilter" 
          placeholder="类型筛选" 
          clearable
          size="default"
        >
          <el-option label="系统公告" value="system" />
          <el-option label="维护通知" value="maintenance" />
          <el-option label="活动公告" value="event" />
          <el-option label="更新说明" value="update" />
        </el-select>
        
        <el-button @click="resetFilters" class="text-xs sm:text-sm">
          <span class="material-icons mr-1 text-sm">refresh</span>
          重置筛选
        </el-button>
      </div>

      <!-- 移动端批量操作 -->
      <div v-if="selectedAnnouncements.length > 0" class="mt-4 flex items-center justify-between p-3 bg-blue-50 rounded-lg lg:hidden">
        <span class="text-sm text-blue-700">已选择 {{ selectedAnnouncements.length }} 条公告</span>
        <div class="flex space-x-2">
          <el-button 
            type="primary" 
            size="small"
            @click="publishBatch"
          >
            批量发布
          </el-button>
          <el-button 
            size="small"
            @click="clearSelection"
          >
            取消选择
          </el-button>
        </div>
      </div>
    </div>

    <!-- 移动端卡片视图 -->
    <div class="block lg:hidden">
      <div v-loading="loading" class="space-y-4">
        <div
          v-for="announcement in paginatedAnnouncements"
          :key="announcement.id"
          :class="[
            'rounded-xl shadow-sm border-0 overflow-hidden relative',
            isDark ? 'bg-gray-800' : 'bg-white',
            announcement.isPinned ? (isDark ? 'ring-1 ring-yellow-500/30 bg-gradient-to-r from-yellow-900/10 to-transparent' : 'ring-1 ring-yellow-400/30 bg-gradient-to-r from-yellow-50 to-transparent') : ''
          ]"
        >
          <!-- 置顶标识条 -->
          <div v-if="announcement.isPinned" :class="[
            'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-yellow-500'
          ]"></div>

          <!-- 卡片内容 -->
          <div class="p-4">
            <!-- 头部：选择框 + 标题 + 状态 -->
            <div class="flex items-start space-x-3 mb-3">
              <el-checkbox
                class="mt-1"
                :model-value="isAnnouncementSelected(announcement.id)"
                @change="onAnnouncementCheckChange(announcement.id, $event)"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between mb-2">
                  <h3 :class="[
                    'font-semibold text-lg leading-tight pr-2',
                    isDark ? 'text-white' : 'text-gray-900'
                  ]">{{ announcement.title }}</h3>
                  <div v-if="announcement.isPinned" class="flex-shrink-0">
                    <div class="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span class="material-icons text-white text-xs">push_pin</span>
                    </div>
                  </div>
                </div>
                
                <!-- 标签组 -->
                <div class="flex items-center space-x-2">
                  <el-tag 
                    :type="getTypeColor(announcement.type)" 
                    size="small"
                    effect="light"
                  >
                    {{ getTypeLabel(announcement.type) }}
                  </el-tag>
                  <el-tag 
                    :type="getStatusColor(announcement.status)" 
                    size="small"
                    effect="light"
                  >
                    {{ getStatusLabel(announcement.status) }}
                  </el-tag>
                </div>
              </div>
            </div>

            <!-- 内容预览 -->
            <div class="mb-4">
              <div 
                :class="[
                  'text-sm leading-relaxed line-clamp-2',
                  isDark ? 'text-gray-300' : 'text-gray-600'
                ]"
              >{{ getPlainTextPreview(announcement.content, 100) }}</div>
            </div>

            <!-- 信息网格 -->
            <div :class="[
              'grid grid-cols-3 gap-3 py-3 px-3 rounded-lg mb-4 text-xs',
              isDark ? 'bg-gray-700/50' : 'bg-gray-50'
            ]">
              <div class="text-center">
                <div :class="[
                  'font-medium mb-1',
                  isDark ? 'text-gray-400' : 'text-gray-500'
                ]">发布时间</div>
                <div :class="[
                  'font-mono',
                  isDark ? 'text-gray-200' : 'text-gray-700'
                ]">{{ announcement.publishTime ? formatDate(announcement.publishTime) : '未发布' }}</div>
              </div>
              <div class="text-center">
                <div :class="[
                  'font-medium mb-1',
                  isDark ? 'text-gray-400' : 'text-gray-500'
                ]">过期时间</div>
                <div :class="[
                  'font-mono',
                  isExpired(announcement.expireTime) ? 'text-red-500' : isDark ? 'text-gray-200' : 'text-gray-700'
                ]">{{ announcement.expireTime ? formatDate(announcement.expireTime) : '永不' }}</div>
              </div>
              <div class="text-center">
                <div :class="[
                  'font-medium mb-1',
                  isDark ? 'text-gray-400' : 'text-gray-500'
                ]">创建者</div>
                <div :class="[
                  isDark ? 'text-gray-200' : 'text-gray-700'
                ]">{{ getUserName(announcement.createdBy) }}</div>
              </div>
            </div>

            <!-- 操作按钮组 -->
            <div class="flex items-center justify-between">
              <el-button 
                size="small"
                text
                @click="togglePin(announcement)"
                :class="[
                  'flex items-center space-x-1',
                  announcement.isPinned ? 'text-yellow-600 hover:text-yellow-700' : 'text-gray-500 hover:text-gray-700'
                ]"
              >
                <span class="material-icons text-sm">push_pin</span>
                <span class="text-xs">{{ announcement.isPinned ? '取消置顶' : '置顶' }}</span>
              </el-button>
              
              <div class="flex space-x-2">
                <el-button 
                  size="small" 
                  type="info"
                  plain
                  @click="viewAnnouncement(announcement)"
                  class="flex items-center space-x-1"
                >
                  <span class="material-icons text-sm">visibility</span>
                  <span class="text-xs">预览</span>
                </el-button>
                <el-button 
                  size="small" 
                  type="primary" 
                  plain
                  @click="editAnnouncement(announcement)"
                  class="flex items-center space-x-1"
                >
                  <span class="material-icons text-sm">edit</span>
                  <span class="text-xs">编辑</span>
                </el-button>
                <el-button 
                  v-if="announcement.status === 'draft'"
                  size="small" 
                  type="success" 
                  plain
                  @click="publishAnnouncement(announcement)"
                  class="flex items-center space-x-1"
                >
                  <span class="material-icons text-sm">publish</span>
                  <span class="text-xs">发布</span>
                </el-button>
                <el-button 
                  size="small" 
                  type="danger" 
                  plain
                  @click="deleteAnnouncement(announcement)"
                >
                  <span class="material-icons text-sm">delete</span>
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 移动端空状态 -->
        <div 
          v-if="filteredAnnouncements.length === 0"
          :class="[
            'text-center py-12',
            isDark ? 'text-gray-400' : 'text-gray-500'
          ]"
        >
          <span class="material-icons text-4xl mb-4 block opacity-50">campaign</span>
          <p>暂无公告数据</p>
        </div>
      </div>

      <!-- 移动端分页 -->
      <div 
        v-if="filteredAnnouncements.length > 0" 
        :class="[
          'mt-4 p-4 rounded-lg border flex flex-col items-center space-y-3',
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        ]"
      >
        <p :class="[
          'text-sm text-center',
          isDark ? 'text-gray-400' : 'text-gray-500'
        ]">
          共 {{ total }} 条公告，已选择 {{ selectedAnnouncements.length }} 条
        </p>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="sizes, prev, pager, next"
          size="small"
          background
        />
      </div>
    </div>

    <!-- 桌面端表格视图 -->
    <div :class="[
      'hidden lg:block rounded-lg border',
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    ]">
      <div class="overflow-x-auto">
        <table class="w-full">
          <!-- 表头 -->
          <thead :class="[
            'border-b text-sm font-medium',
            isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-slate-100 border-gray-200 text-gray-800'
          ]">
            <tr>
              <th class="px-4 py-3 text-left w-8">
                <el-checkbox v-model="selectAll" @change="handleSelectAll" />
              </th>
              <th class="px-4 py-3 text-center w-8">置顶</th>
              <th class="px-4 py-3 text-left w-64">标题</th>
              <th class="px-4 py-3 text-center w-20">类型</th>
              <th class="px-4 py-3 text-center w-20">状态</th>
              <th class="px-4 py-3 text-center w-32">发布时间</th>
              <th class="px-4 py-3 text-center w-32">过期时间</th>
              <th class="px-4 py-3 text-center w-24">创建者</th>
              <th class="px-4 py-3 text-center w-32">操作</th>
            </tr>
          </thead>
          
          <!-- 表体 -->
          <tbody v-loading="loading">
            <tr 
              v-for="announcement in paginatedAnnouncements" 
              :key="announcement.id"
              :class="[
                'border-b transition-colors hover:cursor-pointer',
                isDark 
                  ? 'border-gray-700 hover:bg-gray-700 text-gray-300' 
                  : 'border-gray-100 hover:bg-gray-50 text-gray-900',
                announcement.isPinned ? (isDark ? 'bg-blue-900/20' : 'bg-blue-50') : ''
              ]"
            >
              <!-- 选择框 -->
              <td class="px-4 py-3">
                <el-checkbox
                  :model-value="isAnnouncementSelected(announcement.id)"
                  @change="onAnnouncementCheckChange(announcement.id, $event)"
                />
              </td>
              
              <!-- 置顶 -->
              <td class="px-4 py-3 text-center">
                <el-button 
                  v-if="announcement.isPinned"
                  size="small"
                  type="warning"
                  @click="togglePin(announcement)"
                  class="!w-6 !h-6 !p-0"
                >
                  <span class="material-icons text-xs">push_pin</span>
                </el-button>
                <el-button 
                  v-else
                  size="small"
                  text
                  @click="togglePin(announcement)"
                  class="!w-6 !h-6 !p-0"
                >
                  <span class="material-icons text-xs text-gray-400">push_pin</span>
                </el-button>
              </td>
              
              <!-- 标题 -->
              <td class="px-4 py-3">
                <div class="max-w-sm">
                  <h4 :class="[
                    'font-medium text-sm truncate',
                    isDark ? 'text-white' : 'text-gray-900'
                  ]">{{ announcement.title }}</h4>
                  <p :class="[
                    'text-xs mt-1 truncate',
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  ]">{{ getPlainTextPreview(announcement.content, 50) }}</p>
                </div>
              </td>
              
              <!-- 类型 -->
              <td class="px-4 py-3 text-center">
                <el-tag 
                  :type="getTypeColor(announcement.type)" 
                  size="small"
                >
                  {{ getTypeLabel(announcement.type) }}
                </el-tag>
              </td>
              
              <!-- 状态 -->
              <td class="px-4 py-3 text-center">
                <el-tag 
                  :type="getStatusColor(announcement.status)" 
                  size="small"
                >
                  {{ getStatusLabel(announcement.status) }}
                </el-tag>
              </td>
              
              <!-- 发布时间 -->
              <td class="px-4 py-3 text-center">
                <span :class="[
                  'text-sm',
                  isDark ? 'text-gray-400' : 'text-gray-500'
                ]">{{ announcement.publishTime ? formatDate(announcement.publishTime) : '-' }}</span>
              </td>
              
              <!-- 过期时间 -->
              <td class="px-4 py-3 text-center">
                <span :class="[
                  'text-sm',
                  isDark ? 'text-gray-400' : 'text-gray-500',
                  isExpired(announcement.expireTime) ? 'text-red-500' : ''
                ]">{{ announcement.expireTime ? formatDate(announcement.expireTime) : '永不过期' }}</span>
              </td>
              
              <!-- 创建者 -->
              <td class="px-4 py-3 text-center">
                <span :class="[
                  'text-sm',
                  isDark ? 'text-gray-300' : 'text-gray-700'
                ]">{{ getUserName(announcement.createdBy) }}</span>
              </td>
              
              <!-- 操作 -->
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center space-x-1">
                  <el-button 
                    size="small" 
                    type="info"
                    @click="viewAnnouncement(announcement)"
                    class="!w-6 !h-6 !p-0"
                    title="预览"
                  >
                    <span class="material-icons text-xs">visibility</span>
                  </el-button>
                  <el-button 
                    size="small" 
                    type="primary" 
                    @click="editAnnouncement(announcement)"
                    class="!w-6 !h-6 !p-0"
                    title="编辑"
                  >
                    <span class="material-icons text-xs">edit</span>
                  </el-button>
                  <el-button 
                    v-if="announcement.status === 'draft'"
                    size="small" 
                    type="success" 
                    @click="publishAnnouncement(announcement)"
                    class="!w-6 !h-6 !p-0"
                    title="发布"
                  >
                    <span class="material-icons text-xs">publish</span>
                  </el-button>
                  <el-button 
                    size="small" 
                    type="danger" 
                    @click="deleteAnnouncement(announcement)"
                    class="!w-6 !h-6 !p-0"
                    title="删除"
                  >
                    <span class="material-icons text-xs">delete</span>
                  </el-button>
                </div>
              </td>
            </tr>

            <!-- 空状态 -->
            <tr v-if="filteredAnnouncements.length === 0">
              <td colspan="9" :class="[
                'text-center py-12',
                isDark ? 'text-gray-400' : 'text-gray-500'
              ]">
                <span class="material-icons text-4xl mb-4 block opacity-50">campaign</span>
                <p>暂无公告数据</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 桌面端分页 -->
      <div v-if="filteredAnnouncements.length > 0" :class="[
        'px-6 py-4 border-t flex items-center justify-between',
        isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
      ]">
        <p :class="[
          'text-sm',
          isDark ? 'text-gray-400' : 'text-gray-500'
        ]">
          共 {{ total }} 条公告，已选择 {{ selectedAnnouncements.length }} 条
        </p>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="sizes, prev, pager, next"
          size="small"
          background
        />
      </div>
    </div>

    <!-- 添加/编辑公告对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingAnnouncement ? '编辑公告' : '创建公告'"
      :width="isMobile ? '95%' : '900px'"
      align-center
      :close-on-click-modal="false"
    >
      <el-form
        ref="announcementFormRef"
        :model="announcementForm"
        :rules="announcementRules"
        :label-width="isMobile ? '80px' : '100px'"
      >
        <el-form-item label="公告标题" prop="title">
          <el-input v-model="announcementForm.title" maxlength="100" show-word-limit placeholder="请输入公告标题" />
        </el-form-item>
        
        <el-form-item label="公告类型" prop="type">
          <el-select v-model="announcementForm.type" class="w-full" placeholder="选择公告类型">
            <el-option label="系统公告" value="system" />
            <el-option label="维护通知" value="maintenance" />
            <el-option label="活动公告" value="event" />
            <el-option label="更新说明" value="update" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="公告内容" prop="content" class="markdown-editor-item">
          <div class="w-full space-y-3">
            <!-- 编辑模式切换 -->
            <div class="flex items-center justify-between">
              <el-radio-group v-model="editorMode" size="small">
                <el-radio-button label="wysiwyg" value="wysiwyg">富文本</el-radio-button>
                <el-radio-button label="markdown" value="markdown">Markdown</el-radio-button>
                <el-radio-button label="preview" value="preview">预览</el-radio-button>
              </el-radio-group>
              <el-tag size="small" type="info">支持 Markdown 语法</el-tag>
            </div>

            <!-- 富文本编辑器 -->
            <div v-show="editorMode === 'wysiwyg'" class="quill-editor-wrapper">
              <QuillEditor
                v-model:content="announcementForm.content"
                contentType="html"
                :toolbar="quillToolbar"
                :style="{ height: isMobile ? '300px' : '400px' }"
                placeholder="请输入公告内容..."
              />
            </div>

            <!-- Markdown 编辑器 -->
            <div v-show="editorMode === 'markdown'">
              <el-input
                v-model="announcementForm.content"
                type="textarea"
                :rows="isMobile ? 12 : 18"
                placeholder="请输入 Markdown 格式的公告内容...

# 一级标题
## 二级标题
**粗体** *斜体*
- 列表项
[链接](URL)
![图片](URL)"
                class="markdown-textarea"
              />
            </div>

            <!-- 预览模式 -->
            <div v-show="editorMode === 'preview'" :class="[
              'prose max-w-none border rounded-lg p-4 overflow-auto',
              isDark ? 'border-gray-600 bg-gray-800 prose-invert' : 'border-gray-300 bg-gray-50'
            ]" :style="{ minHeight: isMobile ? '300px' : '400px' }">
              <div v-if="announcementForm.content" v-html="renderMarkdown(announcementForm.content)"></div>
              <div v-else class="text-center py-12 text-gray-400">
                <span class="material-icons text-4xl block mb-2 opacity-50">preview</span>
                <p>暂无内容预览</p>
              </div>
            </div>

            <div class="text-xs text-gray-500">
              当前字数：{{ announcementForm.content.length }} / 10000
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="发布时间">
          <el-date-picker
            v-model="announcementForm.publishTime"
            type="datetime"
            placeholder="选择发布时间，留空表示立即发布"
            class="w-full"
            :size="isMobile ? 'small' : 'default'"
          />
        </el-form-item>
        
        <el-form-item label="过期时间">
          <el-date-picker
            v-model="announcementForm.expireTime"
            type="datetime"
            placeholder="选择过期时间，留空表示永不过期"
            class="w-full"
            :size="isMobile ? 'small' : 'default'"
          />
        </el-form-item>
        
        <el-form-item label="设置">
          <div class="space-y-2">
            <el-checkbox v-model="announcementForm.isPinned">置顶显示</el-checkbox>
            <el-checkbox v-model="autoPublish">保存后立即发布</el-checkbox>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
          <el-button @click="showAddDialog = false" :size="isMobile ? 'small' : 'default'" class="order-3 sm:order-1">取消</el-button>
          <el-button @click="saveAsDraft" :size="isMobile ? 'small' : 'default'" class="order-2">保存草稿</el-button>
          <el-button type="primary" @click="saveAnnouncement" :loading="saving" :size="isMobile ? 'small' : 'default'" class="order-1 sm:order-3">
            {{ editingAnnouncement ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 预览公告对话框 -->
    <el-dialog
      v-model="showPreviewDialog"
      title="公告预览"
      :width="isMobile ? '95%' : '800px'"
      align-center
    >
      <div v-if="previewAnnouncement" :class="[
        'p-6 rounded-lg',
        isDark ? 'bg-gray-800' : 'bg-gray-50'
      ]">
        <!-- 预览头部 -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 :class="[
              'text-2xl font-bold',
              isDark ? 'text-white' : 'text-gray-900'
            ]">{{ previewAnnouncement.title }}</h2>
            <el-tag 
              :type="getTypeColor(previewAnnouncement.type)" 
              size="large"
            >
              {{ getTypeLabel(previewAnnouncement.type) }}
            </el-tag>
          </div>
          
          <div :class="[
            'flex items-center space-x-4 text-sm',
            isDark ? 'text-gray-400' : 'text-gray-500'
          ]">
            <span>
              <span class="material-icons text-sm mr-1 align-middle">person</span>
              {{ getUserName(previewAnnouncement.createdBy) }}
            </span>
            <span>
              <span class="material-icons text-sm mr-1 align-middle">access_time</span>
              {{ formatDate(previewAnnouncement.publishTime || previewAnnouncement.createdAt) }}
            </span>
          </div>
        </div>

        <!-- Markdown 渲染内容 -->
        <div :class="[
          'prose max-w-none',
          isDark ? 'prose-invert' : ''
        ]" v-html="renderMarkdown(previewAnnouncement.content)"></div>
      </div>
      
      <template #footer>
        <div class="flex justify-end space-x-2">
          <el-button @click="showPreviewDialog = false" :size="isMobile ? 'small' : 'default'">关闭</el-button>
          <el-button 
            type="primary" 
            @click="editAnnouncementFromPreview"
            :size="isMobile ? 'small' : 'default'"
          >
            编辑
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, inject, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

import { 
  announcementApi, 
  dataTransform, 
  announcementValidator,
  type Announcement, 
  type AnnouncementForm, 
  type CreateAnnouncementRequest,
  type UpdateAnnouncementRequest 
} from '@/api/announcement'

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true,
})

// 公告类型定义
interface AnnouncementFormData extends AnnouncementForm {}

const loading = ref(false)
const saving = ref(false)
const showAddDialog = ref(false)
const showPreviewDialog = ref(false)
const editingAnnouncement = ref<Announcement | null>(null)
const previewAnnouncement = ref<Announcement | null>(null)
const searchQuery = ref('')
const statusFilter = ref('')
const typeFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const selectAll = ref(false)
const selectedAnnouncements = ref<number[]>([])
const autoPublish = ref(false)
const isMobile = ref(false)
const editorMode = ref<'wysiwyg' | 'markdown' | 'preview'>('wysiwyg')

// 数据存储
const announcements = ref<Announcement[]>([])
const total = ref(0)

// 从父组件获取主题状态
const isDark = inject('isDark', ref(false))

// Quill 编辑器工具栏配置
const quillToolbar = [
  ['bold', 'italic', 'underline', 'strike'],
  ['blockquote', 'code-block'],
  [{ 'header': 1 }, { 'header': 2 }],
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  [{ 'indent': '-1'}, { 'indent': '+1' }],
  ['link', 'image'],
  ['clean']
]

// 检测屏幕尺寸
const checkMobile = () => {
  isMobile.value = window.innerWidth < 640
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  loadAnnouncements()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const announcementForm = reactive<AnnouncementFormData>({
  title: '',
  content: '',
  type: 'system',
  isPinned: false,
  publishTime: null,
  expireTime: null
})

const announcementRules = {
  title: [
    { required: true, message: '请输入公告标题', trigger: 'blur' },
    { min: 1, max: 100, message: '标题长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入公告内容', trigger: 'blur' },
    { min: 1, max: 10000, message: '内容长度在 1 到 10000 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择公告类型', trigger: 'change' }
  ]
}

// Markdown 渲染函数
const renderMarkdown = (content: string): string => {
  if (!content) return ''
  try {
    const html = marked(content) as string
    return DOMPurify.sanitize(html)
  } catch (error) {
    console.error('Markdown 渲染失败:', error)
    return content
  }
}

// 获取纯文本预览
const getPlainTextPreview = (content: string, maxLength: number = 50): string => {
  if (!content) return ''
  // 移除 HTML 和 Markdown 标签
  const plainText = content
    .replace(/<[^>]+>/g, '')
    .replace(/[#*`_\[\]]/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '[图片]')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .trim()
  
  return plainText.length > maxLength 
    ? plainText.substring(0, maxLength) + '...'
    : plainText
}

// 预览公告
const viewAnnouncement = (announcement: Announcement) => {
  previewAnnouncement.value = announcement
  showPreviewDialog.value = true
}

// 从预览编辑
const editAnnouncementFromPreview = () => {
  if (previewAnnouncement.value) {
    showPreviewDialog.value = false
    editAnnouncement(previewAnnouncement.value)
  }
}

// 加载公告列表
const loadAnnouncements = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value || undefined,
      status: statusFilter.value || undefined,
      type: typeFilter.value || undefined,
    }
    
    const result = await announcementApi.getAnnouncements(params)
    announcements.value = result.announcements
    total.value = result.total
    
  } catch (error: any) {
    console.error('加载公告列表失败:', error)
    ElMessage.error(error.message || '加载公告列表失败')
    announcements.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 监听搜索和筛选条件变化
watch([searchQuery, statusFilter, typeFilter], () => {
  currentPage.value = 1
  loadAnnouncements()
})

// 监听分页变化
watch([currentPage, pageSize], () => {
  loadAnnouncements()
})

// 计算属性
const filteredAnnouncements = computed(() => announcements.value)
const paginatedAnnouncements = computed(() => announcements.value)

// 工具函数
const formatDate = (dateStr: string | null) => dataTransform.formatDate(dateStr)
const getUserName = (userId: number) => {
  const userMap: Record<number, string> = { 1: '系统管理员', 2: '运营专员' }
  return userMap[userId] || '未知用户'
}
const getTypeColor = (type: string) => dataTransform.getTypeColor(type)
const getTypeLabel = (type: string) => dataTransform.getTypeLabel(type)
const getStatusColor = (status: string) => dataTransform.getStatusColor(status)
const getStatusLabel = (status: string) => dataTransform.getStatusLabel(status)
const isExpired = (expireTime: string | null) => dataTransform.isExpired(expireTime)

// 多选：独立 checkbox 使用布尔 modelValue，选中 id 维护在数组中
const isAnnouncementSelected = (id: number) => selectedAnnouncements.value.includes(id)

const setAnnouncementSelected = (id: number, checked: boolean) => {
  const next = new Set(selectedAnnouncements.value)
  if (checked) next.add(id)
  else next.delete(id)
  selectedAnnouncements.value = Array.from(next)
}

const onAnnouncementCheckChange = (id: number, val: string | number | boolean) => {
  setAnnouncementSelected(id, !!val)
}

// 选择操作
const handleSelectAll = () => {
  selectedAnnouncements.value = selectAll.value ? paginatedAnnouncements.value.map(a => a.id) : []
}

watch(
  [selectedAnnouncements, paginatedAnnouncements],
  () => {
    const ids = paginatedAnnouncements.value.map(a => a.id)
    selectAll.value = ids.length > 0 && ids.every((id) => selectedAnnouncements.value.includes(id))
  },
  { deep: true }
)

const clearSelection = () => {
  selectedAnnouncements.value = []
  selectAll.value = false
}

// 筛选操作
const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  typeFilter.value = ''
  currentPage.value = 1
}

// 置顶操作
const togglePin = async (announcement: Announcement) => {
  const action = announcement.isPinned ? '取消置顶' : '置顶'
  try {
    await ElMessageBox.confirm(`确定要${action}公告 "${announcement.title}" 吗？`, '确认操作', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await announcementApi.togglePinAnnouncement(announcement.id)
    ElMessage.success(`公告${action}成功`)
    await loadAnnouncements()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('切换置顶状态失败:', error)
      ElMessage.error(error.message || '操作失败')
    }
  }
}

// 发布操作
const publishAnnouncement = async (announcement: Announcement) => {
  try {
    await ElMessageBox.confirm(`确定要发布公告 "${announcement.title}" 吗？`, '确认发布', {
      confirmButtonText: '发布',
      cancelButtonText: '取消',
      type: 'success'
    })
    await announcementApi.publishAnnouncement(announcement.id)
    ElMessage.success('公告发布成功')
    await loadAnnouncements()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('发布公告失败:', error)
      ElMessage.error(error.message || '发布失败')
    }
  }
}

// 批量发布
const publishBatch = async () => {
  if (selectedAnnouncements.value.length === 0) {
    ElMessage.warning('请先选择要发布的公告')
    return
  }
  
  const draftAnnouncements = announcements.value.filter(a => 
    selectedAnnouncements.value.includes(a.id) && a.status === 'draft'
  )
  
  if (draftAnnouncements.length === 0) {
    ElMessage.warning('选中的公告中没有草稿状态的公告')
    return
  }
  
  try {
    await ElMessageBox.confirm(`确定要批量发布 ${draftAnnouncements.length} 条公告吗？`, '批量发布', {
      confirmButtonText: '发布',
      cancelButtonText: '取消',
      type: 'success'
    })
    const result = await announcementApi.batchPublishAnnouncements(selectedAnnouncements.value)
    selectedAnnouncements.value = []
    selectAll.value = false
    ElMessage.success(`批量发布完成：成功 ${result.published} 条，失败 ${result.failed} 条`)
    await loadAnnouncements()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('批量发布失败:', error)
      ElMessage.error(error.message || '批量发布失败')
    }
  }
}

// 编辑操作
const editAnnouncement = (announcement: Announcement) => {
  editingAnnouncement.value = announcement
  const formData = dataTransform.announcementToFormData(announcement)
  Object.assign(announcementForm, formData)
  editorMode.value = 'wysiwyg'
  showAddDialog.value = true
}

// 删除操作
const deleteAnnouncement = async (announcement: Announcement) => {
  try {
    await ElMessageBox.confirm(`确定要删除公告 "${announcement.title}" 吗？此操作不可恢复！`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'error'
    })
    await announcementApi.deleteAnnouncement(announcement.id)
    ElMessage.success('公告删除成功')
    await loadAnnouncements()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除公告失败:', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 保存操作
const saveAsDraft = async () => {
  await saveAnnouncement('draft')
}

const saveAnnouncement = async (forceStatus?: string) => {
  const validation = announcementValidator.validateCreateForm(announcementForm)
  if (!validation.valid) {
    validation.errors.forEach(error => ElMessage.error(error))
    return
  }

  saving.value = true
  
  try {
    if (editingAnnouncement.value) {
      const updateData: UpdateAnnouncementRequest = {
        ...dataTransform.formToUpdateRequest(announcementForm),
        ...(forceStatus && { status: forceStatus })
      }
      await announcementApi.updateAnnouncement(editingAnnouncement.value.id, updateData)
      ElMessage.success('公告更新成功')
    } else {
      const createData: CreateAnnouncementRequest = dataTransform.formToCreateRequest(announcementForm)
      await announcementApi.createAnnouncement(createData)
      ElMessage.success('公告创建成功')
    }
    
    showAddDialog.value = false
    editingAnnouncement.value = null
    autoPublish.value = false
    Object.assign(announcementForm, {
      title: '',
      content: '',
      type: 'system',
      isPinned: false,
      publishTime: null,
      expireTime: null
    })
    await loadAnnouncements()
  } catch (error: any) {
    console.error('保存公告失败:', error)
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// 对话框关闭处理
const handleDialogClose = () => {
  editingAnnouncement.value = null
  autoPublish.value = false
  editorMode.value = 'wysiwyg'
  Object.assign(announcementForm, {
    title: '',
    content: '',
    type: 'system',
    isPinned: false,
    publishTime: null,
    expireTime: null
  })
}

watch(showAddDialog, (newVal) => {
  if (!newVal) handleDialogClose()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Quill 编辑器样式 */
.quill-editor-wrapper :deep(.ql-container) {
  font-size: 14px;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

.quill-editor-wrapper :deep(.ql-toolbar) {
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  background-color: #f5f5f5;
}

.quill-editor-wrapper :deep(.ql-editor) {
  min-height: 300px;
}

/* Markdown 编辑器 */
.markdown-textarea :deep(.el-textarea__inner) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  border-radius: 8px;
}

/* Prose 样式（用于 Markdown 渲染） */
.prose {
  color: inherit;
  max-width: 65ch;
}

.prose :deep(h1) {
  font-size: 2em;
  margin: 0.67em 0;
  font-weight: 700;
  line-height: 1.25;
}

.prose :deep(h2) {
  font-size: 1.5em;
  margin: 0.83em 0;
  font-weight: 600;
  line-height: 1.25;
}

.prose :deep(h3) {
  font-size: 1.25em;
  margin: 1em 0;
  font-weight: 600;
  line-height: 1.25;
}

.prose :deep(h4) {
  font-size: 1.1em;
  margin: 1.12em 0;
  font-weight: 600;
}

.prose :deep(p) {
  margin: 1em 0;
  line-height: 1.7;
}

.prose :deep(code) {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 0.875em;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.prose :deep(pre) {
  background-color: #f6f8fa;
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  margin: 1em 0;
  line-height: 1.5;
}

.prose :deep(pre code) {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
}

.prose :deep(ul), .prose :deep(ol) {
  padding-left: 2em;
  margin: 1em 0;
}

.prose :deep(li) {
  margin: 0.5em 0;
}

.prose :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1em 0;
}

.prose :deep(blockquote) {
  border-left: 4px solid #ddd;
  padding-left: 1em;
  color: #666;
  margin: 1em 0;
  font-style: italic;
}

.prose :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

.prose :deep(table th),
.prose :deep(table td) {
  border: 1px solid #ddd;
  padding: 0.6em 1em;
  text-align: left;
}

.prose :deep(table th) {
  background-color: #f6f8fa;
  font-weight: 600;
}

.prose :deep(a) {
  color: #0366d6;
  text-decoration: none;
}

.prose :deep(a:hover) {
  text-decoration: underline;
}

.prose :deep(hr) {
  border: none;
  border-top: 1px solid #ddd;
  margin: 2em 0;
}

.prose :deep(strong) {
  font-weight: 600;
}

.prose :deep(em) {
  font-style: italic;
}

/* 暗色模式下的 Prose 样式 */
.prose-invert :deep(code) {
  background-color: rgba(255, 255, 255, 0.1);
  color: #e6edf3;
}

.prose-invert :deep(pre) {
  background-color: #1e1e1e;
}

.prose-invert :deep(blockquote) {
  border-left-color: #444;
  color: #aaa;
}

.prose-invert :deep(table th),
.prose-invert :deep(table td) {
  border-color: #444;
}

.prose-invert :deep(table th) {
  background-color: #2a2a2a;
}

.prose-invert :deep(a) {
  color: #58a6ff;
}

.prose-invert :deep(hr) {
  border-top-color: #444;
}
</style>