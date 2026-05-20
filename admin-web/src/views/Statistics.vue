<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">数据统计</h1>
        <p class="page-subtitle">收入、订单、场地使用率、用户增长和运动类型占比统计。</p>
      </div>
      <div class="table-actions">
        <el-select v-model="store" class="w-220">
          <el-option label="全部门店" value="全部门店" />
          <el-option v-for="item in stores" :key="item.id || item.name" :label="item.name" :value="item.name" />
        </el-select>
        <el-button :icon="Download">导出报表</el-button>
      </div>
    </div>

    <div class="toolbar">
      <el-radio-group v-model="period" size="large" @change="rerender">
        <el-radio-button label="日" />
        <el-radio-button label="周" />
        <el-radio-button label="月" />
        <el-radio-button label="自定义" />
      </el-radio-group>
      <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
    </div>

    <div class="two-col">
      <div class="panel">
        <div class="panel-title">收入趋势</div>
        <div :ref="(node) => { revenueChart.el.value = node }" class="chart"></div>
      </div>
      <div class="panel">
        <div class="panel-title">订单趋势</div>
        <div :ref="(node) => { orderChart.el.value = node }" class="chart"></div>
      </div>
    </div>
    <div class="two-col">
      <div class="panel">
        <div class="panel-title">场地使用率排行</div>
        <div :ref="(node) => { usageChart.el.value = node }" class="chart"></div>
      </div>
      <div class="panel">
        <div class="panel-title">运动类型占比</div>
        <div :ref="(node) => { sportChart.el.value = node }" class="chart"></div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { Download } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { adminApi } from '../api/modules';
import { useChart } from '../utils/useChart';

const store = ref('全部门店');
const period = ref('周');
const dateRange = ref('');
const statistics = ref(null);
const stores = computed(() => statistics.value?.stores || []);
const trends = computed(() => statistics.value?.trends || []);
const venueUsageRanking = computed(() => statistics.value?.venueUsageRanking || []);
const sportDistribution = computed(() => statistics.value?.sportDistribution || []);

const revenueChart = useChart(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 44, right: 20, top: 24, bottom: 34 },
  xAxis: { type: 'category', data: trends.value.map((item) => item.date) },
  yAxis: { type: 'value' },
  series: [{ type: 'line', smooth: true, data: trends.value.map((item) => Number(item.revenueCent || 0) / 100), color: '#0f8f6f', areaStyle: {} }]
}));

const orderChart = useChart(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 38, right: 20, top: 24, bottom: 34 },
  xAxis: { type: 'category', data: trends.value.map((item) => item.date) },
  yAxis: { type: 'value' },
  series: [{ type: 'bar', data: trends.value.map((item) => Number(item.orders || item.orderCount || 0)), color: '#4f8cff' }]
}));

const usageChart = useChart(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 80, right: 20, top: 24, bottom: 34 },
  xAxis: { type: 'value', max: 100 },
  yAxis: { type: 'category', data: venueUsageRanking.value.map((item) => item.name) },
  series: [{ type: 'bar', data: venueUsageRanking.value.map((item) => Number(item.value || 0)), color: '#17b890' }]
}));

const sportChart = useChart(() => ({
  tooltip: { trigger: 'item' },
  series: [{ type: 'pie', radius: '70%', data: sportDistribution.value.map((item) => ({ name: item.name, value: Number(item.value || 0) })) }]
}));

function rerender() {
  revenueChart.render();
  orderChart.render();
  usageChart.render();
  sportChart.render();
}

async function loadStatistics() {
  try {
    statistics.value = await adminApi.statistics({ store: store.value, period: period.value });
  } catch (error) {
    statistics.value = { trends: [], venueUsageRanking: [], sportDistribution: [], stores: [] };
    ElMessage.warning('统计接口暂不可用，暂无可展示数据');
  }
  rerender();
}

onMounted(loadStatistics);
</script>
