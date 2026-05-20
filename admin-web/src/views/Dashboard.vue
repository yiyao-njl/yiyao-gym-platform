<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">经营数据看板</h1>
        <p class="page-subtitle">汇总小程序预约、开场、支付、退款和评价数据，优先读取 `/api/admin/statistics/dashboard`。</p>
      </div>
      <div class="table-actions">
        <el-radio-group v-model="range" size="large" @change="trendChart.render">
          <el-radio-button label="今日" />
          <el-radio-button label="近7日" />
          <el-radio-button label="近30日" />
          <el-radio-button label="本月" />
        </el-radio-group>
        <el-button type="primary" :icon="Refresh" @click="refresh">刷新</el-button>
        <el-button :icon="Download">导出数据</el-button>
      </div>
    </div>

    <div class="metric-grid">
      <article v-for="item in metrics" :key="item.label" class="metric-card">
        <div class="metric-label">{{ item.label }}</div>
        <div class="metric-value">{{ item.value }}</div>
        <div class="metric-note">{{ item.note }}</div>
      </article>
    </div>

    <div class="two-col">
      <div class="panel">
        <div class="panel-title">
          <span>收入与订单趋势</span>
          <el-tag type="success">{{ range }}</el-tag>
        </div>
        <div :ref="(node) => { trendChart.el.value = node }" class="chart"></div>
      </div>
      <div class="panel">
        <div class="panel-title">
          <span>热门运动类型</span>
          <el-button link type="primary" @click="$router.push('/statistics')">查看统计</el-button>
        </div>
        <div :ref="(node) => { sportChart.el.value = node }" class="chart"></div>
      </div>
    </div>

    <div class="two-col">
      <div class="panel">
        <div class="panel-title">
          <span>最新订单</span>
          <el-button link type="primary" @click="$router.push('/orders')">查看订单</el-button>
        </div>
        <el-table :data="orders.slice(0, 5)" stripe>
          <el-table-column prop="orderNo" label="订单号" min-width="150" />
          <el-table-column prop="user" label="用户" width="90" />
          <el-table-column prop="venue" label="场地" min-width="150" />
          <el-table-column prop="amount" label="金额" width="90">
            <template #default="{ row }">{{ money(row.amount) }}</template>
          </el-table-column>
          <el-table-column prop="orderStatus" label="状态" width="100">
            <template #default="{ row }"><el-tag :type="statusType(row.orderStatus)">{{ row.orderStatus }}</el-tag></template>
          </el-table-column>
        </el-table>
      </div>
      <div class="panel">
        <div class="panel-title">
          <span>待处理事项</span>
          <el-button link type="primary" @click="$router.push('/payments')">处理退款</el-button>
        </div>
        <div class="mini-stat">
          <span>待处理退款</span>
          <el-tag type="warning">{{ dashboard?.pendingRefundCount ?? 0 }} 笔</el-tag>
        </div>
        <div class="mini-stat">
          <span>待审核评价</span>
          <el-tag type="warning">{{ dashboard?.pendingReviewCount ?? 0 }} 条</el-tag>
        </div>
        <div class="mini-stat">
          <span>维护中场地</span>
          <el-tag type="danger">{{ dashboard?.maintenanceVenueCount ?? 0 }} 个</el-tag>
        </div>
        <div class="mini-stat">
          <span>今日场地使用率</span>
          <strong>{{ percent(dashboard?.venueUsageRate) }}</strong>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { Download, Refresh } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { adminApi } from '../api/modules';
import { money, statusType } from '../utils/status';
import { useChart } from '../utils/useChart';

const range = ref('近7日');
const dashboard = ref(null);
const orders = ref([]);
const metrics = computed(() => [
  { label: '今日营业额', value: money((dashboard.value?.revenueCent || 0) / 100), note: '来自后端统计口径' },
  { label: '今日订单数', value: String(dashboard.value?.orderCount ?? 0), note: `预约 ${dashboard.value?.reservationCount ?? 0} / 开场 ${dashboard.value?.walkInCount ?? 0}` },
  { label: '待处理退款', value: String(dashboard.value?.pendingRefundCount ?? 0), note: '需审核备注与流水' },
  { label: '场地使用率', value: percent(dashboard.value?.venueUsageRate), note: topVenueNote.value }
]);
const trends = computed(() => dashboard.value?.trends || []);
const sportDistribution = computed(() => dashboard.value?.sportDistribution || []);
const topVenueNote = computed(() => {
  const top = dashboard.value?.venueRanking?.[0];
  return top ? `${top.name} ${Math.round(Number(top.value || 0))}%` : '暂无使用数据';
});

const trendChart = useChart(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['收入', '订单'] },
  grid: { left: 42, right: 20, top: 46, bottom: 36 },
  xAxis: { type: 'category', data: trends.value.map((item) => item.date) },
  yAxis: [{ type: 'value' }, { type: 'value' }],
  series: [
    { name: '收入', type: 'line', smooth: true, data: trends.value.map((item) => Number(item.revenueCent || 0) / 100), areaStyle: {}, color: '#0f8f6f' },
    { name: '订单', type: 'bar', yAxisIndex: 1, data: trends.value.map((item) => Number(item.orders || item.orderCount || 0)), color: '#4f8cff' }
  ]
}));

const sportChart = useChart(() => ({
  tooltip: { trigger: 'item' },
  series: [
    {
      type: 'pie',
      radius: ['45%', '72%'],
      data: sportDistribution.value.map((item) => ({ name: item.name, value: Number(item.value || 0) }))
    }
  ]
}));

function refresh() {
  loadDashboard(true);
}

async function loadDashboard(showMessage = false) {
  try {
    const data = await adminApi.dashboard({ range: range.value });
    dashboard.value = data;
    orders.value = data.latestOrders || [];
    trendChart.render();
    sportChart.render();
    if (showMessage) ElMessage.success('看板数据已刷新');
  } catch (error) {
    dashboard.value = null;
    orders.value = [];
    trendChart.render();
    sportChart.render();
    if (showMessage) ElMessage.warning('后端暂不可用，暂无可展示数据');
  }
}

function percent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

onMounted(loadDashboard);
</script>
