<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">订单管理</h1>
        <p class="page-subtitle">统一处理预约订单、到店开场订单、取消、确认到场和退款申请。</p>
      </div>
      <el-button :icon="Download">导出订单</el-button>
    </div>

    <div class="toolbar">
      <el-input v-model="filters.keyword" class="w-220" clearable placeholder="订单号/手机号/用户" />
      <el-select v-model="filters.store" class="w-220" clearable placeholder="门店">
        <el-option v-for="item in storeOptions" :key="item.id || item.name" :label="item.name" :value="item.name" />
      </el-select>
      <el-select v-model="filters.status" class="w-160" clearable placeholder="订单状态">
        <el-option label="待支付" value="待支付" />
        <el-option label="待到场" value="待到场" />
        <el-option label="使用中" value="使用中" />
        <el-option label="已取消" value="已取消" />
      </el-select>
      <el-date-picker v-model="filters.date" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
      <el-button type="primary" :icon="Search">查询</el-button>
      <el-button :icon="Refresh" @click="reset">重置</el-button>
    </div>

    <el-tabs v-model="active" class="tab-panel">
      <el-tab-pane label="预约订单" name="reservation" />
      <el-tab-pane label="开场订单" name="walkIn" />
      <el-table :data="filteredOrders" stripe>
        <el-table-column prop="orderNo" label="订单号" min-width="150" />
        <el-table-column prop="user" label="用户" width="90" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="store" label="门店" min-width="150" />
        <el-table-column prop="venue" label="场地" min-width="150" />
        <el-table-column prop="time" label="预约/开场时间" min-width="190" />
        <el-table-column prop="amount" label="金额" width="90">
          <template #default="{ row }">{{ money(row.amount) }}</template>
        </el-table-column>
        <el-table-column prop="payStatus" label="支付" width="100">
          <template #default="{ row }"><el-tag :type="statusType(row.payStatus)">{{ row.payStatus }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="orderStatus" label="订单状态" width="100">
          <template #default="{ row }"><el-tag :type="statusType(row.orderStatus)">{{ row.orderStatus }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <span class="table-actions">
              <el-button link type="primary" @click="view(row)">详情</el-button>
              <el-button link type="success" @click="confirm(row, '确认到场')">确认到场</el-button>
              <el-button link type="warning" @click="confirm(row, '申请退款')">退款</el-button>
              <el-button link type="danger" @click="confirm(row, '取消订单')">取消</el-button>
            </span>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination class="pagination" background layout="prev, pager, next, total" :total="filteredOrders.length" />
    </el-tabs>

    <el-dialog v-model="detailVisible" title="订单详情" width="720px">
      <el-descriptions v-if="current" :column="2" border>
        <el-descriptions-item label="订单号">{{ current.orderNo || current.id }}</el-descriptions-item>
        <el-descriptions-item label="订单类型">{{ current.type }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ current.user }} / {{ current.phone }}</el-descriptions-item>
        <el-descriptions-item label="门店">{{ current.store }}</el-descriptions-item>
        <el-descriptions-item label="场地">{{ current.venue }}</el-descriptions-item>
        <el-descriptions-item label="时间">{{ current.time }}</el-descriptions-item>
        <el-descriptions-item label="订单金额">{{ money(current.amount) }}</el-descriptions-item>
        <el-descriptions-item label="优惠信息">套餐优惠 + 优惠券抵扣以后端试算为准</el-descriptions-item>
        <el-descriptions-item label="支付状态"><el-tag :type="statusType(current.payStatus)">{{ current.payStatus }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="订单状态"><el-tag :type="statusType(current.orderStatus)">{{ current.orderStatus }}</el-tag></el-descriptions-item>
      </el-descriptions>
      <el-timeline class="order-timeline">
        <el-timeline-item timestamp="创建订单">用户从小程序提交预约/开场请求</el-timeline-item>
        <el-timeline-item timestamp="支付校验">后端重算价格、优惠和时段可用性</el-timeline-item>
        <el-timeline-item timestamp="状态同步">支付回调或管理员操作写入日志</el-timeline-item>
      </el-timeline>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Download, Refresh, Search } from '@element-plus/icons-vue';
import { adminApi, records } from '../api/modules';
import { money, statusType } from '../utils/status';

const active = ref('reservation');
const orders = ref([]);
const storeOptions = ref([]);
const filters = reactive({ keyword: '', store: '', status: '', date: '' });
const detailVisible = ref(false);
const current = ref();

const filteredOrders = computed(() => orders.value.filter((item) => {
  const typeOk = active.value === 'reservation' ? item.type === '预约订单' : item.type === '开场订单';
  const orderNo = item.orderNo || item.id || '';
  const keywordOk = !filters.keyword || orderNo.includes(filters.keyword) || String(item.phone || '').includes(filters.keyword) || String(item.user || '').includes(filters.keyword);
  return typeOk && keywordOk && (!filters.store || item.store === filters.store) && (!filters.status || item.orderStatus === filters.status);
}));

function reset() {
  Object.assign(filters, { keyword: '', store: '', status: '', date: '' });
}

function view(row) {
  current.value = row;
  detailVisible.value = true;
}

function orderKey(row) {
  return row.id || row.orderId || row.orderNo;
}

async function confirm(row, action) {
  await ElMessageBox.confirm(`${action}：${row.orderNo || row.id}？`, '订单操作确认', { type: 'warning' });
  const id = orderKey(row);
  if (action === '确认到场') {
    await adminApi.arriveOrder(id);
  } else if (action === '申请退款') {
    await adminApi.refundOrder(id, { reason: '后台申请退款' });
  } else if (action === '取消订单') {
    await adminApi.cancelOrder(id);
  }
  ElMessage.success(`${action}成功`);
  loadOrders();
}

async function loadOrders() {
  try {
    const [orderData, storeData] = await Promise.all([adminApi.orders(), adminApi.stores()]);
    orders.value = records(orderData);
    storeOptions.value = records(storeData);
  } catch (error) {
    orders.value = [];
    storeOptions.value = [];
  }
}

onMounted(loadOrders);
</script>

<style scoped>
.pagination,
.order-timeline {
  margin-top: 16px;
}
</style>
