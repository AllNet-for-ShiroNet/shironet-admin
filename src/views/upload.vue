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
          ]">Chunithm 数据上传管理</h2>
          <p :class="[
            'text-xs sm:text-sm mt-1',
            isDark ? 'text-gray-400' : 'text-gray-500'
          ]">管理游戏静态数据文件上传和解析</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <el-button type="primary" @click="showUploadDialog = true" size="small" class="text-xs sm:text-sm">
            <el-icon class="mr-1"><Upload /></el-icon>
            <span class="hidden sm:inline">上传数据</span>
            <span class="sm:hidden">上传</span>
          </el-button>
          <el-button @click="refreshStats" plain size="small" class="text-xs sm:text-sm">
            <el-icon class="mr-1"><Refresh /></el-icon>
            <span class="hidden sm:inline">刷新统计</span>
            <span class="sm:hidden">刷新</span>
          </el-button>
        </div>
      </div>
      
      <!-- 上传类型筛选 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <el-select 
          v-model="selectedUploadType" 
          placeholder="选择数据类型" 
          clearable
          size="default"
          @change="handleTypeChange"
        >
          <el-option 
            v-for="(label, type) in UPLOAD_TYPE_LABELS" 
            :key="type"
            :label="label" 
            :value="type"
          />
        </el-select>
        
        <el-input
          v-model="searchQuery"
          placeholder="搜索..."
          clearable
          size="default"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <div v-if="selectedUploadType" class="flex gap-2">
          <el-button 
            @click="viewTypeData" 
            type="primary" 
            plain
            size="small" 
            class="text-xs sm:text-sm flex-1"
          >
            <el-icon class="mr-1"><View /></el-icon>
            <span class="hidden sm:inline">查看数据</span>
            <span class="sm:hidden">查看</span>
          </el-button>
          <el-button 
            @click="clearTypeData" 
            type="danger" 
            plain
            size="small" 
            class="text-xs sm:text-sm flex-1"
          >
            <el-icon class="mr-1"><Delete /></el-icon>
            <span class="hidden sm:inline">清理数据</span>
            <span class="sm:hidden">清理</span>
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <div
        v-for="stat in displayStats"
        :key="stat.type"
        :class="[
          'p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md',
          isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-50',
          selectedUploadType === stat.type ? 'ring-2 ring-blue-500' : ''
        ]"
        @click="selectedUploadType = stat.type"
      >
        <div class="text-center">
          <span :class="[
            'text-3xl font-bold block mb-2',
            isDark ? 'text-white' : 'text-gray-900'
          ]">{{ stat.count }}</span>
          <h3 :class="[
            'text-sm font-medium',
            isDark ? 'text-gray-300' : 'text-gray-700'
          ]">{{ UPLOAD_TYPE_LABELS[stat.type as UploadType] }}</h3>
        </div>
      </div>
    </div>

    <!-- 解析结果预览区域 -->
    <div v-if="parseResult && parseResult.data.length > 0" :class="[
      'p-4 sm:p-6 rounded-lg border',
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    ]">
      <div class="flex items-center justify-between mb-4">
        <h3 :class="[
          'text-lg font-semibold',
          isDark ? 'text-white' : 'text-gray-900'
        ]">解析结果预览</h3>
        <div class="flex items-center space-x-2">
          <!-- 版本号输入 - 仅在包含音乐数据时显示 -->
          <div v-if="hasTypeInResults('music')" class="flex items-center space-x-2">
            <label :class="[
              'text-sm',
              isDark ? 'text-gray-400' : 'text-gray-600'
            ]">版本号:</label>
            <el-input-number
              v-model="musicVersion"
              :min="1"
              :max="999"
              size="small"
              style="width: 80px"
              controls-position="right"
            />
          </div>
          <el-button @click="importParsedData" type="primary" size="small" :loading="importing">
            <el-icon class="mr-1"><Download /></el-icon>
            导入数据
          </el-button>
          <el-button @click="clearParseResult" type="danger" text size="small">
            <el-icon class="mr-1"><Close /></el-icon>
            清除
          </el-button>
        </div>
      </div>

      <!-- 解析统计信息 -->
      <div :class="[
        'mb-4 p-3 rounded-lg',
        isDark ? 'bg-gray-700' : 'bg-blue-50'
      ]">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span :class="[
              'block font-medium',
              isDark ? 'text-gray-300' : 'text-blue-700'
            ]">解析文件</span>
            <span :class="[
              isDark ? 'text-gray-400' : 'text-blue-600'
            ]">{{ parseResult.fileCount }} 个</span>
          </div>
          <div>
            <span :class="[
              'block font-medium',
              isDark ? 'text-gray-300' : 'text-blue-700'
            ]">数据条数</span>
            <span :class="[
              isDark ? 'text-gray-400' : 'text-blue-600'
            ]">{{ parseResult.dataCount }} 条</span>
          </div>
          <div>
            <span :class="[
              'block font-medium',
              isDark ? 'text-gray-300' : 'text-blue-700'
            ]">处理类型</span>
            <span :class="[
              isDark ? 'text-gray-400' : 'text-blue-600'
            ]">
              {{ getProcessedTypesDisplay() }}
            </span>
          </div>
          <div v-if="parseResult.uploadedAssets && parseResult.uploadedAssets.length > 0">
            <span :class="[
              'block font-medium',
              isDark ? 'text-gray-300' : 'text-blue-700'
            ]">R2 资源</span>
            <span :class="[
              isDark ? 'text-emerald-300' : 'text-emerald-600'
            ]">{{ parseResult.uploadedAssets.length }} 个</span>
          </div>
          <div v-if="parseResult.uploadErrors && parseResult.uploadErrors.length > 0">
            <span :class="[
              'block font-medium text-amber-500'
            ]">上传告警</span>
            <span class="text-amber-600">{{ parseResult.uploadErrors.length }} 条</span>
          </div>
          <div v-if="parseResult.errors && parseResult.errors.length > 0">
            <span :class="[
              'block font-medium text-red-500'
            ]">解析错误</span>
            <span class="text-red-400">{{ parseResult.errors.length }} 个</span>
          </div>
        </div>
      </div>

      <!-- R2 上传告警 -->
      <div v-if="parseResult.uploadErrors && parseResult.uploadErrors.length > 0" class="mb-4">
        <el-collapse>
          <el-collapse-item title="R2 上传告警" name="r2errs">
            <div class="space-y-2">
              <div
                v-for="(msg, index) in parseResult.uploadErrors"
                :key="'ue-' + index"
                class="p-2 bg-amber-50 text-amber-900 rounded text-sm"
              >
                <el-icon class="mr-1"><Warning /></el-icon>
                {{ msg }}
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>

      <!-- 已成功写入 R2 的对象（摘要） -->
      <div v-if="parseResult.uploadedAssets && parseResult.uploadedAssets.length > 0" class="mb-4">
        <el-collapse>
          <el-collapse-item title="R2 已上传对象键（摘要）" name="r2ok">
            <div class="max-h-48 overflow-y-auto space-y-1 text-xs font-mono">
              <div
                v-for="(item, index) in parseResult.uploadedAssets"
                :key="'ua-' + index"
                :class="[
                  'truncate',
                  isDark ? 'text-gray-300' : 'text-gray-700'
                ]"
                :title="item.key + ' ← ' + item.sourceZipPath"
              >
                {{ item.key }}
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>

      <!-- 错误信息 -->
      <div v-if="parseResult.errors && parseResult.errors.length > 0" class="mb-4">
        <el-collapse>
          <el-collapse-item title="查看解析错误" name="errors">
            <div class="space-y-2">
              <div
                v-for="(error, index) in parseResult.errors"
                :key="index"
                class="p-2 bg-red-50 text-red-700 rounded text-sm"
              >
                <el-icon class="mr-1"><Warning /></el-icon>
                {{ error }}
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>

      <!-- 数据预览 -->
      <div class="overflow-x-auto">
        <!-- 添加分页控制 -->
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <span :class="[
                'text-sm',
                isDark ? 'text-gray-400' : 'text-gray-600'
              ]">每页显示:</span>
              <el-select v-model="pageSize" size="small" style="width: 80px" :disabled="groupByGenre && hasTypeInResults('music')">
                <el-option label="10" :value="10" />
                <el-option label="20" :value="20" />
                <el-option label="50" :value="50" />
                <el-option label="100" :value="100" />
              </el-select>
            </div>
            <div class="flex items-center space-x-2">
              <span :class="[
                'text-sm',
                isDark ? 'text-gray-400' : 'text-gray-600'
              ]">数据去重:</span>
              <el-switch v-model="deduplicateData" size="small" />
              <span :class="[
                'text-xs',
                isDark ? 'text-gray-500' : 'text-gray-500'
              ]">（关闭时显示所有难度）</span>
            </div>
            <div v-if="hasTypeInResults('music')" class="flex items-center space-x-2">
              <span :class="[
                'text-sm',
                isDark ? 'text-gray-400' : 'text-gray-600'
              ]">Genre分组:</span>
              <el-switch v-model="groupByGenre" size="small" />
            </div>
          </div>
        </div>

        <!-- 分组显示或常规表格 -->
        <div v-if="groupByGenre && hasTypeInResults('music')">
          <!-- Genre分组显示 -->
          <div class="space-y-6">
            <div v-for="(items, genre) in genreGroupedData" :key="genre" :class="[
              'border rounded-lg',
              isDark ? 'border-gray-600' : 'border-gray-200'
            ]">
              <!-- Genre标题 -->
              <div :class="[
                'px-4 py-3 border-b flex items-center justify-between',
                isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'
              ]">
                <h4 class="font-medium text-lg">{{ genre }}</h4>
                <el-tag size="small" type="info">{{ items.length }} 首</el-tag>
              </div>
              
              <!-- 该分类下的歌曲 -->
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead :class="[
                    'border-b bg-opacity-50',
                    isDark ? 'bg-gray-600 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'
                  ]">
                    <tr>
                      <th class="px-3 py-2 text-left">ID</th>
                      <th class="px-3 py-2 text-left">名称</th>
                      <th class="px-3 py-2 text-left">艺术家</th>
                      <th class="px-3 py-2 text-left">难度</th>
                      <th class="px-3 py-2 text-left">等级</th>
                      <th class="px-3 py-2 text-left">World's End</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr 
                      v-for="(item, index) in items" 
                      :key="`${item.songId}-${item.chartId}`"
                      :class="[
                        'border-b transition-colors',
                        isDark 
                          ? 'border-gray-700 hover:bg-gray-700 text-gray-300' 
                          : 'border-gray-100 hover:bg-gray-50 text-gray-900'
                      ]"
                    >
                      <td class="px-3 py-2">{{ item.songId }}</td>
                      <td class="px-3 py-2 max-w-xs">
                        <div class="truncate" :title="item.title">
                          {{ item.title }}
                        </div>
                      </td>
                      <td class="px-3 py-2 max-w-sm">
                        <div class="truncate" :title="item.artist">
                          {{ item.artist }}
                        </div>
                      </td>
                      <td class="px-3 py-2">
                        <el-tag 
                          size="small" 
                          :type="getDifficultyTagType(item.chartId)"
                          :class="getDifficultyCustomClass(item.chartId)"
                        >
                          {{ getDifficultyName(item.chartId) }}
                        </el-tag>
                      </td>
                      <td class="px-3 py-2">{{ item.level }}</td>
                      <td class="px-3 py-2">
                        <el-tag v-if="item.worldsEndTag" size="small" type="warning">
                          {{ item.worldsEndTag }}
                        </el-tag>
                        <span v-else class="text-gray-400">-</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 常规表格显示 -->
        <div v-else>
          <table class="w-full text-sm">
            <thead :class="[
              'border-b',
              isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-slate-100 border-gray-200 text-gray-800'
            ]">
              <tr>
                <th class="px-3 py-2 text-left">ID</th>
                <th class="px-3 py-2 text-left">名称</th>
                <th v-if="hasTypeInResults('avatar-accessory')" class="px-3 py-2 text-left">分类</th>
                <th v-if="hasTypeInResults('trophies')" class="px-3 py-2 text-left">稀有度</th>
                <th v-if="hasTypeInResults('system-voice')" class="px-3 py-2 text-left">音频路径</th>
                <th v-if="hasTypeInResults('character-texture')" class="px-3 py-2 text-left">DDS0</th>
                <th v-if="hasTypeInResults('character-texture')" class="px-3 py-2 text-left">DDS1</th>
                <th v-if="hasTypeInResults('character-texture')" class="px-3 py-2 text-left">DDS2</th>
                <th v-if="hasTypeInResults('character')" class="px-3 py-2 text-left">版本</th>
                <th v-if="hasTypeInResults('character')" class="px-3 py-2 text-left">稀有度</th>
                <th v-if="hasTypeInResults('character')" class="px-3 py-2 text-left">默认图</th>
                <th v-if="hasTypeInResults('music')" class="px-3 py-2 text-left">艺术家</th>
                <th v-if="hasTypeInResults('music')" class="px-3 py-2 text-left">Genre</th>
                <th v-if="hasTypeInResults('music')" class="px-3 py-2 text-left">难度</th>
                <th v-if="hasTypeInResults('music')" class="px-3 py-2 text-left">等级</th>
                <th v-if="hasTypeInResults('music')" class="px-3 py-2 text-left">World's End</th>
                <th v-if="!hasTypeInResults('trophies') && !hasTypeInResults('music') && !hasTypeInResults('character') && !hasTypeInResults('character-texture')" class="px-3 py-2 text-left">图片路径</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="(item, index) in paginatedData" 
                :key="`${item.characterId || item.id || item.songId}-${item.chartId ?? ''}-${index}`"
                :class="[
                  'border-b transition-colors',
                  isDark 
                    ? 'border-gray-700 hover:bg-gray-700 text-gray-300' 
                    : 'border-gray-100 hover:bg-gray-50 text-gray-900'
                ]"
              >
                <td class="px-3 py-2">{{ item.characterId ?? item.id ?? item.songId }}</td>
                <td class="px-3 py-2 max-w-xs">
                  <div class="truncate" :title="item.name || item.title">
                    {{ item.name || item.title }}
                  </div>
                </td>
                <td v-if="hasTypeInResults('avatar-accessory')" class="px-3 py-2">{{ item.category }}</td>
                <td v-if="hasTypeInResults('trophies')" class="px-3 py-2">{{ item.rareType }}</td>
                <td v-if="hasTypeInResults('system-voice')" class="px-3 py-2 max-w-xs">
                  <div class="text-xs truncate" :title="item.cuePath">
                    {{ item.cuePath }}
                  </div>
                </td>
                <td v-if="hasTypeInResults('character-texture')" class="px-3 py-2 max-w-xs">
                  <div class="text-xs truncate" :title="item.ddsFile0Path">
                    {{ item.ddsFile0Path }}
                  </div>
                </td>
                <td v-if="hasTypeInResults('character-texture')" class="px-3 py-2 max-w-xs">
                  <div class="text-xs truncate" :title="item.ddsFile1Path">
                    {{ item.ddsFile1Path }}
                  </div>
                </td>
                <td v-if="hasTypeInResults('character-texture')" class="px-3 py-2 max-w-xs">
                  <div class="text-xs truncate" :title="item.ddsFile2Path">
                    {{ item.ddsFile2Path }}
                  </div>
                </td>
                <td v-if="hasTypeInResults('character')" class="px-3 py-2">{{ item.version }}</td>
                <td v-if="hasTypeInResults('character')" class="px-3 py-2">{{ item.rareType ?? '-' }}</td>
                <td v-if="hasTypeInResults('character')" class="px-3 py-2 max-w-xs">
                  <div class="text-xs truncate" :title="item.imagePath1">
                    {{ item.imagePath1 ?? '-' }}
                  </div>
                </td>
                <td v-if="hasTypeInResults('music')" class="px-3 py-2 max-w-sm">
                  <div class="truncate" :title="item.artist">
                    {{ item.artist }}
                  </div>
                </td>
                <td v-if="hasTypeInResults('music')" class="px-3 py-2">
                  <el-tag size="small" type="info">{{ item.genre || '未分类' }}</el-tag>
                </td>
                <td v-if="hasTypeInResults('music')" class="px-3 py-2">
                  <el-tag 
                    size="small" 
                    :type="getDifficultyTagType(item.chartId)"
                    :class="getDifficultyCustomClass(item.chartId)"
                  >
                    {{ getDifficultyName(item.chartId) }}
                  </el-tag>
                </td>
                <td v-if="hasTypeInResults('music')" class="px-3 py-2">{{ item.level }}</td>
                <td v-if="hasTypeInResults('music')" class="px-3 py-2">
                  <el-tag v-if="item.worldsEndTag" size="small" type="warning">
                    {{ item.worldsEndTag }}
                  </el-tag>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td v-if="!hasTypeInResults('trophies') && !hasTypeInResults('music') && !hasTypeInResults('character') && !hasTypeInResults('character-texture')" class="px-3 py-2 max-w-xs">
                  <div class="text-xs truncate" :title="item.imagePath">
                    {{ item.imagePath }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- 分页控件 -->
        <div v-if="!groupByGenre || !hasTypeInResults('music')" class="mt-4 flex justify-between items-center">
          <div :class="[
            'text-sm',
            isDark ? 'text-gray-400' : 'text-gray-500'
          ]">
            显示 {{ startIndex + 1 }}-{{ Math.min(startIndex + pageSize, displayData.length) }} 条，共 {{ displayData.length }} 条数据
            <span v-if="deduplicateData && originalDataLength !== displayData.length" class="ml-2 text-blue-500">
              (已去重，原始数据 {{ originalDataLength }} 条)
            </span>
          </div>
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="displayData.length"
            layout="prev, pager, next"
            small
            @current-change="handlePageChange"
          />
        </div>
        
        <!-- Genre分组模式下的统计信息 -->
        <div v-else class="mt-4">
          <div :class="[
            'text-sm',
            isDark ? 'text-gray-400' : 'text-gray-500'
          ]">
            共 {{ Object.keys(genreGroupedData).length }} 个分类，{{ displayData.length }} 条数据
            <span v-if="deduplicateData && originalDataLength !== displayData.length" class="ml-2 text-blue-500">
              (已去重，原始数据 {{ originalDataLength }} 条)
            </span>
          </div>
          <div class="mt-2 flex flex-wrap gap-2">
            <el-tag v-for="(count, genre) in genreStats" :key="genre" size="small" type="info">
              {{ genre }}: {{ count }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div 
      v-if="displayStats.length === 0 && !loading"
      :class="[
        'text-center py-12 rounded-lg border',
        isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-500'
      ]"
    >
      <el-icon size="64" class="mb-4 opacity-50"><Folder /></el-icon>
      <p class="text-lg mb-2">暂无数据</p>
      <p class="text-sm">上传 XML 文件或压缩包开始使用</p>
    </div>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="showUploadDialog"
      title="上传游戏数据文件"
      :width="isMobile ? '95%' : '600px'"
      align-center
    >
      <div class="space-y-4">
        <!-- 多类型数据包的类型选择 -->
        <div v-if="zipPreview?.detectedTypes && zipPreview.detectedTypes.length > 1">
          <label :class="[
            'text-sm mb-2 block',
            isDark ? 'text-gray-400' : 'text-gray-600'
          ]">
            <el-icon class="mr-1"><Warning /></el-icon>
            多类型数据包 - 请选择要处理的数据类型（可多选）
          </label>
          <div :class="[
            'p-3 rounded-lg border',
            isDark ? 'bg-orange-900/20 border-orange-700' : 'bg-orange-50 border-orange-200'
          ]">
            <p :class="[
              'text-xs mb-3',
              isDark ? 'text-orange-400' : 'text-orange-700'
            ]">
              这个压缩包包含了多种类型的数据文件。请选择您要处理的数据类型：
            </p>
            <div class="flex flex-wrap gap-2">
              <el-button
                v-for="type in zipPreview.detectedTypes"
                :key="type"
                :type="selectedTypesForProcessing.includes(type) ? 'primary' : 'default'"
                size="small"
                @click="toggleTypeSelection(type)"
              >
                {{ UPLOAD_TYPE_LABELS[type] }}
              </el-button>
            </div>
          </div>
        </div>

        <!-- 单一类型检测显示 -->
        <div v-else-if="detectedType">
          <label :class="[
            'text-sm mb-2 block',
            isDark ? 'text-gray-400' : 'text-gray-600'
          ]">检测到的数据类型</label>
          <el-tag :type="detectedType ? 'success' : 'info'" size="large">
            <el-icon class="mr-1"><Check /></el-icon>
            {{ UPLOAD_TYPE_LABELS[detectedType] }}
          </el-tag>
        </div>

        <!-- 压缩包预览 -->
        <div v-if="zipPreview" :class="[
          'p-3 rounded-lg border',
          isDark ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'
        ]">
          <div class="flex items-center justify-between mb-2">
            <h4 :class="[
              'text-sm font-medium flex items-center',
              isDark ? 'text-gray-200' : 'text-blue-800'
            ]">
              <el-icon class="mr-1"><FolderOpened /></el-icon>
              压缩包内容预览
            </h4>
            <div class="flex gap-1">
              <el-tag 
                v-if="zipPreview.detectedType" 
                type="success" 
                size="small"
              >
                {{ UPLOAD_TYPE_LABELS[zipPreview.detectedType] }}
              </el-tag>
              <el-tag 
                v-for="type in zipPreview.detectedTypes?.slice(0, 3)" 
                :key="type"
                type="info" 
                size="small"
              >
                {{ UPLOAD_TYPE_LABELS[type] }}
              </el-tag>
              <el-tag 
                v-if="(zipPreview.detectedTypes?.length || 0) > 3"
                type="info" 
                size="small"
              >
                +{{ (zipPreview.detectedTypes?.length || 0) - 3 }}
              </el-tag>
            </div>
          </div>
          <div class="text-xs space-y-1">
            <p :class="[isDark ? 'text-gray-300' : 'text-blue-700']">
              <el-icon class="mr-1"><Document /></el-icon>
              XML 文件数量: {{ zipPreview.totalCount }} 个
            </p>
            <p :class="[isDark ? 'text-gray-300' : 'text-blue-700']">
              <el-icon class="mr-1"><DataBoard /></el-icon>
              总大小: {{ uploadDataTransform.formatFileSize(zipPreview.totalSize) }}
            </p>
            <p v-if="zipPreview.detectedTypes && zipPreview.detectedTypes.length > 1" :class="[
              isDark ? 'text-yellow-400' : 'text-orange-600'
            ]">
              <el-icon class="mr-1"><InfoFilled /></el-icon>
              检测到多种数据类型，共 {{ zipPreview.detectedTypes.length }} 种
            </p>
            <p v-if="!zipPreview.hasValidFiles" class="text-red-500">
              <el-icon class="mr-1"><Warning /></el-icon>
              警告: 未发现有效的 XML 文件
            </p>
          </div>
        </div>

        <!-- 文件拖拽上传区域 -->
        <div 
          :class="[
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
            isDragOver 
              ? 'border-blue-500 bg-blue-50' 
              : isDark 
                ? 'border-gray-600 bg-gray-700 hover:border-gray-500' 
                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          ]"
          @drop="handleDrop"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @click="triggerFileInput"
        >
          <el-icon size="48" :class="[
            'mb-2',
            isDark ? 'text-gray-500' : 'text-gray-400'
          ]"><UploadFilled /></el-icon>
          <p :class="[
            'text-sm mb-2',
            isDark ? 'text-gray-300' : 'text-gray-700'
          ]">拖拽文件到此处或点击选择文件</p>
          <p :class="[
            'text-sm',
            isDark ? 'text-gray-400' : 'text-gray-500'
          ]">支持XML文件或游戏数据压缩包，系统会自动检测数据类型</p>
          <input
            ref="fileInputRef"
            type="file"
            multiple
            accept=".xml,.zip"
            @change="handleFileSelect"
            class="hidden"
          />
        </div>

        <!-- 已选择的文件列表 -->
        <div v-if="selectedFiles.length > 0" class="space-y-2">
          <h4 :class="[
            'text-sm font-medium flex items-center',
            isDark ? 'text-gray-300' : 'text-gray-700'
          ]">
            <el-icon class="mr-1"><Files /></el-icon>
            已选择的文件:
          </h4>
          <div class="space-y-1">
            <div
              v-for="(file, index) in selectedFiles"
              :key="index"
              :class="[
                'flex items-center justify-between p-2 rounded border',
                isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              ]"
            >
              <div class="flex items-center space-x-2">
                <el-icon class="text-blue-500">
                  <component :is="getFileTypeIcon(file.name)" />
                </el-icon>
                <span :class="[
                  'text-sm',
                  isDark ? 'text-gray-300' : 'text-gray-700'
                ]">{{ file.name }}</span>
                <span :class="[
                  'text-xs',
                  isDark ? 'text-gray-500' : 'text-gray-500'
                ]">
                  ({{ uploadDataTransform.formatFileSize(file.size) }})
                </span>
                <!-- 显示检测到的类型 -->
                <el-tag v-if="fileTypeMap.get(file)" size="small" type="info">
                  {{ UPLOAD_TYPE_LABELS[fileTypeMap.get(file)!] }}
                </el-tag>
              </div>
              <el-button 
                @click="removeFile(index)" 
                type="danger" 
                text 
                size="small"
                class="!w-6 !h-6 !p-0"
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <!-- 上传进度 -->
        <div v-if="uploadProgress > 0" class="space-y-2">
          <div class="flex justify-between text-sm items-center">
            <span :class="[
              'flex items-center',
              isDark ? 'text-gray-300' : 'text-gray-700'
            ]">
              <el-icon class="mr-1 animate-spin"><Loading /></el-icon>
              {{ uploadingPhase }}
            </span>
            <span :class="[
              isDark ? 'text-gray-400' : 'text-gray-600'
            ]">{{ uploadProgress.toFixed(2) }}%</span>
          </div>
          <el-progress :percentage="uploadProgress" :show-text="false" />
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end space-x-2">
          <el-button @click="cancelUpload" :size="isMobile ? 'small' : 'default'">
            <el-icon class="mr-1"><Close /></el-icon>
            取消
          </el-button>
          <el-button 
            type="primary" 
            @click="startUpload" 
            :loading="uploading"
            :disabled="!hasValidSelection || selectedFiles.length === 0"
            :size="isMobile ? 'small' : 'default'"
          >
            <el-icon class="mr-1" v-if="!uploading"><Check /></el-icon>
            开始处理
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, inject, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Upload, Refresh, Search, RefreshLeft, Delete, Download, Close, Warning, 
  Check, FolderOpened, Document, DataBoard, InfoFilled, UploadFilled, 
  Files, Loading, Folder, View
} from '@element-plus/icons-vue'
import { 
  uploadApi, 
  uploadDataTransform, 
  fileValidator,
  UPLOAD_TYPE_LABELS, 
  SUPPORTED_FILE_TYPES,
  type UploadStats, 
  type UploadType, 
  type XmlParseResultDto,
  type UploadedAssetDto,
  type ZipPreview
} from '@/api/upload'

interface UploadForm {
  type: string
}

const loading = ref(false)
const uploading = ref(false)
const importing = ref(false)
const showUploadDialog = ref(false)
const selectedUploadType = ref<string>('')
const searchQuery = ref('')
const isMobile = ref(false)
const isDragOver = ref(false)
const uploadProgress = ref(0)
const uploadingPhase = ref('')
const musicVersion = ref(1) // 音乐数据版本号

// 分页相关
const currentPage = ref(1)
const pageSize = ref(20)
const deduplicateData = ref(false) // 默认关闭去重，显示所有难度
const groupByGenre = ref(true) // 默认开启genre分组

// 从父组件获取主题状态
const isDark = inject('isDark', ref(false))
// 检测屏幕尺寸
const checkMobile = () => {
  isMobile.value = window.innerWidth < 640
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  fetchUploadStats()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const uploadForm = reactive<UploadForm>({
  type: ''
})

const uploadStats = ref<UploadStats>({
  avatarAccessory: 0,
  character: 0,
  mapIcon: 0,
  namePlate: 0,
  systemVoice: 0,
  trophies: 0,
  music: 0,
  total: 0
})

const selectedFiles = ref<File[]>([])
const fileInputRef = ref<HTMLInputElement>()
const parseResult = ref<XmlParseResultDto | null>(null)
const zipPreview = ref<ZipPreview | null>(null)
const detectedType = ref<UploadType | null>(null)
const conflictingTypes = ref<UploadType[]>([])
const fileTypeMap = ref<Map<File, UploadType | null>>(new Map())
const selectedTypesForProcessing = ref<UploadType[]>([])

// 数据处理相关计算属性
const originalDataLength = computed(() => {
  return parseResult.value?.data.length || 0
})

const displayData = computed(() => {
  if (!parseResult.value || !parseResult.value.data) return []
  
  let data = [...parseResult.value.data]
  
  // 如果是音乐数据且开启去重，按 songId 去重，保留第一个
  if (deduplicateData.value && hasTypeInResults('music')) {
    const uniqueMap = new Map()
    data.forEach(item => {
      const key = item.songId || item.id
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item)
      }
    })
    data = Array.from(uniqueMap.values())
  }
  
  return data
})

// Genre分组数据
const genreGroupedData = computed(() => {
  if (!hasTypeInResults('music') || !groupByGenre.value) {
    return { ungrouped: displayData.value }
  }
  
  const grouped: Record<string, any[]> = {}
  displayData.value.forEach(item => {
    const genre = item.genre || '未分类'
    if (!grouped[genre]) {
      grouped[genre] = []
    }
    grouped[genre].push(item)
  })
  
  // 按genre名称排序
  const sortedGenres = Object.keys(grouped).sort()
  const result: Record<string, any[]> = {}
  sortedGenres.forEach(genre => {
    result[genre] = grouped[genre]
  })
  
  return result
})

const startIndex = computed(() => {
  return (currentPage.value - 1) * pageSize.value
})

const paginatedData = computed(() => {
  if (groupByGenre.value && hasTypeInResults('music')) {
    // 如果开启分组，返回所有数据用于分组显示
    return displayData.value
  } else {
    // 如果不分组，使用分页
    const start = startIndex.value
    const end = start + pageSize.value
    return displayData.value.slice(start, end)
  }
})

// 获取genre的统计信息
const genreStats = computed(() => {
  const stats: Record<string, number> = {}
  Object.entries(genreGroupedData.value).forEach(([genre, items]) => {
    stats[genre] = items.length
  })
  return stats
})

// 获取处理类型的显示文本
const getProcessedTypesDisplay = () => {
  // 如果有手动选择的类型，优先使用
  if (selectedTypesForProcessing.value.length > 0) {
    return selectedTypesForProcessing.value.map(type => UPLOAD_TYPE_LABELS[type]).join(', ')
  }
  
  // 如果有自动检测的类型
  if (detectedType.value) {
    return UPLOAD_TYPE_LABELS[detectedType.value]
  }
  
  // 尝试从解析结果中推断类型
  if (parseResult.value && parseResult.value.data.length > 0) {
    const firstItem = parseResult.value.data[0]
    if (firstItem.songId !== undefined && firstItem.chartId !== undefined) {
      return UPLOAD_TYPE_LABELS['music']
    }
    if (firstItem.category !== undefined && firstItem.imagePath !== undefined) {
      return UPLOAD_TYPE_LABELS['avatar-accessory']
    }
    if (
      typeof firstItem.characterId === 'string' &&
      firstItem.characterId.length > 0 &&
      typeof firstItem.version === 'number'
    ) {
      return UPLOAD_TYPE_LABELS['character']
    }
    if (
      firstItem.ddsFile0Path !== undefined &&
      String(firstItem.ddsFile0Path).length > 0
    ) {
      return UPLOAD_TYPE_LABELS['character-texture']
    }
    if (firstItem.rareType !== undefined) {
      return UPLOAD_TYPE_LABELS['trophies']
    }
    if (firstItem.cuePath !== undefined) {
      return UPLOAD_TYPE_LABELS['system-voice']
    }
    if (firstItem.imagePath !== undefined) {
      return UPLOAD_TYPE_LABELS['map-icon'] // 或 name-plate
    }
  }
  
  return '自动检测'
}

// 切换类型选择
const toggleTypeSelection = (type: UploadType) => {
  const index = selectedTypesForProcessing.value.indexOf(type)
  if (index > -1) {
    selectedTypesForProcessing.value.splice(index, 1)
  } else {
    selectedTypesForProcessing.value.push(type)
  }
}

// 获取文件类型图标
const getFileTypeIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'xml': return Document
    case 'zip': return FolderOpened
    default: return Files
  }
}

// 检查结果中是否包含某个类型
const hasTypeInResults = (type: UploadType) => {
  // 检查手动选择的类型
  if (selectedTypesForProcessing.value.includes(type)) {
    return true
  }
  
  // 检查自动检测的类型
  if (detectedType.value === type && selectedTypesForProcessing.value.length === 0) {
    return true
  }
  
  // 从解析结果推断
  if (parseResult.value && parseResult.value.data.length > 0) {
    const firstItem = parseResult.value.data[0]
    switch (type) {
      case 'music':
        return firstItem.songId !== undefined && firstItem.chartId !== undefined
      case 'avatar-accessory':
        return firstItem.category !== undefined && firstItem.imagePath !== undefined
      case 'character-texture':
        return (
          firstItem.ddsFile0Path !== undefined &&
          String(firstItem.ddsFile0Path).length > 0
        )
      case 'character':
        return (
          typeof firstItem.characterId === 'string' &&
          firstItem.characterId.length > 0 &&
          typeof firstItem.version === 'number'
        )
      case 'trophies':
        return (
          typeof firstItem.rareType === 'number' &&
          'explainText' in firstItem
        )
      case 'system-voice':
        return firstItem.cuePath !== undefined
      case 'map-icon':
      case 'name-plate':
        return firstItem.imagePath !== undefined && firstItem.category === undefined && firstItem.rareType === undefined && firstItem.cuePath === undefined
    }
  }
  
  return false
}

/** 合并 ZIP / 多类型解析后的扁平数组里仅挑出当前批量导入类型对应字段的行（避免 ValidationPipe forbidNonWhitelisted 400） */
const rowLooksLikeMusic = (row: Record<string, unknown>) =>
  typeof row.songId === 'number' &&
  Number.isFinite(row.songId) &&
  typeof row.chartId === 'number' &&
  Number.isFinite(row.chartId)

const rowLooksLikeAvatarAccessory = (row: Record<string, unknown>) =>
  typeof row.category === 'number' &&
  Number.isFinite(row.category) &&
  !('ddsFile0Path' in row && row.ddsFile0Path !== undefined && String(row.ddsFile0Path).length > 0) &&
  !rowLooksLikeMusic(row)

const rowLooksLikeCharacterTexture = (row: Record<string, unknown>) =>
  row.ddsFile0Path !== undefined && String(row.ddsFile0Path ?? '').length > 0

/** Trophy：稀有度为整数；与静态角色区分：奖杯必有 explainText，且无 characterId */
const rowLooksLikeTrophy = (row: Record<string, unknown>) =>
  typeof row.rareType === 'number' &&
  Number.isFinite(row.rareType) &&
  'explainText' in row &&
  typeof row.characterId !== 'string' &&
  !rowLooksLikeCharacterTexture(row)

const rowLooksLikeSystemVoice = (row: Record<string, unknown>) =>
  typeof row.cuePath === 'string' &&
  !rowLooksLikeMusic(row) &&
  !rowLooksLikeAvatarAccessory(row) &&
  !rowLooksLikeTrophy(row) &&
  !rowLooksLikeCharacterTexture(row)

/** MapIcon / NamePlate：BaseXmlItemDto（无 category、无 cuePath、trophy 的 explainText）*/
const rowLooksLikeBaseXmlPlateOrIcon = (row: Record<string, unknown>) =>
  typeof row.id === 'number' &&
  Number.isFinite(row.id) &&
  typeof row.name === 'string' &&
  typeof row.sortName === 'string' &&
  typeof row.imagePath === 'string' &&
  row.category === undefined &&
  row.rareType === undefined &&
  row.cuePath === undefined &&
  row.characterId === undefined &&
  !rowLooksLikeMusic(row) &&
  !rowLooksLikeCharacterTexture(row) &&
  !('explainText' in row)

const rowLooksLikeStaticCharacter = (row: Record<string, unknown>) =>
  typeof row.characterId === 'string' &&
  (row.characterId as string).length > 0 &&
  typeof row.version === 'number' &&
  Number.isFinite(row.version)

const filterRowsForBatchImport = (
  batchType: UploadType,
  allRows: unknown[],
): Record<string, unknown>[] => {
  const rows = allRows.filter((r): r is Record<string, unknown> => r != null && typeof r === 'object')

  switch (batchType) {
    case 'music':
      return rows.filter(rowLooksLikeMusic)
    case 'avatar-accessory':
      return rows.filter(rowLooksLikeAvatarAccessory)
    case 'trophies':
      return rows.filter(rowLooksLikeTrophy)
    case 'system-voice':
      return rows.filter(rowLooksLikeSystemVoice)
    case 'map-icon':
    case 'name-plate':
      return rows.filter(rowLooksLikeBaseXmlPlateOrIcon)
    case 'character':
      return rows.filter(rowLooksLikeStaticCharacter)
    default:
      return rows as Record<string, unknown>[]
  }
}

// 获取难度名称
const getDifficultyName = (chartId: number) => {
  const difficultyMap: Record<number, string> = {
    0: 'BASIC',
    1: 'ADVANCED', 
    2: 'EXPERT',
    3: 'MASTER',
    4: 'ULTIMA',
    5: "WORLD'S END"
  }
  return difficultyMap[chartId] || `难度${chartId}`
}

// 获取难度标签类型
const getDifficultyTagType = (chartId: number) => {
  const typeMap: Record<number, string> = {
    0: 'success',   // BASIC - 绿色
    1: 'warning',   // ADVANCED - 橘黄色
    2: 'danger',    // EXPERT - 红色
    3: '',          // MASTER - 紫色（使用自定义样式）
    4: '',          // ULTIMA - 黑色+红色边框（使用自定义样式）
    5: ''           // WORLD'S END - 彩色（使用自定义样式）
  }
  return typeMap[chartId] || 'info'
}

// 获取难度自定义样式类
const getDifficultyCustomClass = (chartId: number) => {
  const classMap: Record<number, string> = {
    3: 'difficulty-master',     // MASTER - 紫色
    4: 'difficulty-ultima',     // ULTIMA - 黑色+红色边框
    5: 'difficulty-worlds-end'  // WORLD'S END - 彩色
  }
  return classMap[chartId] || ''
}

// 分页处理
const handlePageChange = (page: number) => {
  currentPage.value = page
}

// 判断是否有有效选择
const hasValidSelection = computed(() => {
  if (zipPreview.value?.detectedTypes && zipPreview.value.detectedTypes.length > 1) {
    return selectedTypesForProcessing.value.length > 0
  }
  return detectedType.value !== null || selectedTypesForProcessing.value.length > 0
})

// 转换统计数据为显示格式
const displayStats = computed(() => {
  return uploadDataTransform.transformStatsForDisplay(uploadStats.value)
})

// 获取上传统计
const fetchUploadStats = async () => {
  try {
    loading.value = true
    uploadStats.value = await uploadApi.getUploadStats()
  } catch (error: any) {
    ElMessage.error(error.message || '获取上传统计失败')
  } finally {
    loading.value = false
  }
}

const refreshStats = () => {
  fetchUploadStats()
}

const resetFilters = () => {
  selectedUploadType.value = ''
  searchQuery.value = ''
}

const handleTypeChange = (type: string | null) => {
  if (type) {
    uploadForm.type = type
  }
}

const viewTypeData = async () => {
  if (!selectedUploadType.value) return

  if (selectedUploadType.value === 'character-texture') {
    ElMessage.info('人物贴图（DDS）仅上传到 R2，数据库无可列表数据')
    return
  }

  const typeName = UPLOAD_TYPE_LABELS[selectedUploadType.value as UploadType]
  
  try {
    loading.value = true
    
    // 调用实际的数据列表API - 获取更多数据以便预览
    const result = await uploadApi.getDataList(
      selectedUploadType.value as UploadType, 
      1, 
      100 // 获取前100条用于预览
    )
    
    if (result.data.length === 0) {
      ElMessage.info(`${typeName}暂无数据`)
      return
    }
    
    // 将API数据转换为与上传预览相同的格式
    parseResult.value = {
      data: result.data,
      fileCount: 1, // 从数据库加载
      dataCount: result.total,
      errors: undefined
    }
    
    // 设置当前类型以便正确显示列表
    detectedType.value = selectedUploadType.value as UploadType
    selectedTypesForProcessing.value = [selectedUploadType.value as UploadType]
    
    // 重置分页
    currentPage.value = 1
    
    ElMessage.success(`加载了 ${result.data.length} 条 ${typeName} 数据`)
  } catch (error: any) {
    ElMessage.error(error.message || '查看数据失败')
  } finally {
    loading.value = false
  }
}

const clearTypeData = async () => {
  if (!selectedUploadType.value) return

  if (selectedUploadType.value === 'character-texture') {
    ElMessage.info('人物贴图（DDS）无数据库表；如需删除云端文件请到存储控制台操作')
    return
  }
  
  const typeName = UPLOAD_TYPE_LABELS[selectedUploadType.value as UploadType]
  
  try {
    await ElMessageBox.confirm(
      `确定要清空所有 ${typeName} 数据吗？此操作不可恢复！`,
      '确认清空',
      {
        confirmButtonText: '清空',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    await uploadApi.clearData(selectedUploadType.value as UploadType)
    ElMessage.success(`${typeName} 数据清空成功`)
    fetchUploadStats()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '清空失败')
    }
  }
}

// 处理文件拖拽
const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = false
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = false
  
  const files = Array.from(e.dataTransfer?.files || [])
  processSelectedFiles(files)
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files || [])
  processSelectedFiles(files)
}

// 处理选择的文件
const processSelectedFiles = async (files: File[]) => {
  const newFiles: File[] = []

  for (const file of files) {
    // 验证文件
    const sizeValidation = fileValidator.validateFileSize(file)
    if (!sizeValidation.valid) {
      ElMessage.error(`${file.name}: ${sizeValidation.error}`)
      continue
    }

    const nameValidation = fileValidator.validateFileName(file.name)
    if (!nameValidation.valid) {
      ElMessage.error(`${file.name}: ${nameValidation.error}`)
      continue
    }

    // 检查是否为压缩包
    if (file.name.toLowerCase().endsWith('.zip')) {
      try {
        // 验证是否为游戏数据压缩包格式
        if (!uploadApi.isValidGameDataZip(file.name)) {
          ElMessage.info(`${file.name}: 检测到游戏数据压缩包`)
        }

        const preview = await uploadApi.previewZipFile(file)
        zipPreview.value = preview
        
        if (preview.detectedTypes && preview.detectedTypes.length > 0) {
          if (preview.detectedTypes.length === 1) {
            detectedType.value = preview.detectedTypes[0]
            selectedTypesForProcessing.value = [preview.detectedTypes[0]]
            ElMessage.success(`检测到: ${UPLOAD_TYPE_LABELS[preview.detectedTypes[0]]}`)
          } else {
            detectedType.value = null
            selectedTypesForProcessing.value = []
            ElMessage.info(`检测到 ${preview.detectedTypes.length} 种数据类型，请选择要处理的类型`)
          }
        }
        
        if (preview.hasValidFiles) {
          ElMessage.success(`发现 ${preview.totalCount} 个文件`)
        } else {
          ElMessage.warning(`未发现有效的 XML 文件`)
        }
      } catch (error: any) {
        ElMessage.error(`解析压缩包失败: ${error.message}`)
        continue
      }
    }

    newFiles.push(file)
  }

  selectedFiles.value.push(...newFiles)

  // 对于非压缩包文件，进行自动检测
  if (newFiles.length > 0 && !zipPreview.value) {
    try {
      const detection = await uploadApi.detectFilesType(newFiles)
      fileTypeMap.value = detection.fileTypeMap
      
      if (detection.conflictingTypes.length > 1) {
        conflictingTypes.value = detection.conflictingTypes
        detectedType.value = null
        selectedTypesForProcessing.value = []
        ElMessage.warning(`检测到多种数据类型，请手动选择要处理的类型`)
      } else if (detection.detectedType) {
        detectedType.value = detection.detectedType
        selectedTypesForProcessing.value = [detection.detectedType]
        conflictingTypes.value = []
        ElMessage.success(`自动检测到数据类型: ${UPLOAD_TYPE_LABELS[detection.detectedType]}`)
      } else {
        ElMessage.warning('无法自动检测文件类型，请确认文件格式正确')
      }
    } catch (error: any) {
      ElMessage.warning('文件类型自动检测失败，但文件已添加')
    }
  }

  if (newFiles.length > 0) {
    ElMessage.success(`成功添加 ${newFiles.length} 个文件`)
  }
}

// 移除文件
const removeFile = (index: number) => {
  const removedFile = selectedFiles.value[index]
  selectedFiles.value.splice(index, 1)
  fileTypeMap.value.delete(removedFile)
  
  if (selectedFiles.value.length === 0) {
    zipPreview.value = null
    detectedType.value = null
    conflictingTypes.value = []
    selectedTypesForProcessing.value = []
    fileTypeMap.value.clear()
  } else {
    // 重新检测剩余文件的类型
    uploadApi.detectFilesType(selectedFiles.value).then(detection => {
      fileTypeMap.value = detection.fileTypeMap
      if (detection.conflictingTypes.length > 1) {
        conflictingTypes.value = detection.conflictingTypes
        detectedType.value = null
        selectedTypesForProcessing.value = []
      } else {
        detectedType.value = detection.detectedType
        selectedTypesForProcessing.value = detection.detectedType ? [detection.detectedType] : []
        conflictingTypes.value = []
      }
    }).catch(() => {
      // 静默：类型检测失败时已展示 ElMessage / 或由后续操作报错
    })
  }
}

// 清除解析结果
const clearParseResult = () => {
  parseResult.value = null
  currentPage.value = 1 // 重置分页
}

// 开始上传和解析
const startUpload = async () => {
  const typesToProcess = selectedTypesForProcessing.value.length > 0 
    ? selectedTypesForProcessing.value 
    : (detectedType.value ? [detectedType.value] : [])
  
  if (typesToProcess.length === 0 || selectedFiles.value.length === 0) {
    ElMessage.warning('请选择文件和数据类型')
    return
  }

  try {
    uploading.value = true
    uploadProgress.value = 0
    uploadingPhase.value = '开始处理...'

    // 模拟上传进度
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 80) {
        uploadProgress.value += Math.random() * 10
      }
    }, 200)

    // 处理多个类型
    const allResults: any[] = []
    let totalFileCount = 0
    let totalDataCount = 0
    const allErrors: string[] = []
    const allUploadedAssets: UploadedAssetDto[] = []
    const allUploadErrors: string[] = []
    
    for (const currentType of typesToProcess) {
      uploadingPhase.value = `解析 ${UPLOAD_TYPE_LABELS[currentType]}...`
      
      try {
        const result = await uploadApi.uploadFiles(currentType, selectedFiles.value)
        
        if (result.data && result.data.data) {
          allResults.push(...result.data.data)
          totalFileCount += result.data.fileCount || 0
          totalDataCount += result.data.dataCount || 0
          if (result.data.errors && result.data.errors.length > 0) {
            allErrors.push(...result.data.errors)
          }
          if (result.data.uploadedAssets?.length) {
            allUploadedAssets.push(...result.data.uploadedAssets)
          }
          if (result.data.uploadErrors?.length) {
            allUploadErrors.push(...result.data.uploadErrors)
          }
        }
      } catch (error: any) {
        allErrors.push(`${UPLOAD_TYPE_LABELS[currentType]} 处理失败: ${error.message}`)
      }
    }

    clearInterval(progressInterval)
    uploadProgress.value = 100
    uploadingPhase.value = '处理完成'

    // 合并所有结果
    parseResult.value = {
      data: allResults,
      fileCount: totalFileCount,
      dataCount: totalDataCount,
      errors: allErrors.length > 0 ? allErrors : undefined,
      uploadedAssets: allUploadedAssets.length > 0 ? allUploadedAssets : undefined,
      uploadErrors: allUploadErrors.length > 0 ? allUploadErrors : undefined
    }
    
    // 更新处理类型信息
    if (selectedTypesForProcessing.value.length === 0 && detectedType.value) {
      selectedTypesForProcessing.value = [detectedType.value]
    }
    
    const processedTypes = typesToProcess.map(type => UPLOAD_TYPE_LABELS[type]).join(', ')
    let doneMsg = `处理完成: ${processedTypes}，共解析 ${totalDataCount} 条数据`
    if (allUploadedAssets.length > 0) {
      doneMsg += `，R2 已写入 ${allUploadedAssets.length} 个文件`
    }
    if (allUploadErrors.length > 0) {
      doneMsg += `（${allUploadErrors.length} 条上传告警）`
    }
    ElMessage.success(doneMsg)
    
    showUploadDialog.value = false
    selectedFiles.value = []
    zipPreview.value = null
    detectedType.value = null
    conflictingTypes.value = []
    fileTypeMap.value.clear()
    currentPage.value = 1 // 重置分页
  } catch (error: any) {
    ElMessage.error(error.message || '处理失败')
  } finally {
    uploading.value = false
    setTimeout(() => {
      uploadProgress.value = 0
      uploadingPhase.value = ''
    }, 1000)
  }
}

// 导入解析后的数据
const importParsedData = async () => {
  const typesToProcess = selectedTypesForProcessing.value.length > 0 
    ? selectedTypesForProcessing.value 
    : (detectedType.value ? [detectedType.value] : [])
  
  if (!parseResult.value || typesToProcess.length === 0) {
    ElMessage.warning('没有可导入的数据')
    return
  }

  try {
    importing.value = true
    
    const importResults: string[] = []
    
    for (const currentType of typesToProcess) {
      try {
        if (currentType === 'character-texture') {
          importResults.push(
            `${UPLOAD_TYPE_LABELS[currentType]}: 已完成解析/R2 同步（不入库）`,
          )
          continue
        }
        // 音乐数据需要传递版本号
        const version = currentType === 'music' ? musicVersion.value : undefined
        const rows = filterRowsForBatchImport(currentType, parseResult.value!.data)
        const result = await uploadApi.batchImport(currentType, rows, version)
        importResults.push(`${UPLOAD_TYPE_LABELS[currentType]}: 成功${result.data.success}条`)
      } catch (error: any) {
        importResults.push(`${UPLOAD_TYPE_LABELS[currentType]}: 失败 - ${error.message}`)
      }
    }
    
    ElMessage.success(`导入完成: ${importResults.join(', ')}`)
    parseResult.value = null
    selectedTypesForProcessing.value = []
    fetchUploadStats()
  } catch (error: any) {
    ElMessage.error(error.message || '导入失败')
  } finally {
    importing.value = false
  }
}

// 取消上传
const cancelUpload = () => {
  showUploadDialog.value = false
  selectedFiles.value = []
  zipPreview.value = null
  detectedType.value = null
  conflictingTypes.value = []
  selectedTypesForProcessing.value = []
  fileTypeMap.value.clear()
  uploadProgress.value = 0
  uploadingPhase.value = ''
}
</script>

<style scoped>
/* 自定义样式 */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 难度标签自定义样式 */
.difficulty-master {
  background-color: #9333ea !important;
  border-color: #9333ea !important;
  color: white !important;
}

.difficulty-ultima {
  background-color: #000000 !important;
  border: 2px solid #ef4444 !important;
  color: white !important;
  font-weight: bold;
}

.difficulty-worlds-end {
  background: linear-gradient(45deg, #ff0000, #ff8000, #ffff00, #00ff00, #0080ff, #8000ff) !important;
  border: none !important;
  color: white !important;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
  animation: rainbow-pulse 2s ease-in-out infinite alternate;
}

@keyframes rainbow-pulse {
  0% {
    background: linear-gradient(45deg, #ff0000, #ff8000, #ffff00, #00ff00, #0080ff, #8000ff);
    transform: scale(1);
  }
  100% {
    background: linear-gradient(45deg, #8000ff, #ff0000, #ff8000, #ffff00, #00ff00, #0080ff);
    transform: scale(1.05);
  }
}

/* 暗色主题下的难度标签调整 */
.dark .difficulty-master {
  background-color: #a855f7 !important;
  border-color: #a855f7 !important;
}

.dark .difficulty-ultima {
  background-color: #1f1f1f !important;
  border: 2px solid #f87171 !important;
}
</style>