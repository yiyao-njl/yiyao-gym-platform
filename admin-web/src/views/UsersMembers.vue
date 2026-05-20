<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">用户与会员</h1>
        <p class="page-subtitle">管理小程序用户、会员等级、经验值、优惠券和异常账号状态。</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openLevelDialog">配置会员等级</el-button>
    </div>

    <div class="toolbar">
      <el-input v-model="keyword" class="w-220" clearable placeholder="昵称/手机号" />
      <el-select v-model="level" class="w-220" clearable placeholder="会员等级">
        <el-option v-for="item in levelOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-select v-model="status" class="w-160" clearable placeholder="状态">
        <el-option label="正常" value="正常" />
        <el-option label="禁用" value="禁用" />
      </el-select>
      <el-button type="primary" :icon="Search">查询</el-button>
      <el-button :icon="Refresh" @click="reset">重置</el-button>
    </div>

    <div class="panel">
      <el-table :data="filtered" stripe>
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="level" label="会员等级" min-width="150" />
        <el-table-column prop="points" label="经验值" width="100" />
        <el-table-column prop="coupons" label="优惠券" width="100" />
        <el-table-column prop="registeredAt" label="注册时间" width="130" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><el-tag :type="statusType(row.status)">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <span class="table-actions">
              <el-button link type="primary" @click="view(row)">订单</el-button>
              <el-button link type="primary" @click="view(row)">积分</el-button>
              <el-button link type="primary" @click="view(row)">评价</el-button>
              <el-button link :type="row.status === '禁用' ? 'success' : 'danger'" @click="toggle(row)">{{ row.status === '禁用' ? '恢复' : '禁用' }}</el-button>
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="two-col">
      <div class="panel">
        <div class="panel-title">会员权益</div>
        <el-table :data="benefits">
          <el-table-column prop="level" label="等级" width="140" />
          <el-table-column prop="growth" label="成长值规则" width="150" />
          <el-table-column prop="discount" label="折扣" width="100" />
          <el-table-column prop="rights" label="权益说明" />
        </el-table>
      </div>
      <div class="panel">
        <div class="panel-title">用户运营摘要</div>
        <div class="mini-stat"><span>注册用户</span><strong>{{ userSummary.totalUsers || 0 }}</strong></div>
        <div class="mini-stat"><span>会员用户</span><strong>{{ userSummary.memberUsers || 0 }}</strong></div>
        <div class="mini-stat"><span>本月新增</span><strong>{{ userSummary.monthNewUsers || 0 }}</strong></div>
        <div class="mini-stat"><span>异常账号</span><el-tag type="danger">{{ userSummary.abnormalUsers || 0 }}</el-tag></div>
      </div>
    </div>

    <el-dialog v-model="levelVisible" title="会员等级配置" width="820px">
      <el-table :data="editLevelRows">
        <el-table-column label="等级" width="130">
          <template #default="{ row }">{{ levelDisplay(row.levelCode) }} {{ row.name }}</template>
        </el-table-column>
        <el-table-column label="成长值下限" width="150">
          <template #default="{ row }">
            <el-input-number v-model="row.minPoints" class="level-number" :min="0" :precision="0" :step="100" :disabled="row.levelCode === 'LV1'" controls-position="right" />
          </template>
        </el-table-column>
        <el-table-column label="折扣比例" width="150">
          <template #default="{ row }">
            <el-input-number v-model="row.discountRate" class="level-number" :min="1" :max="100" :precision="0" :step="5" controls-position="right" />
          </template>
        </el-table-column>
        <el-table-column label="权益">
          <template #default="{ row }">
            <el-input v-model="row.benefits" maxlength="500" show-word-limit />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="levelVisible = false">关闭</el-button>
        <el-button type="primary" :loading="savingLevels" @click="save">保存配置</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh, Search } from '@element-plus/icons-vue';
import { adminApi, records } from '../api/modules';
import { statusType } from '../utils/status';

const keyword = ref('');
const users = ref([]);
const userSummary = ref({});
const memberLevels = ref([]);
const editLevelRows = ref([]);
const level = ref('');
const status = ref('');
const levelVisible = ref(false);
const savingLevels = ref(false);

const filtered = computed(() => users.value.filter((item) => (!keyword.value || String(item.nickname || '').includes(keyword.value) || String(item.phone || '').includes(keyword.value)) && (!level.value || item.level === level.value) && (!status.value || item.status === status.value)));
const sortedMemberLevels = computed(() => [...memberLevels.value].sort((a, b) => Number(a.minPoints) - Number(b.minPoints)));
const levelOptions = computed(() => sortedMemberLevels.value.map((item) => {
  const label = `${levelDisplay(item.levelCode)} ${item.name}`;
  return { label, value: label };
}));
const benefits = computed(() => sortedMemberLevels.value.map((item, index, rows) => ({
  level: `${levelDisplay(item.levelCode)} ${item.name}`,
  growth: formatGrowth(item, rows[index + 1]),
  discount: formatDiscount(item.discountRate),
  rights: item.benefits
})));

function reset() {
  keyword.value = '';
  level.value = '';
  status.value = '';
}

function view(row) {
  ElMessage.info(`查看 ${row.nickname} 的关联数据`);
}

function toggle(row) {
  ElMessageBox.confirm(`${row.status === '禁用' ? '恢复' : '禁用'}用户 ${row.nickname}？`, '账号状态确认', { type: 'warning' }).then(() => ElMessage.success('状态已更新'));
}

function openLevelDialog() {
  editLevelRows.value = sortedMemberLevels.value.map((item) => ({
    levelCode: item.levelCode,
    name: item.name,
    minPoints: Number(item.minPoints),
    discountRate: Number(item.discountRate),
    benefits: item.benefits || ''
  }));
  levelVisible.value = true;
}

async function save() {
  const payload = editLevelRows.value.map((item) => ({
    levelCode: item.levelCode,
    name: item.name,
    minPoints: Number(item.minPoints),
    discountRate: Number(item.discountRate),
    benefits: String(item.benefits || '').trim()
  }));
  const message = validateLevels(payload);
  if (message) {
    ElMessage.warning(message);
    return;
  }
  savingLevels.value = true;
  try {
    memberLevels.value = normalizeLevels(await adminApi.updateMembers(payload));
    levelVisible.value = false;
    ElMessage.success('会员配置已保存');
  } finally {
    savingLevels.value = false;
  }
}

async function loadUsers() {
  try {
    const [userData, summaryData] = await Promise.all([adminApi.users(), adminApi.userSummary()]);
    users.value = records(userData);
    userSummary.value = summaryData || {};
  } catch (error) {
    users.value = [];
    userSummary.value = {};
  }
}

async function loadMembers() {
  try {
    memberLevels.value = normalizeLevels(await adminApi.members());
  } catch (error) {
    memberLevels.value = [];
  }
}

function normalizeLevels(payload) {
  return records(payload).map((item) => ({
    levelCode: item.levelCode,
    name: item.name,
    minPoints: Number(item.minPoints),
    discountRate: Number(item.discountRate),
    benefits: item.benefits || ''
  }));
}

function validateLevels(rows) {
  if (rows.length !== 3) return '会员等级必须且只能配置 3 条';
  const byCode = new Map(rows.map((item) => [item.levelCode, item]));
  if (!byCode.has('LV1') || !byCode.has('LV2') || !byCode.has('LV3')) return '会员等级编码必须为 LV1、LV2、LV3';
  if (byCode.get('LV1').minPoints !== 0) return 'LV1 成长值下限必须为 0';
  if (!(byCode.get('LV1').minPoints < byCode.get('LV2').minPoints && byCode.get('LV2').minPoints < byCode.get('LV3').minPoints)) return '会员等级成长值下限必须递增';
  if (rows.some((item) => !item.name || !item.benefits)) return '会员等级名称和权益说明不能为空';
  if (rows.some((item) => item.discountRate < 1 || item.discountRate > 100)) return '折扣比例必须在 1 到 100 之间';
  return '';
}

function levelDisplay(levelCode) {
  return { LV1: 'LV.1', LV2: 'LV.2', LV3: 'LV.3' }[levelCode] || levelCode;
}

function formatGrowth(item, nextItem) {
  const start = Number(item.minPoints);
  if (!nextItem) return `${start}+`;
  return `${start}-${Number(nextItem.minPoints) - 1}`;
}

function formatDiscount(discountRate) {
  const rate = Number(discountRate);
  if (rate >= 100) return '无';
  return `${rate / 10}折`;
}

onMounted(() => {
  loadUsers();
  loadMembers();
});
</script>

<style scoped>
.level-number {
  width: 120px;
}
</style>
