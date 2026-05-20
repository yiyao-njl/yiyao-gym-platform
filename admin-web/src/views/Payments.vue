<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">支付与退款</h1>
        <p class="page-subtitle">查看微信支付流水、回调状态和退款审核，实际状态以后端幂等回调结果为准。</p>
      </div>
      <el-button :icon="Refresh" @click="loadPayments(true)">刷新流水</el-button>
    </div>

    <div class="metric-grid">
      <article class="metric-card"><div class="metric-label">今日实收</div><div class="metric-value">{{ money((summary.todayAmountCent || 0) / 100) }}</div><div class="metric-note">以后端支付流水为准</div></article>
      <article class="metric-card"><div class="metric-label">支付成功</div><div class="metric-value">{{ summary.successCount || 0 }}</div><div class="metric-note">成功率 {{ percent(summary.successRate) }}</div></article>
      <article class="metric-card"><div class="metric-label">待审核退款</div><div class="metric-value">{{ summary.pendingRefundCount || 0 }}</div><div class="metric-note">需填写审核备注</div></article>
      <article class="metric-card"><div class="metric-label">异常回调</div><div class="metric-value">{{ summary.callbackErrorCount || 0 }}</div><div class="metric-note">建议人工核对</div></article>
    </div>

    <div class="toolbar">
      <el-input v-model="keyword" class="w-220" clearable placeholder="支付单号/订单号" />
      <el-select v-model="payStatus" class="w-160" clearable placeholder="支付状态">
        <el-option label="成功" value="成功" />
        <el-option label="失败" value="失败" />
      </el-select>
      <el-select v-model="refundStatus" class="w-160" clearable placeholder="退款状态">
        <el-option label="无退款" value="无退款" />
        <el-option label="待审核" value="待审核" />
      </el-select>
      <el-button type="primary" :icon="Search">查询</el-button>
      <el-button :icon="Refresh" @click="reset">重置</el-button>
    </div>

    <div class="panel">
      <el-table :data="filtered" stripe>
        <el-table-column prop="paymentNo" label="支付单号" min-width="150" />
        <el-table-column prop="orderId" label="订单号" min-width="150" />
        <el-table-column prop="amount" label="支付金额" width="100">
          <template #default="{ row }">{{ money(row.amount) }}</template>
        </el-table-column>
        <el-table-column prop="method" label="支付方式" width="110" />
        <el-table-column prop="payStatus" label="支付状态" width="100">
          <template #default="{ row }"><el-tag :type="statusType(row.payStatus)">{{ row.payStatus }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="refundStatus" label="退款状态" width="110">
          <template #default="{ row }"><el-tag :type="statusType(row.refundStatus)">{{ row.refundStatus }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="paidAt" label="支付时间" min-width="150" />
        <el-table-column prop="callback" label="回调结果" width="110" />
        <el-table-column label="操作" width="190" fixed="right">
          <template #default="{ row }">
            <span class="table-actions">
              <el-button link type="primary" @click="showCallback(row)">回调</el-button>
              <el-button link type="warning" :disabled="row.refundStatus !== '待审核'" @click="audit(row)">退款审核</el-button>
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="auditVisible" title="退款审核" width="520px">
      <el-form label-width="90px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.result">
            <el-radio label="同意退款" />
            <el-radio label="拒绝退款" />
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核备注">
          <el-input v-model="auditForm.remark" type="textarea" :rows="4" placeholder="请输入退款审核备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAudit">提交审核</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, Search } from '@element-plus/icons-vue';
import { adminApi, records } from '../api/modules';
import { money, statusType } from '../utils/status';

const keyword = ref('');
const payments = ref([]);
const summary = ref({});
const payStatus = ref('');
const refundStatus = ref('');
const auditVisible = ref(false);
const auditForm = reactive({ result: '同意退款', remark: '' });
const currentRefund = ref(null);

const filtered = computed(() => payments.value.filter((item) => (!keyword.value || String(item.paymentNo || '').includes(keyword.value) || String(item.orderNo || '').includes(keyword.value)) && (!payStatus.value || item.payStatus === payStatus.value) && (!refundStatus.value || item.refundStatus === refundStatus.value)));

function reset() {
  keyword.value = '';
  payStatus.value = '';
  refundStatus.value = '';
}

function showCallback(row) {
  ElMessageBox.alert(`支付单 ${row.paymentNo} 的微信回调最终状态：${row.callback}`, '回调结果');
}

function audit(row) {
  currentRefund.value = row;
  auditForm.remark = `审核 ${row.orderNo || row.paymentNo} 退款申请`;
  auditVisible.value = true;
}

async function submitAudit() {
  if (!auditForm.remark) {
    ElMessage.warning('请填写审核备注');
    return;
  }
  if (!currentRefund.value?.refundId) {
    ElMessage.warning('当前流水没有待审核退款申请');
    return;
  }
  await adminApi.auditRefund(currentRefund.value.refundId, { result: auditForm.result, remark: auditForm.remark });
  auditVisible.value = false;
  ElMessage.success('退款审核已提交');
  loadPayments();
}

async function loadPayments(showMessage = false) {
  try {
    const [paymentData, summaryData] = await Promise.all([adminApi.payments(), adminApi.paymentSummary()]);
    payments.value = records(paymentData);
    summary.value = summaryData || {};
    if (showMessage) ElMessage.success('支付流水已刷新');
  } catch (error) {
    payments.value = [];
    summary.value = {};
    if (showMessage) ElMessage.warning('后端暂不可用，暂无可展示数据');
  }
}

function percent(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

onMounted(loadPayments);
</script>
