<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">评价管理</h1>
        <p class="page-subtitle">审核用户评价、后台回复、隐藏违规内容，并记录管理员操作。</p>
      </div>
      <el-button :icon="Refresh" @click="loadReviews(true)">刷新</el-button>
    </div>

    <div class="toolbar">
      <el-input v-model="keyword" class="w-220" clearable placeholder="用户/场地/订单" />
      <el-select v-model="status" class="w-160" clearable placeholder="审核状态">
        <el-option label="待审核" value="待审核" />
        <el-option label="已展示" value="已展示" />
        <el-option label="已隐藏" value="已隐藏" />
      </el-select>
      <el-button type="primary" :icon="Search">查询</el-button>
      <el-button :icon="Refresh" @click="reset">重置</el-button>
    </div>

    <div class="panel">
      <el-table :data="filtered" stripe>
        <el-table-column prop="user" label="用户" width="110" />
        <el-table-column prop="venue" label="场地" min-width="150" />
        <el-table-column prop="orderId" label="订单号" min-width="150" />
        <el-table-column prop="rating" label="评分" width="130">
          <template #default="{ row }"><el-rate v-model="row.rating" disabled /></template>
        </el-table-column>
        <el-table-column prop="content" label="评价内容" min-width="220" />
        <el-table-column prop="reply" label="后台回复" min-width="160" />
        <el-table-column prop="submittedAt" label="提交时间" min-width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><el-tag :type="statusType(row.status)">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <span class="table-actions">
              <el-button link type="primary" @click="reply(row)">回复</el-button>
              <el-button link type="success" @click="confirm(`恢复展示 ${row.id}`, row, '已展示')">展示</el-button>
              <el-button link type="warning" @click="confirm(`隐藏 ${row.id}`, row, '已隐藏')">隐藏</el-button>
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="visible" title="后台回复" width="520px">
      <el-form label-width="80px">
        <el-form-item label="评价内容">{{ current?.content }}</el-form-item>
        <el-form-item label="回复"><el-input v-model="replyText" type="textarea" :rows="4" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="submit">保存回复</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, Search } from '@element-plus/icons-vue';
import { adminApi, records } from '../api/modules';
import { statusType } from '../utils/status';

const keyword = ref('');
const reviews = ref([]);
const status = ref('');
const visible = ref(false);
const current = ref();
const replyText = ref('');

const filtered = computed(() => reviews.value.filter((item) => (!keyword.value || String(item.user || '').includes(keyword.value) || String(item.venue || '').includes(keyword.value) || String(item.orderId || '').includes(keyword.value)) && (!status.value || item.status === status.value)));

function reset() {
  keyword.value = '';
  status.value = '';
}

function reply(row) {
  current.value = row;
  replyText.value = row.reply;
  visible.value = true;
}

async function submit() {
  await adminApi.updateReview(current.value.id || current.value.reviewId, { reply: replyText.value });
  visible.value = false;
  ElMessage.success('回复已保存');
  loadReviews();
}

async function confirm(text, row, nextStatus) {
  await ElMessageBox.confirm(`${text}？该操作会记录管理员和操作时间。`, '评价操作确认', { type: 'warning' });
  await adminApi.updateReview(row.id || row.reviewId, { status: nextStatus });
  ElMessage.success('操作成功');
  loadReviews();
}

async function loadReviews(showMessage = false) {
  try {
    reviews.value = records(await adminApi.reviews());
    if (showMessage) ElMessage.success('评价列表已刷新');
  } catch (error) {
    reviews.value = [];
    if (showMessage) ElMessage.warning('后端暂不可用，暂无可展示数据');
  }
}

onMounted(loadReviews);
</script>
