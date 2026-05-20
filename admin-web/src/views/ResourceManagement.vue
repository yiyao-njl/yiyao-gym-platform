<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">门店与场地资源</h1>
        <p class="page-subtitle">管理门店、场地状态、营业时间和套餐价格，优先对接 `/api/admin/stores` 与 `/api/admin/venues`。</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openDialog('store')">新增门店</el-button>
    </div>

    <div class="toolbar">
      <el-input v-model="keyword" class="w-220" clearable placeholder="门店/场地关键词" />
      <el-select v-model="sport" class="w-160" clearable placeholder="运动类型">
        <el-option v-for="item in sports" :key="item" :label="item" :value="item" />
      </el-select>
      <el-select v-model="status" class="w-160" clearable placeholder="状态">
        <el-option v-for="item in currentStatuses" :key="item" :label="item" :value="item" />
      </el-select>
      <el-button type="primary" :icon="Search">查询</el-button>
      <el-button :icon="Refresh" @click="reset">重置</el-button>
    </div>

    <el-tabs v-model="active" class="tab-panel">
      <el-tab-pane label="门店管理" name="stores">
        <el-table :data="filteredStores" stripe>
          <el-table-column prop="name" label="门店名称" min-width="160" />
          <el-table-column prop="city" label="城市" width="90" />
          <el-table-column prop="address" label="地址" min-width="220" />
          <el-table-column prop="phone" label="联系电话" width="140" />
          <el-table-column prop="manager" label="店长" width="110" />
          <el-table-column label="营业时间" min-width="180">
            <template #default="{ row }">{{ formatBusinessHours(row.hours) }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }"><el-tag :type="statusType(row.status)">{{ row.status }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <span class="table-actions">
                <el-button link type="primary" @click="editRow('store', row)">编辑</el-button>
                <el-button link type="primary" @click="configureHours(row)">营业时间</el-button>
                <el-button link type="warning" @click="changeStoreStatus(row, '休息中')">休息</el-button>
                <el-button link type="danger" @click="changeStoreStatus(row, '停用')">停用</el-button>
              </span>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="场地管理" name="venues">
        <div class="panel-title">
          <span></span>
          <el-button type="primary" :icon="Plus" @click="openDialog('venue')">新增场地</el-button>
        </div>
        <el-table :data="filteredVenues" stripe>
          <el-table-column prop="code" label="编号" width="90" />
          <el-table-column prop="name" label="场地名称" min-width="160" />
          <el-table-column prop="sport" label="运动类型" width="100" />
          <el-table-column prop="store" label="所属门店" min-width="150" />
          <el-table-column prop="price" label="价格/小时" width="110">
            <template #default="{ row }">{{ money(row.price) }}</template>
          </el-table-column>
          <el-table-column prop="bookable" label="可预约时间" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ formatBusinessHours(row.bookable) }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }"><el-tag :type="statusType(row.status)">{{ row.status }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="250" fixed="right">
            <template #default="{ row }">
              <span class="table-actions">
                <el-button link type="primary" @click="editRow('venue', row)">编辑</el-button>
                <el-button link type="primary" @click="active = 'packages'">配置套餐</el-button>
                <el-button link type="warning" @click="changeVenueStatus(row, '维护中')">维护</el-button>
                <el-button link type="danger" @click="changeVenueStatus(row, '停用')">停用</el-button>
              </span>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="营业时间" name="hours">
        <el-form label-width="120px" class="panel">
          <el-form-item label="适用门店">
            <el-select v-model="hoursForm.store" class="w-220" @change="loadHoursForStore">
              <el-option v-for="item in stores" :key="item.id" :label="item.name" :value="item.name" />
            </el-select>
          </el-form-item>
          <el-form-item label="营业时间">
            <div class="time-segments">
              <el-switch v-model="hoursForm.is24Hours" active-text="24 小时门店" inactive-text="自定义时段" />
              <div v-if="hoursForm.is24Hours" class="time-fixed-text">营业时间：00:00-24:00</div>
              <template v-else>
              <div v-for="(segment, index) in hoursForm.segments" :key="segment.id" class="time-segment-row">
                <span class="time-segment-index">第 {{ index + 1 }} 段</span>
                <el-select v-model="segment.start" class="time-select" filterable placeholder="开始时间" @change="syncEndAfterStart(segment)">
                  <el-option v-for="item in startTimeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
                <span class="time-separator">至</span>
                <el-select v-model="segment.endMinute" class="time-select" filterable placeholder="结束时间">
                  <el-option v-for="item in endTimeOptions(segment.start)" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
                <el-button
                  :icon="Delete"
                  :disabled="hoursForm.segments.length === 1"
                  plain
                  @click="removeHoursSegment(index)"
                />
              </div>
              <el-button type="primary" plain :icon="Plus" @click="addHoursSegment">新增时段</el-button>
              </template>
            </div>
          </el-form-item>
          <el-form-item label="可预约天数"><el-input-number v-model="hoursForm.days" :min="1" :max="14" /> 天</el-form-item>
          <el-form-item label="最小预约单位"><el-input-number v-model="hoursForm.unit" :min="5" :step="5" /> 分钟</el-form-item>
          <el-form-item><el-button type="primary" @click="save">保存配置</el-button></el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="套餐价格" name="packages">
        <div class="panel-title">
          <span></span>
          <el-button type="primary" :icon="Plus" @click="openDialog('package')">新增套餐</el-button>
        </div>
        <el-table :data="packages" stripe>
          <el-table-column prop="name" label="套餐名称" width="180" show-overflow-tooltip />
          <el-table-column prop="sport" label="运动类型" width="100" />
          <el-table-column prop="duration" label="时长" width="100" />
          <el-table-column prop="originPrice" label="原价" width="100" />
          <el-table-column prop="price" label="优惠价" width="100" />
          <el-table-column label="适用门店" min-width="260" show-overflow-tooltip>
            <template #default="{ row }">{{ storeFullName(row.store) }}</template>
          </el-table-column>
          <el-table-column prop="enabled" label="状态" width="100">
            <template #default="{ row }"><el-switch v-model="row.enabled" /></template>
          </el-table-column>
          <el-table-column label="操作" width="170">
            <template #default="{ row }">
              <span class="table-actions">
                <el-button link type="primary" @click="editRow('package', row)">编辑</el-button>
                <el-button link type="danger" @click="deletePackage(row)">删除</el-button>
              </span>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="760px" class="resource-dialog">
      <p class="dialog-intro">{{ dialogIntro }}</p>
      <el-form v-if="dialogType === 'store'" :model="storeForm" label-width="108px" class="resource-form">
        <div class="form-grid">
          <el-form-item label="门店名称" required>
            <el-input v-model="storeForm.name" placeholder="请输入门店名称" />
          </el-form-item>
          <el-form-item label="所在城市" required>
            <el-cascader
              v-model="storeForm.region"
              :options="cityOptions"
              class="full-width"
              clearable
              filterable
              placeholder="请选择省 / 市"
            />
          </el-form-item>
          <el-form-item label="联系电话" required>
            <el-input v-model="storeForm.phone" placeholder="请输入门店客服电话" />
          </el-form-item>
          <el-form-item label="店长" required>
            <el-select v-model="storeForm.managerAccount" class="full-width" clearable filterable placeholder="请选择店长">
              <el-option
                v-for="item in managerOptions"
                :key="item.account"
                :label="`${item.name}（${item.account}）`"
                :value="item.account"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="营业时间" class="form-item-full" required>
            <div class="time-segments">
              <el-switch v-model="storeForm.is24Hours" active-text="24 小时门店" inactive-text="自定义时段" />
              <div v-if="storeForm.is24Hours" class="time-fixed-text">营业时间：00:00-24:00</div>
              <template v-else>
              <div v-for="(segment, index) in storeForm.hoursSegments" :key="segment.id" class="time-segment-row compact">
                <span class="time-segment-index">第 {{ index + 1 }} 段</span>
                <el-select v-model="segment.start" class="time-select" filterable placeholder="开始时间" @change="syncEndAfterStart(segment)">
                  <el-option v-for="item in startTimeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
                <span class="time-separator">至</span>
                <el-select v-model="segment.endMinute" class="time-select" filterable placeholder="结束时间">
                  <el-option v-for="item in endTimeOptions(segment.start)" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
                <el-button
                  :icon="Delete"
                  :disabled="storeForm.hoursSegments.length === 1"
                  plain
                  @click="removeStoreHoursSegment(index)"
                />
              </div>
              <el-button type="primary" plain :icon="Plus" @click="addStoreHoursSegment">新增时段</el-button>
              </template>
            </div>
          </el-form-item>
          <el-form-item label="状态" required>
            <el-select v-model="storeForm.status" class="full-width">
              <el-option v-for="item in storeStatuses" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="详细地址" required><el-input v-model="storeForm.address" placeholder="请输入街道、门牌号、楼层等详细地址" /></el-form-item>
        <el-form-item label="门店备注"><el-input v-model="storeForm.remark" type="textarea" placeholder="请输入停车、入口、服务范围等内部说明" /></el-form-item>
      </el-form>

      <el-form v-else-if="dialogType === 'venue'" :model="venueForm" label-width="108px" class="resource-form">
        <div class="form-grid">
          <el-form-item label="场地编号" required><el-input v-model="venueForm.code" placeholder="请输入场地编号" /></el-form-item>
          <el-form-item label="场地名称" required><el-input v-model="venueForm.name" placeholder="请输入场地名称" /></el-form-item>
          <el-form-item label="所属门店" required>
            <el-select v-model="venueForm.store" class="full-width" placeholder="请选择门店" @change="handleVenueStoreChange">
              <el-option v-for="item in stores" :key="item.id" :label="item.name" :value="item.name" />
            </el-select>
          </el-form-item>
          <el-form-item label="运动类型" required>
            <el-select v-model="venueForm.sport" class="full-width" placeholder="请选择类型" @change="handleVenueSportChange">
              <el-option v-for="item in sports" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="容纳人数"><el-input-number v-model="venueForm.capacity" :min="1" :max="100" class="full-width" @change="markVenueCapacityTouched" /></el-form-item>
          <el-form-item label="价格/小时" required><el-input-number v-model="venueForm.price" :min="0" :precision="2" class="full-width" /></el-form-item>
          <el-form-item label="可预约时间" class="form-item-full" required>
            <div class="time-segments">
              <div v-for="(segment, index) in venueForm.bookableSegments" :key="segment.id" class="time-segment-row compact">
                <span class="time-segment-index">第 {{ index + 1 }} 段</span>
                <el-select v-model="segment.start" class="time-select" filterable placeholder="开始时间" @change="handleVenueBookableStartChange(segment)">
                  <el-option v-for="item in startTimeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
                <span class="time-separator">至</span>
                <el-select v-model="segment.endMinute" class="time-select" filterable placeholder="结束时间" @change="markVenueBookableTouched">
                  <el-option v-for="item in endTimeOptions(segment.start)" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
                <el-button
                  :icon="Delete"
                  :disabled="venueForm.bookableSegments.length === 1"
                  plain
                  @click="removeVenueBookableSegment(index)"
                />
              </div>
              <el-button type="primary" plain :icon="Plus" @click="addVenueBookableSegment">新增时段</el-button>
            </div>
          </el-form-item>
          <el-form-item label="状态" required>
            <el-select v-model="venueForm.status" class="full-width">
              <el-option v-for="item in venueStatuses" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="场地说明"><el-input v-model="venueForm.remark" type="textarea" placeholder="地胶、灯光、器材、维护提示等" /></el-form-item>
      </el-form>

      <el-form v-else :model="packageForm" label-width="96px" class="resource-form">
        <div class="form-grid">
          <el-form-item label="套餐名称" required><el-input v-model="packageForm.name" placeholder="请输入套餐名称" /></el-form-item>
          <el-form-item label="运动类型" required>
            <el-select v-model="packageForm.sport" class="full-width">
              <el-option v-for="item in sports" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="适用门店" required>
            <el-select v-model="packageForm.store" class="full-width">
              <el-option label="全部门店" value="全部门店" />
              <el-option v-for="item in stores" :key="item.id" :label="item.name" :value="item.name" />
            </el-select>
          </el-form-item>
          <el-form-item label="套餐时长" required><el-input v-model="packageForm.duration" placeholder="请输入套餐时长，如：60分钟" /></el-form-item>
          <el-form-item label="原价" required><el-input-number v-model="packageForm.originPrice" :min="0" :precision="2" class="full-width" /></el-form-item>
          <el-form-item label="优惠价" required><el-input-number v-model="packageForm.price" :min="0" :precision="2" class="full-width" /></el-form-item>
          <el-form-item label="状态" required>
            <el-switch v-model="packageForm.enabled" active-text="启用" inactive-text="停用" />
          </el-form-item>
        </div>
        <el-form-item label="使用规则"><el-input v-model="packageForm.rule" type="textarea" placeholder="限时段、可叠加优惠、退款规则等" /></el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="save">{{ submitText }}</el-button>
        </div>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Delete, Plus, Refresh, Search } from '@element-plus/icons-vue';
import { chinaRegions } from '../data/chinaRegions';
import { adminApi, records } from '../api/modules';
import { money, statusType } from '../utils/status';

const active = ref('stores');
const stores = ref([]);
const venues = ref([]);
const packages = ref([]);
const accounts = ref([]);
const keyword = ref('');
const sport = ref('');
const status = ref('');
const sports = ['篮球', '羽毛球', '气排球', '乒乓球', '匹克球'];
const sportCapacityDefaults = { 篮球: 10, 羽毛球: 4, 气排球: 10, 乒乓球: 2, 匹克球: 4 };
const timeStepMinutes = 5;
const storeStatuses = ['营业中', '休息中', '停用'];
const venueStatuses = ['空闲', '使用中', '已预定', '维护中', '停用'];
const currentStatuses = computed(() => (active.value === 'stores' ? storeStatuses : venueStatuses));
const dialogVisible = ref(false);
const dialogTitle = ref('');
const dialogType = ref('store');
const editingId = ref('');
const storeForm = reactive({ name: '', region: [], phone: '', managerAccount: '', is24Hours: false, hoursSegments: createTimeSegments('09:00-23:59'), status: '营业中', address: '', remark: '' });
const venueForm = reactive({ code: '', name: '', store: '', sport: '', capacity: 1, price: 0, bookableSegments: createTimeSegments('09:00-23:59'), status: '空闲', remark: '' });
const packageForm = reactive({ name: '', sport: '', store: '全部门店', duration: '', originPrice: 0, price: 0, enabled: true, rule: '' });
const defaultStoreHours = { name: '', hours: '09:00-23:59', is24Hours: false };
const hoursForm = reactive({ store: defaultStoreHours.name, is24Hours: !!defaultStoreHours.is24Hours, segments: createTimeSegments(defaultStoreHours.hours), days: 7, unit: timeStepMinutes });
const cityOptions = chinaRegions;
const startTimeOptions = createStartTimeOptions();
const venueCapacityTouched = ref(false);
const venueBookableTouched = ref(false);
const previousVenueSport = ref('');

const filteredStores = computed(() => stores.value.filter((item) => (!keyword.value || String(item.name || '').includes(keyword.value) || String(item.address || '').includes(keyword.value)) && (!status.value || item.status === status.value)));
const filteredVenues = computed(() => venues.value.filter((item) => (!keyword.value || String(item.name || '').includes(keyword.value) || String(item.code || '').includes(keyword.value)) && (!sport.value || item.sport === sport.value) && (!status.value || item.status === status.value)));
const managerOptions = computed(() => accounts.value.filter((item) => item.status === '正常' && ['店长', '超级管理员'].includes(item.role)));
const dialogIntro = computed(() => {
  if (dialogType.value === 'store') return editingId.value ? '修改门店基础信息、城市地址、营业时间与运营状态。' : '填写新增门店的基础信息、城市地址、营业时间与运营状态。';
  if (dialogType.value === 'venue') return editingId.value ? '修改场地编号、所属门店、运动类型、可预约时间与基础价格。' : '填写新增场地的编号、所属门店、运动类型、可预约时间与基础价格。';
  return editingId.value ? '修改套餐的运动类型、适用门店、时长、价格与启用状态。' : '填写新增套餐的运动类型、适用门店、时长、价格与启用状态。';
});
const submitText = computed(() => (editingId.value ? '保存修改' : '确认新增'));

function reset() {
  keyword.value = '';
  sport.value = '';
  status.value = '';
}

function openDialog(type) {
  dialogType.value = type;
  editingId.value = '';
  dialogTitle.value = type === 'store' ? '新增门店' : type === 'venue' ? '新增场地' : '新增套餐';
  const defaultVenueStore = stores.value[0]?.name || '';
  const defaultVenueSport = sports[0];
  Object.assign(storeForm, { name: '', region: [], phone: '', managerAccount: managerOptions.value[0]?.account || '', is24Hours: false, hoursSegments: createTimeSegments('09:00-23:59'), status: '营业中', address: '', remark: '' });
  Object.assign(venueForm, { code: '', name: '', store: defaultVenueStore, sport: defaultVenueSport, capacity: defaultCapacityForSport(defaultVenueSport), price: 0, bookableSegments: createStoreBoundarySegments(defaultVenueStore), status: '空闲', remark: '' });
  venueCapacityTouched.value = false;
  venueBookableTouched.value = false;
  previousVenueSport.value = defaultVenueSport;
  Object.assign(packageForm, { name: '', sport: sports[0], store: stores.value[0]?.name || '全部门店', duration: '60分钟', originPrice: 0, price: 0, enabled: true, rule: '' });
  dialogVisible.value = true;
}

function editRow(type, row) {
  dialogType.value = type;
  editingId.value = row.id || row.code || row.name;
  dialogTitle.value = `编辑${type === 'store' ? '门店' : type === 'venue' ? '场地' : '套餐'}`;
  if (type === 'store') {
    Object.assign(storeForm, { name: row.name, region: findRegion(row), phone: row.phone || '', managerAccount: row.managerAccount || findAccountByName(row.manager)?.account || '', is24Hours: !!row.is24Hours, hoursSegments: createTimeSegments(row.hours), status: row.status || '营业中', address: row.address || '', remark: row.remark || '' });
  } else if (type === 'venue') {
    const rowStore = row.store || stores.value[0]?.name || '';
    const rowSport = row.sport || sports[0];
    Object.assign(venueForm, { code: row.code || '', name: row.name, store: rowStore, sport: rowSport, capacity: row.capacity || defaultCapacityForSport(rowSport), price: row.price || 0, bookableSegments: createTimeSegments(row.bookable || stringifyTimeSegments(createStoreBoundarySegments(rowStore))), status: row.status || '空闲', remark: '' });
    venueCapacityTouched.value = false;
    venueBookableTouched.value = true;
    previousVenueSport.value = rowSport;
  } else {
    Object.assign(packageForm, { name: row.name || '', sport: row.sport || sports[0], store: storeFullName(row.store), duration: row.duration || '', originPrice: row.originPrice || 0, price: row.price || 0, enabled: row.enabled !== false, rule: row.rule || '' });
  }
  dialogVisible.value = true;
}

function storeFullName(value) {
  if (!value || value === '全部门店') return '全部门店';
  const matched = stores.value.find((item) => item.name === value || item.name.includes(value) || value.includes(item.name));
  return matched?.name || value;
}

function findAccountByName(name) {
  return accounts.value.find((item) => item.name === name);
}

function findAccountByAccount(account) {
  return accounts.value.find((item) => item.account === account);
}

function padTimeUnit(value) {
  return String(value).padStart(2, '0');
}

function minutesToTime(minutes) {
  const dayMinutes = minutes % 1440;
  const hour = Math.floor(dayMinutes / 60);
  const minute = dayMinutes % 60;
  return `${padTimeUnit(hour)}:${padTimeUnit(minute)}`;
}

function parseClockMinutes(value) {
  if (!value) return 0;
  const raw = String(value).replace('次日', '').trim();
  if (raw === '24:00') return 1440;
  const [hour = 0, minute = 0] = raw.split(':').map(Number);
  return hour * 60 + minute;
}

function toAbsoluteMinutes(value, startMinute = 0, isEnd = false) {
  if (typeof value === 'number') return value;
  const text = String(value || '').trim();
  if (text.startsWith('次日')) return 1440 + parseClockMinutes(text);
  const minute = parseClockMinutes(text);
  if (isEnd && minute <= startMinute) return minute + 1440;
  return minute;
}

function formatTimeValue(minutes) {
  if (minutes === 1440) return '24:00';
  if (minutes > 1440) return `次日${minutesToTime(minutes)}`;
  return minutesToTime(minutes);
}

function parseTimeRange(value) {
  if (value && typeof value === 'object' && 'start' in value && 'endMinute' in value) return { ...value };
  const [start = '09:00', end = '23:59'] = String(value || '09:00-23:59').split('-');
  const startMinute = parseClockMinutes(start);
  return {
    start: start === '24:00' ? '00:00' : start,
    endMinute: toAbsoluteMinutes(end, startMinute, true)
  };
}

function formatTimeRange(range) {
  const parsed = parseTimeRange(range);
  return `${parsed.start}-${formatTimeValue(parsed.endMinute)}`;
}

function createStartTimeOptions() {
  const options = [];
  for (let minute = 0; minute < 1440; minute += timeStepMinutes) {
    options.push({ label: minutesToTime(minute), value: minutesToTime(minute) });
  }
  if (!options.some((item) => item.value === '23:59')) options.push({ label: '23:59', value: '23:59' });
  return options;
}

function endTimeOptions(start) {
  const startMinute = parseClockMinutes(start);
  const options = [];
  for (let minute = startMinute + timeStepMinutes; minute <= startMinute + 1440; minute += timeStepMinutes) {
    options.push({ label: formatTimeValue(minute), value: minute });
  }
  [1439, 1440, startMinute + 1440].forEach((minute) => {
    if (minute > startMinute && minute <= startMinute + 1440 && !options.some((item) => item.value === minute)) {
      options.push({ label: formatTimeValue(minute), value: minute });
    }
  });
  return options.sort((a, b) => a.value - b.value);
}

function syncEndAfterStart(range) {
  const startMinute = parseClockMinutes(range.start);
  if (!range.endMinute || range.endMinute <= startMinute || range.endMinute > startMinute + 1440) {
    range.endMinute = Math.min(startMinute + 60, startMinute + 1440);
  }
}

function createTimeSegments(value) {
  const ranges = (Array.isArray(value) ? value : String(value || '09:00-23:59').split(/[,，、]/))
    .map((item) => item.trim())
    .filter(Boolean);
  return (ranges.length ? ranges : ['09:00-23:59']).map((range, index) => ({
    id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
    ...parseTimeRange(range)
  }));
}

function defaultCapacityForSport(value) {
  return sportCapacityDefaults[value] || 1;
}

function formatBusinessHours(value) {
  if (value === '00:00-24:00') return '00:00-24:00';
  if (Array.isArray(value)) return value.join('、');
  return String(value || '').split(/[,，、]/).map((item) => item.trim()).filter(Boolean).map((item) => formatTimeRange(item)).join('、') || '-';
}

function normalizeTimeSegments(segments) {
  return segments
    .filter((segment) => segment.start && segment.endMinute)
    .map((segment) => {
      const startMinute = parseClockMinutes(segment.start);
      return { ...segment, startMinute, endMinute: Number(segment.endMinute), duration: Number(segment.endMinute) - startMinute };
    })
    .sort((a, b) => a.startMinute - b.startMinute);
}

function validateBusinessSegments(segments) {
  const normalized = normalizeTimeSegments(segments);
  if (normalized.length !== segments.length) return '请完整选择每一段营业时间';
  if (normalized.some((item) => item.duration <= 0)) return '每段营业时间的结束时间必须晚于开始时间';
  if (normalized.some((item) => item.duration > 1440)) return '单段营业时间不能超过 24 小时';
  const totalDuration = normalized.reduce((sum, item) => sum + item.duration, 0);
  if (totalDuration > 1440) return '营业时间总和不能超过 24 小时';
  const intervals = normalized.flatMap((item) => [
    { start: item.startMinute, end: item.endMinute },
    { start: item.startMinute + 1440, end: item.endMinute + 1440 }
  ]).sort((a, b) => a.start - b.start);
  for (let index = 1; index < intervals.length; index += 1) {
    if (intervals[index].start < intervals[index - 1].end) return '多段营业时间不能互相重叠';
  }
  return '';
}

function stringifyTimeSegments(segments) {
  return normalizeTimeSegments(segments).map((item) => formatTimeRange(item)).join('、');
}

function dailyIntervalsFromSegments(segments) {
  return normalizeTimeSegments(segments)
    .flatMap((item) => {
      if (item.endMinute <= 1440) return [{ start: item.startMinute, end: item.endMinute }];
      return [
        { start: item.startMinute, end: 1440 },
        { start: 0, end: item.endMinute - 1440 }
      ];
    })
    .filter((item) => item.end > item.start)
    .sort((a, b) => a.start - b.start);
}

function mergeDailyIntervals(intervals) {
  return intervals.reduce((merged, item) => {
    const last = merged[merged.length - 1];
    if (!last || item.start > last.end) {
      merged.push({ ...item });
      return merged;
    }
    last.end = Math.max(last.end, item.end);
    return merged;
  }, []);
}

function findAvailableSegment(segments) {
  const occupied = mergeDailyIntervals(dailyIntervalsFromSegments(segments));
  let cursor = 0;
  for (const item of occupied) {
    if (item.start - cursor >= timeStepMinutes) return createSegmentFromGap(cursor, item.start);
    cursor = Math.max(cursor, item.end);
  }
  if (1440 - cursor >= timeStepMinutes) return createSegmentFromGap(cursor, 1440);
  return null;
}

function createSegmentFromGap(startMinute, endMinute) {
  const duration = Math.min(60, endMinute - startMinute);
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    start: minutesToTime(startMinute),
    endMinute: startMinute + duration
  };
}

function addAvailableSegment(segments) {
  const message = validateBusinessSegments(segments);
  if (message) {
    ElMessage.warning(`请先调整当前营业时段：${message}`);
    return;
  }
  const nextSegment = findAvailableSegment(segments);
  if (!nextSegment) {
    ElMessage.warning('当前营业时段已无可新增空档');
    return;
  }
  segments.push(nextSegment);
}

function addHoursSegment() {
  addAvailableSegment(hoursForm.segments);
}

function removeHoursSegment(index) {
  hoursForm.segments.splice(index, 1);
}

function addStoreHoursSegment() {
  addAvailableSegment(storeForm.hoursSegments);
}

function removeStoreHoursSegment(index) {
  storeForm.hoursSegments.splice(index, 1);
}

function loadHoursForStore() {
  const store = stores.value.find((item) => item.name === hoursForm.store);
  hoursForm.is24Hours = !!store?.is24Hours;
  hoursForm.segments = createTimeSegments(store?.hours);
}

function findStoreByName(name) {
  return stores.value.find((item) => item.name === name);
}

function createStoreBoundarySegments(storeName) {
  const store = findStoreByName(storeName);
  return createTimeSegments(store?.is24Hours ? '00:00-24:00' : store?.hours);
}

function cloneTimeSegments(segments) {
  return createTimeSegments(stringifyTimeSegments(segments));
}

function toSegmentFromDailyInterval(interval) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    start: minutesToTime(interval.start),
    endMinute: interval.end
  };
}

function clipSegmentsToBoundary(segments, boundarySegments) {
  const source = dailyIntervalsFromSegments(segments);
  const boundary = dailyIntervalsFromSegments(boundarySegments);
  const clipped = [];
  source.forEach((sourceItem) => {
    boundary.forEach((boundaryItem) => {
      const start = Math.max(sourceItem.start, boundaryItem.start);
      const end = Math.min(sourceItem.end, boundaryItem.end);
      if (end > start) clipped.push({ start, end });
    });
  });
  const merged = mergeDailyIntervals(clipped);
  return merged.length ? merged.map(toSegmentFromDailyInterval) : cloneTimeSegments(boundarySegments);
}

function isWithinBoundary(segments, boundarySegments) {
  const boundary = dailyIntervalsFromSegments(boundarySegments);
  return dailyIntervalsFromSegments(segments).every((segment) =>
    boundary.some((item) => segment.start >= item.start && segment.end <= item.end)
  );
}

function findAvailableSegmentWithinBoundary(segments, boundarySegments) {
  const occupied = mergeDailyIntervals(dailyIntervalsFromSegments(segments));
  const boundary = dailyIntervalsFromSegments(boundarySegments);
  for (const boundaryItem of boundary) {
    let cursor = boundaryItem.start;
    for (const item of occupied) {
      if (item.end <= cursor || item.start >= boundaryItem.end) continue;
      if (item.start - cursor >= timeStepMinutes) return createSegmentFromGap(cursor, Math.min(item.start, boundaryItem.end));
      cursor = Math.max(cursor, item.end);
    }
    if (boundaryItem.end - cursor >= timeStepMinutes) return createSegmentFromGap(cursor, boundaryItem.end);
  }
  return null;
}

function markVenueCapacityTouched() {
  venueCapacityTouched.value = true;
}

function markVenueBookableTouched() {
  venueBookableTouched.value = true;
}

function handleVenueSportChange(nextSport) {
  const previousDefault = defaultCapacityForSport(previousVenueSport.value);
  if (!venueCapacityTouched.value || Number(venueForm.capacity) === previousDefault) {
    venueForm.capacity = defaultCapacityForSport(nextSport);
    venueCapacityTouched.value = false;
  }
  previousVenueSport.value = nextSport;
}

function handleVenueStoreChange() {
  const boundarySegments = createStoreBoundarySegments(venueForm.store);
  venueForm.bookableSegments = venueBookableTouched.value ? clipSegmentsToBoundary(venueForm.bookableSegments, boundarySegments) : cloneTimeSegments(boundarySegments);
}

function handleVenueBookableStartChange(segment) {
  syncEndAfterStart(segment);
  markVenueBookableTouched();
}

function addVenueBookableSegment() {
  const message = validateBusinessSegments(venueForm.bookableSegments);
  if (message) {
    ElMessage.warning(`请先调整当前可预约时间：${message}`);
    return;
  }
  const boundarySegments = createStoreBoundarySegments(venueForm.store);
  const nextSegment = findAvailableSegmentWithinBoundary(venueForm.bookableSegments, boundarySegments);
  if (!nextSegment) {
    ElMessage.warning('当前门店营业时间内已无可新增空档');
    return;
  }
  venueForm.bookableSegments.push(nextSegment);
  markVenueBookableTouched();
}

function removeVenueBookableSegment(index) {
  venueForm.bookableSegments.splice(index, 1);
  markVenueBookableTouched();
}

function findRegion(row) {
  if (Array.isArray(row?.region) && row.region.length) return row.region;
  const city = typeof row === 'string' ? row : row?.city;
  for (const province of cityOptions) {
    for (const cityItem of province.children || []) {
      if (city && (cityItem.value === city || cityItem.value.startsWith(city))) return [province.value, cityItem.value];
    }
  }
  return city ? [city] : [];
}

function cityNameFromRegion(region) {
  if (!Array.isArray(region) || !region.length) return '';
  return region[1] || region[0] || '';
}

function validateStoreForm() {
  if (!storeForm.name.trim()) return '请输入门店名称';
  if (!cityNameFromRegion(storeForm.region)) return '请选择所在城市';
  if (!storeForm.phone.trim()) return '请输入联系电话';
  if (!storeForm.managerAccount) return '请选择店长';
  if (!storeForm.status) return '请选择状态';
  if (!storeForm.address.trim()) return '请输入详细地址';
  if (storeForm.is24Hours) return '';
  return validateBusinessSegments(storeForm.hoursSegments);
}

function validateVenueForm() {
  if (!venueForm.code.trim()) return '请输入场地编号';
  if (!venueForm.name.trim()) return '请输入场地名称';
  if (!venueForm.store) return '请选择所属门店';
  if (!venueForm.sport) return '请选择运动类型';
  if (venueForm.price === null || venueForm.price === undefined || Number(venueForm.price) < 0) return '请输入价格/小时';
  const timeMessage = validateBusinessSegments(venueForm.bookableSegments);
  if (timeMessage) return timeMessage.replaceAll('营业时间', '可预约时间');
  if (!isWithinBoundary(venueForm.bookableSegments, createStoreBoundarySegments(venueForm.store))) return '可预约时间必须落在所属门店营业时间内';
  if (!venueForm.status) return '请选择状态';
  return '';
}

function validatePackageForm() {
  if (!packageForm.name.trim()) return '请输入套餐名称';
  if (!packageForm.sport) return '请选择运动类型';
  if (!packageForm.store) return '请选择适用门店';
  if (!packageForm.duration.trim()) return '请输入套餐时长';
  if (packageForm.originPrice === null || packageForm.originPrice === undefined || Number(packageForm.originPrice) < 0) return '请输入原价';
  if (packageForm.price === null || packageForm.price === undefined || Number(packageForm.price) < 0) return '请输入优惠价';
  if (typeof packageForm.enabled !== 'boolean') return '请选择状态';
  return '';
}

async function save() {
  if (dialogVisible.value && dialogType.value === 'store') {
    const message = validateStoreForm();
    if (message) {
      ElMessage.warning(message);
      return;
    }
    const manager = findAccountByAccount(storeForm.managerAccount);
    const payload = {
      id: editingId.value || `store-${Date.now()}`,
      name: storeForm.name,
      city: cityNameFromRegion(storeForm.region),
      region: [...storeForm.region],
      address: storeForm.address,
      phone: storeForm.phone,
      manager: manager?.name || '',
      managerAccount: storeForm.managerAccount,
      is24Hours: storeForm.is24Hours,
      hours: storeForm.is24Hours ? '00:00-24:00' : stringifyTimeSegments(storeForm.hoursSegments),
      status: storeForm.status
    };
    upsert(stores, payload);
  }
  if (dialogVisible.value && dialogType.value === 'venue') {
    const message = validateVenueForm();
    if (message) {
      ElMessage.warning(message);
      return;
    }
    const payload = {
      id: editingId.value || `venue-${Date.now()}`,
      code: venueForm.code,
      name: venueForm.name,
      sport: venueForm.sport,
      store: venueForm.store,
      price: venueForm.price,
      status: venueForm.status,
      capacity: venueForm.capacity,
      bookable: stringifyTimeSegments(venueForm.bookableSegments)
    };
    upsert(venues, payload);
  }
  if (dialogVisible.value && dialogType.value === 'package') {
    const message = validatePackageForm();
    if (message) {
      ElMessage.warning(message);
      return;
    }
    const payload = {
      id: editingId.value || `pkg-${Date.now()}`,
      name: packageForm.name,
      sport: packageForm.sport,
      duration: packageForm.duration,
      originPrice: packageForm.originPrice,
      price: packageForm.price,
      store: packageForm.store,
      enabled: packageForm.enabled,
      rule: packageForm.rule
    };
    upsert(packages, payload);
  }
  if (!dialogVisible.value && active.value === 'hours') {
    const message = hoursForm.is24Hours ? '' : validateBusinessSegments(hoursForm.segments);
    if (message) {
      ElMessage.warning(message);
      return;
    }
    const store = stores.value.find((item) => item.name === hoursForm.store);
    if (store) {
      const hours = hoursForm.is24Hours ? '00:00-24:00' : stringifyTimeSegments(hoursForm.segments);
      await adminApi.updateStore(store.id || store.storeId, { hours, status: store.status });
      store.is24Hours = hoursForm.is24Hours;
      store.hours = hours;
    }
  }
  dialogVisible.value = false;
  ElMessage.success('配置已保存');
}

function upsert(listRef, payload) {
  const index = listRef.value.findIndex((item) => item.id === editingId.value || item.code === editingId.value || item.name === editingId.value);
  if (index >= 0) {
    listRef.value[index] = { ...listRef.value[index], ...payload };
    return;
  }
  listRef.value.unshift(payload);
}

function configureHours(row) {
  hoursForm.store = row.name;
  hoursForm.is24Hours = !!row.is24Hours;
  hoursForm.segments = createTimeSegments(row.hours);
  active.value = 'hours';
}

async function changeStoreStatus(row, nextStatus) {
  await ElMessageBox.confirm(`确认将 ${row.name} 设置为${nextStatus}？`, '门店状态确认', { type: 'warning' });
  const updated = await adminApi.updateStore(row.id || row.storeId, { status: nextStatus, hours: row.hours });
  Object.assign(row, updated);
  ElMessage.success('门店状态已更新');
}

async function changeVenueStatus(row, nextStatus) {
  await ElMessageBox.confirm(`确认将 ${row.name} 设置为${nextStatus}？`, '场地状态确认', { type: 'warning' });
  const updated = await adminApi.updateVenue(row.id || row.venueId, { status: nextStatus, bookable: row.bookable, price: row.price });
  Object.assign(row, updated);
  ElMessage.success('场地状态已更新');
}

function deletePackage(row) {
  ElMessageBox.confirm(`确认删除套餐 ${row.name}？`, '删除套餐', { type: 'warning' }).then(() => {
    packages.value = packages.value.filter((item) => item.id !== row.id);
    ElMessage.success('套餐已删除');
  });
}

async function loadResources() {
  try {
    const [storeData, venueData, packageData, accountData] = await Promise.all([
      adminApi.stores(),
      adminApi.venues(),
      adminApi.packages(),
      adminApi.accounts()
    ]);
    stores.value = records(storeData);
    venues.value = records(venueData);
    packages.value = records(packageData);
    accounts.value = records(accountData);
    hoursForm.store = stores.value[0]?.name || '';
    loadHoursForStore();
  } catch (error) {
    stores.value = [];
    venues.value = [];
    packages.value = [];
    accounts.value = [];
    hoursForm.store = stores.value[0]?.name || '';
    loadHoursForStore();
  }
}

onMounted(loadResources);
</script>

<style scoped>
:deep(.resource-dialog .el-dialog) {
  border-radius: 8px;
}

:deep(.resource-dialog .el-dialog__header) {
  padding: 22px 24px 12px;
  border-bottom: 1px solid var(--line);
}

:deep(.resource-dialog .el-dialog__title) {
  color: var(--text);
  font-size: 20px;
  font-weight: 800;
}

:deep(.resource-dialog .el-dialog__body) {
  padding: 16px 24px 8px;
}

:deep(.resource-dialog .el-dialog__footer) {
  padding: 14px 24px 20px;
  border-top: 1px solid var(--line);
}

.dialog-intro {
  margin: 0 0 16px;
  padding: 10px 12px;
  color: #4d5b6f;
  background: #f7f9fc;
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
}

.resource-form {
  padding-top: 2px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.full-width {
  width: 100%;
}

.time-segments {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(720px, 100%);
}

.time-segment-row {
  display: grid;
  grid-template-columns: 80px minmax(140px, 1fr) 24px minmax(140px, 1fr) 40px;
  align-items: center;
  gap: 12px;
}

.time-segment-row.compact {
  grid-template-columns: 72px minmax(140px, 1fr) 24px minmax(140px, 1fr) 40px;
}

.time-segment-index {
  color: #606266;
  font-size: 14px;
  white-space: nowrap;
}

.time-select {
  width: 100%;
}

.time-separator {
  color: #606266;
  text-align: center;
}

.time-fixed-text {
  padding: 12px 14px;
  color: #1f7a4d;
  background: #f0f9eb;
  border: 1px solid #c2e7b0;
  border-radius: 8px;
  font-weight: 700;
}

.form-item-full {
  grid-column: 1 / -1;
}

@media (max-width: 760px) {
  .time-segment-row,
  .time-segment-row.compact {
    grid-template-columns: 1fr;
  }
}
</style>
