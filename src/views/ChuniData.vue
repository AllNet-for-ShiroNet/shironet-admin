<template>
  <div class="space-y-4 sm:space-y-6 px-2 sm:px-0">
    <!-- 返回按钮和标题 -->
    <div :class="[
      'p-4 sm:p-6 rounded-lg border',
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    ]">
      <div class="flex items-center space-x-4 mb-4">
        <el-button @click="goBack" circle>
          <span class="material-icons">arrow_back</span>
        </el-button>
        <div>
          <h2 :class="[
            'text-xl sm:text-2xl font-bold',
            isDark ? 'text-white' : 'text-gray-900'
          ]">用户数据详情</h2>
          <p :class="[
            'text-xs sm:text-sm mt-1',
            isDark ? 'text-gray-400' : 'text-gray-500'
          ]">用户ID: {{ userId }}</p>
        </div>
      </div>

      <!-- 数据切换标签 -->
      <el-tabs v-model="activeTab" class="mt-4">
        <el-tab-pane label="玩家档案" name="profile">
          <div v-if="loading" class="flex justify-center py-12">
            <el-icon class="is-loading"><span class="material-icons">loading</span></el-icon>
          </div>
          <div v-else-if="!chuniData.profile" class="text-center py-12">
            <p :class="[
              'text-base',
              isDark ? 'text-gray-400' : 'text-gray-500'
            ]">暂无档案数据</p>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <!-- 基本信息卡片 -->
            <div :class="[
              'p-4 rounded-lg border col-span-full',
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
            ]">
              <h3 :class="[
                'text-lg font-semibold mb-4',
                isDark ? 'text-white' : 'text-gray-900'
              ]">基本信息</h3>
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <InfoItem label="玩家名称" :value="chuniData.profile.playerName" />
                <InfoItem label="等级" :value="chuniData.profile.level.toString()" />
                <InfoItem label="Rating" :value="chuniData.profile.playerRating.toString()" />
                <InfoItem label="最高Rating" :value="chuniData.profile.highestRating.toString()" />
                <InfoItem label="游玩次数" :value="chuniData.profile.playCount.toString()" />
                <InfoItem label="总积分" :value="formatNumber(chuniData.profile.totalPoint)" />
                <InfoItem label="好友数" :value="chuniData.profile.friendCount.toString()" />
                <InfoItem label="最后游玩" :value="chuniData.profile.lastPlayDate || '未记录'" />
              </div>
            </div>

            <!-- 游戏统计卡片 -->
            <div :class="[
              'p-4 rounded-lg border',
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
            ]">
              <h3 :class="[
                'text-lg font-semibold mb-4',
                isDark ? 'text-white' : 'text-gray-900'
              ]">难度统计</h3>
              <div class="space-y-3">
                <InfoItem label="BASIC总分" :value="chuniData.profile.totalBasicHighScore?.toString() || '0'" />
                <InfoItem label="EXPERT总分" :value="chuniData.profile.totalExpertHighScore?.toString() || '0'" />
                <InfoItem label="MASTER总分" :value="chuniData.profile.totalMasterHighScore?.toString() || '0'" />
                <InfoItem label="达成谱面数" :value="chuniData.profile.totalRepertoireCount?.toString() || '0'" />
              </div>
            </div>

            <!-- 网战统计卡片 -->
            <div :class="[
              'p-4 rounded-lg border',
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
            ]">
              <h3 :class="[
                'text-lg font-semibold mb-4',
                isDark ? 'text-white' : 'text-gray-900'
              ]">对战统计</h3>
              <div class="space-y-3">
                <InfoItem label="对战次数" :value="chuniData.profile.netBattlePlayCount.toString()" />
                <InfoItem label="胜利次数" :value="chuniData.profile.netBattleWinCount.toString()" />
                <InfoItem label="失败次数" :value="chuniData.profile.netBattleLoseCount.toString()" />
                <InfoItem label="胜率" :value="calculateWinRate() + '%'" />
              </div>
            </div>

            <!-- 外观设置卡片 -->
            <div :class="[
              'p-4 rounded-lg border',
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
            ]">
              <div class="flex items-center justify-between mb-4">
                <h3 :class="[
                  'text-lg font-semibold',
                  isDark ? 'text-white' : 'text-gray-900'
                ]">外观设置</h3>
                <el-button size="small" @click="showEditAppearanceDialog = true">
                  <span class="material-icons text-sm mr-1">edit</span>
                  编辑
                </el-button>
              </div>
              <div class="space-y-3">
                <InfoItem label="角色ID" :value="chuniData.profile.characterId?.toString() || '未设置'" />
                <InfoItem label="名牌ID" :value="chuniData.profile.nameplateId?.toString() || '未设置'" />
                <InfoItem label="地图图标ID" :value="chuniData.profile.mapIconId?.toString() || '未设置'" />
                <InfoItem label="系统语音ID" :value="chuniData.profile.voiceId?.toString() || '未设置'" />
                <InfoItem label="舞台ID" :value="chuniData.profile.stageId?.toString() || '未设置'" />
                <InfoItem label="队伍ID" :value="chuniData.profile.teamId?.toString() || '未加入'" />
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="最佳成绩" name="scores">
          <div v-if="loading" class="flex justify-center py-12">
            <el-icon class="is-loading"><span class="material-icons">loading</span></el-icon>
          </div>
          <div v-else-if="chuniData.scores.length === 0" class="text-center py-12">
            <p :class="[
              'text-base',
              isDark ? 'text-gray-400' : 'text-gray-500'
            ]">暂无成绩数据</p>
          </div>
          <div v-else class="mt-4">
            <!-- 成绩列表 -->
            <div :class="[
              'rounded-lg border overflow-hidden',
              isDark ? 'border-gray-700' : 'border-gray-200'
            ]">
              <el-table :data="chuniData.scores" stripe :class="isDark ? 'dark-table' : ''">
                <el-table-column prop="musicId" label="乐曲ID" width="100" />
                <el-table-column prop="level" label="难度等级" width="100" />
                <el-table-column prop="scoreMax" label="最高分" width="120">
                  <template #default="scope">
                    <span :class="[
                      'font-mono font-semibold',
                      isDark ? 'text-white' : 'text-gray-900'
                    ]">{{ scope.row.scoreMax.toLocaleString() }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="playCount" label="游玩次数" width="100" />
                <el-table-column prop="maxComboCount" label="最大Combo" width="100" />
                <el-table-column prop="missCount" label="Miss数" width="80" />
                <el-table-column label="达成" width="120">
                  <template #default="scope">
                    <div class="flex gap-1">
                      <el-tag v-if="scope.row.isFullCombo" size="small" type="success">FC</el-tag>
                      <el-tag v-if="scope.row.isAllJustice" size="small" type="warning">AJ</el-tag>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="100" fixed="right">
                  <template #default="scope">
                    <el-button
                      size="small"
                      type="primary"
                      @click="openEditScoreDialog(scope.row)"
                    >
                      <span class="material-icons text-sm">edit</span>
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="企鹅道具" name="penguins">
          <div v-if="loading" class="flex justify-center py-12">
            <el-icon class="is-loading"><span class="material-icons">loading</span></el-icon>
          </div>
          <div v-else-if="chuniData.penguins.length === 0" class="text-center py-12">
            <p :class="[
              'text-base',
              isDark ? 'text-gray-400' : 'text-gray-500'
            ]">该用户暂无企鹅道具</p>
          </div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div
              v-for="penguin in chuniData.penguins"
              :key="penguin.id"
              :class="[
                'p-4 sm:p-6 rounded-lg border text-center',
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              ]"
            >
              <div class="mb-3">
                <span class="material-icons text-5xl" :class="getPenguinColor(penguin.itemId)">
                  pets
                </span>
              </div>
              <h4 :class="[
                'text-base sm:text-lg font-semibold mb-2',
                isDark ? 'text-white' : 'text-gray-900'
              ]">{{ penguin.itemName }}</h4>
              <div class="space-y-2">
                <div :class="[
                  'flex justify-between text-sm',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                ]">
                  <span>道具ID:</span>
                  <span>{{ penguin.itemId }}</span>
                </div>
                <div :class="[
                  'flex justify-between text-sm',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                ]">
                  <span>持有数量:</span>
                  <span :class="[
                    'font-semibold text-base',
                    isDark ? 'text-white' : 'text-gray-900'
                  ]">{{ penguin.stock }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 编辑外观设置对话框 -->
    <el-dialog
      v-model="showEditAppearanceDialog"
      title="编辑外观设置"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="appearanceForm" label-width="120px">
        <el-form-item label="角色ID">
          <el-input-number v-model="appearanceForm.characterId" :min="0" controls-position="right" class="w-full" />
        </el-form-item>
        <el-form-item label="名牌ID">
          <el-input-number v-model="appearanceForm.nameplateId" :min="0" controls-position="right" class="w-full" />
        </el-form-item>
        <el-form-item label="地图图标ID">
          <el-input-number v-model="appearanceForm.mapIconId" :min="0" controls-position="right" class="w-full" />
        </el-form-item>
        <el-form-item label="系统语音ID">
          <el-input-number v-model="appearanceForm.voiceId" :min="0" controls-position="right" class="w-full" />
        </el-form-item>
        <el-form-item label="舞台ID">
          <el-input-number v-model="appearanceForm.stageId" :min="0" controls-position="right" class="w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditAppearanceDialog = false">取消</el-button>
        <el-button type="primary" @click="saveAppearance" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 编辑成绩对话框 -->
    <el-dialog
      v-model="showEditScoreDialog"
      title="编辑成绩"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="scoreForm" label-width="120px">
        <el-form-item label="乐曲ID">
          <el-input-number v-model="scoreForm.musicId" :min="0" controls-position="right" class="w-full" disabled />
        </el-form-item>
        <el-form-item label="难度等级">
          <el-input-number v-model="scoreForm.level" :min="0" controls-position="right" class="w-full" disabled />
        </el-form-item>
        <el-form-item label="最高分">
          <el-input-number v-model="scoreForm.scoreMax" :min="0" :max="1010000" controls-position="right" class="w-full" />
        </el-form-item>
        <el-form-item label="游玩次数">
          <el-input-number v-model="scoreForm.playCount" :min="0" controls-position="right" class="w-full" />
        </el-form-item>
        <el-form-item label="最大Combo">
          <el-input-number v-model="scoreForm.maxComboCount" :min="0" controls-position="right" class="w-full" />
        </el-form-item>
        <el-form-item label="Miss数">
          <el-input-number v-model="scoreForm.missCount" :min="0" controls-position="right" class="w-full" />
        </el-form-item>
        <el-form-item label="Full Combo">
          <el-switch v-model="scoreForm.isFullCombo" />
        </el-form-item>
        <el-form-item label="All Justice">
          <el-switch v-model="scoreForm.isAllJustice" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditScoreDialog = false">取消</el-button>
        <el-button type="primary" @click="saveScore" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineComponent, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { chuniApi, type UserChuniData } from '@/api/chuni'
import { useTheme } from '@/composables/useTheme'

const route = useRoute()
const router = useRouter()
const { isDark } = useTheme()

const userId = ref<number>(parseInt(route.params.id as string))
const activeTab = ref('profile')
const loading = ref(true)
const saving = ref(false)
const showEditAppearanceDialog = ref(false)
const showEditScoreDialog = ref(false)
const chuniData = ref<UserChuniData>({
  profile: null,
  scores: [],
  penguins: []
})

// 外观设置表单
const appearanceForm = ref({
  characterId: 0,
  nameplateId: 0,
  mapIconId: 0,
  voiceId: 0,
  stageId: 0
})

// 成绩表单
const scoreForm = ref({
  id: 0,
  musicId: 0,
  level: 0,
  scoreMax: 0,
  playCount: 0,
  maxComboCount: 0,
  missCount: 0,
  isFullCombo: false,
  isAllJustice: false
})

// 计算属性
const fullComboCount = computed(() => chuniData.value.scores.filter(s => s.isFullCombo).length)
const allJusticeCount = computed(() => chuniData.value.scores.filter(s => s.isAllJustice).length)
const maxScore = computed(() => {
  if (chuniData.value.scores.length === 0) return 0
  return Math.max(...chuniData.value.scores.map(s => s.scoreMax))
})

// 方法
const goBack = () => {
  router.back()
}

const formatNumber = (num: number | undefined) => {
  if (!num) return '0'
  return num.toLocaleString()
}

const calculateWinRate = () => {
  const profile = chuniData.value.profile
  if (!profile || profile.netBattlePlayCount === 0) return 0
  return ((profile.netBattleWinCount / profile.netBattlePlayCount) * 100).toFixed(1)
}

const getPenguinColor = (itemId: number) => {
  const colors: Record<number, string> = {
    8000: 'text-yellow-500',
    8010: 'text-gray-400',
    8020: 'text-purple-500',
    8030: 'text-blue-400'
  }
  return colors[itemId] || 'text-gray-500'
}

const loadUserData = async () => {
  loading.value = true
  try {
    const data = await chuniApi.getUserChuniData(userId.value)
    chuniData.value = data

    // 初始化外观设置表单
    if (data.profile) {
      appearanceForm.value = {
        characterId: data.profile.characterId || 0,
        nameplateId: data.profile.nameplateId || 0,
        mapIconId: data.profile.mapIconId || 0,
        voiceId: data.profile.voiceId || 0,
        stageId: data.profile.stageId || 0
      }
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '加载数据失败')
  } finally {
    loading.value = false
  }
}

// 打开编辑成绩对话框
const openEditScoreDialog = (score: any) => {
  scoreForm.value = {
    id: score.id,
    musicId: score.musicId,
    level: score.level,
    scoreMax: score.scoreMax,
    playCount: score.playCount,
    maxComboCount: score.maxComboCount,
    missCount: score.missCount,
    isFullCombo: score.isFullCombo,
    isAllJustice: score.isAllJustice
  }
  showEditScoreDialog.value = true
}

// 保存外观设置
const saveAppearance = async () => {
  saving.value = true
  try {
    const updateData = {
      characterId: appearanceForm.value.characterId || undefined,
      nameplateId: appearanceForm.value.nameplateId || undefined,
      mapIconId: appearanceForm.value.mapIconId || undefined,
      voiceId: appearanceForm.value.voiceId || undefined,
      stageId: appearanceForm.value.stageId || undefined
    }

    const updatedProfile = await chuniApi.updateUserProfile(userId.value, updateData)
    chuniData.value.profile = updatedProfile

    ElMessage.success('外观设置更新成功')
    showEditAppearanceDialog.value = false
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '更新失败')
  } finally {
    saving.value = false
  }
}

// 保存成绩
const saveScore = async () => {
  saving.value = true
  try {
    const updateData = {
      scoreMax: scoreForm.value.scoreMax,
      playCount: scoreForm.value.playCount,
      maxComboCount: scoreForm.value.maxComboCount,
      missCount: scoreForm.value.missCount,
      isFullCombo: scoreForm.value.isFullCombo,
      isAllJustice: scoreForm.value.isAllJustice
    }

    const updatedScore = await chuniApi.updateUserScore(
      userId.value,
      scoreForm.value.id,
      updateData
    )

    // 更新列表中的成绩
    const index = chuniData.value.scores.findIndex(s => s.id === scoreForm.value.id)
    if (index !== -1) {
      chuniData.value.scores[index] = updatedScore
    }

    ElMessage.success('成绩更新成功')
    showEditScoreDialog.value = false
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '更新失败')
  } finally {
    saving.value = false
  }
}

// 信息项组件
const InfoItem = defineComponent({
  props: {
    label: String,
    value: String
  },
  setup(props) {
    return () => h('div', { class: 'flex justify-between items-center py-2' }, [
      h('span', {
        class: ['text-sm flex-shrink-0', isDark.value ? 'text-gray-400' : 'text-gray-500']
      }, `${props.label}:`),
      h('span', {
        class: ['text-sm font-medium text-right truncate ml-2', isDark.value ? 'text-white' : 'text-gray-900']
      }, props.value)
    ])
  }
})

onMounted(() => {
  loadUserData()
})
</script>

<style scoped>
.dark-table {
  background-color: #1f2937;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table th.el-table__cell) {
  background-color: var(--el-table-bg-color);
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background-color: var(--el-fill-color-lighter);
}

@media (max-width: 640px) {
  :deep(.el-table) {
    font-size: 12px;
  }

  :deep(.el-table .cell) {
    padding-left: 8px;
    padding-right: 8px;
  }
}
</style>
