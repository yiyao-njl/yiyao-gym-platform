<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">优惠券与活动</h1>
        <p class="page-subtitle">管理优惠券模板、首页活动、上下架状态和领取使用数据。</p>
      </div>
      <div class="table-actions">
        <el-button type="primary" :icon="Plus" @click="open('coupon')">新增优惠券</el-button>
        <el-button type="primary" plain :icon="Plus" @click="open('activity')">新增活动</el-button>
      </div>
    </div>

    <el-tabs v-model="active" class="tab-panel">
      <el-tab-pane label="优惠券管理" name="coupons">
        <div class="toolbar">
          <el-input v-model="keyword" class="w-220" clearable placeholder="优惠券名称/适用范围" />
          <el-select v-model="status" class="w-160" clearable placeholder="状态">
            <el-option label="发放中" value="发放中" />
            <el-option label="停用" value="停用" />
          </el-select>
          <el-button type="primary" :icon="Search">查询</el-button>
          <el-button :icon="Refresh" @click="reset">重置</el-button>
        </div>
        <el-table :data="filteredCoupons" stripe>
          <el-table-column prop="name" label="名称" min-width="150" />
          <el-table-column prop="amount" label="面额" width="90">
            <template #default="{ row }">{{ money(row.amount) }}</template>
          </el-table-column>
          <el-table-column prop="threshold" label="门槛" width="90">
            <template #default="{ row }">{{ money(row.threshold) }}</template>
          </el-table-column>
          <el-table-column prop="scope" label="适用范围" min-width="140" />
          <el-table-column label="发放/使用" width="120">
            <template #default="{ row }">{{ row.used }}/{{ row.total }}</template>
          </el-table-column>
          <el-table-column prop="valid" label="有效期" min-width="220" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }"><el-tag :type="statusType(row.status)">{{ row.status }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="210" fixed="right">
            <template #default="{ row }">
              <span class="table-actions">
                <el-button link type="primary" @click="editCoupon(row)">编辑</el-button>
                <el-button link type="warning" @click="confirm(`停用 ${row.name}`)">停用</el-button>
                <el-button link type="danger" @click="confirm(`删除 ${row.name}，已领取模板将仅做停用处理`)">删除</el-button>
              </span>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="活动管理" name="activities">
        <el-table :data="activities" stripe>
          <el-table-column prop="title" label="活动标题" min-width="170" />
          <el-table-column prop="type" label="活动类型" width="120" />
          <el-table-column prop="store" label="适用门店" width="120" />
          <el-table-column prop="time" label="活动时间" min-width="220" />
          <el-table-column prop="visits" label="浏览量" width="100" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }"><el-tag :type="statusType(row.status)">{{ row.status }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="210" fixed="right">
            <template #default="{ row }">
              <span class="table-actions">
                <el-button link type="primary" @click="editActivity(row)">编辑</el-button>
                <el-button link type="success" @click="confirm(`上架 ${row.title}`)">上架</el-button>
                <el-button link type="warning" @click="confirm(`下架 ${row.title}`)">下架</el-button>
              </span>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="visible" :title="dialogTitle" width="760px" @closed="formRef?.clearValidate()">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="112px">
        <template v-if="form.kind === 'coupon'">
          <el-form-item label="优惠券名称" prop="name">
            <el-input v-model="form.name" maxlength="40" show-word-limit placeholder="如：满 99 减 20" />
          </el-form-item>
          <el-form-item label="适用门店" prop="store">
            <el-select v-model="form.store" class="form-control">
              <el-option v-for="store in storeOptions" :key="store" :label="store" :value="store" />
            </el-select>
          </el-form-item>
          <div class="form-grid">
            <el-form-item label="优惠面额" prop="amount">
              <el-input-number v-model="form.amount" class="form-control" :min="0.01" :precision="2" :step="1" controls-position="right" />
            </el-form-item>
            <el-form-item label="使用门槛" prop="threshold">
              <el-input-number v-model="form.threshold" class="form-control" :min="0" :precision="2" :step="10" controls-position="right" />
            </el-form-item>
            <el-form-item label="发放总量" prop="total">
              <el-input-number v-model="form.total" class="form-control" :min="1" :precision="0" :step="10" controls-position="right" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio-button label="发放中" />
                <el-radio-button label="停用" />
              </el-radio-group>
            </el-form-item>
          </div>
        </template>

        <template v-else>
          <el-form-item label="活动标题" prop="title">
            <el-input v-model="form.title" maxlength="48" show-word-limit placeholder="如：周末篮球拼场季" />
          </el-form-item>
          <div class="form-grid">
            <el-form-item label="活动类型" prop="type">
              <el-select v-model="form.type" class="form-control" placeholder="请选择活动类型">
                <el-option label="满减活动" value="满减活动" />
                <el-option label="会员活动" value="会员活动" />
                <el-option label="限时折扣" value="限时折扣" />
                <el-option label="拼场活动" value="拼场活动" />
              </el-select>
            </el-form-item>
            <el-form-item label="适用门店" prop="store">
              <el-select v-model="form.store" class="form-control">
                <el-option v-for="store in storeOptions" :key="store" :label="store" :value="store" />
              </el-select>
            </el-form-item>
            <el-form-item label="活动状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio-button label="上架" />
                <el-radio-button label="下架" />
              </el-radio-group>
            </el-form-item>
          </div>
          <el-form-item label="封面图片" prop="image">
            <div class="cover-uploader">
              <input ref="fileInputRef" class="hidden-file" type="file" accept="image/*" @change="handleImageUpload" />
              <div class="cover-field">
                <div v-if="form.image" class="cover-thumb" @click="previewVisible = true">
                  <img :src="form.image" alt="" />
                </div>
                <div v-else class="upload-empty compact" @click="chooseImage">
                  <el-icon><Upload /></el-icon>
                  <span>上传封面</span>
                </div>
                <div class="cover-preview-row">
                  <el-button type="primary" plain :icon="Upload" @click="chooseImage">上传并处理</el-button>
                  <el-button :disabled="!form.image" @click="openCropEditor">重新处理</el-button>
                  <el-button :disabled="!form.image" @click="previewVisible = true">预览</el-button>
                  <el-button :disabled="!form.image" @click="clearCover">清除</el-button>
                </div>
              </div>
            </div>
          </el-form-item>
        </template>

        <el-form-item label="有效期" prop="validRanges">
          <div class="range-editor">
            <div v-for="(range, index) in form.validRanges" :key="index" class="range-row">
              <el-date-picker
                v-model="form.validRanges[index]"
                class="range-picker"
                type="daterange"
                value-format="YYYY-MM-DD"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                @change="validateRanges"
              />
              <el-button :icon="Delete" :disabled="form.validRanges.length === 1" @click="removeRange(index)" />
            </div>
            <el-button type="primary" plain :icon="Plus" @click="addRange">新建时间段</el-button>
          </div>
        </el-form-item>

        <el-form-item label="规则说明" prop="rule">
          <el-input v-model="form.rule" type="textarea" :rows="4" maxlength="500" show-word-limit placeholder="填写领取、使用、活动参与等规则" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="cropDialogVisible" title="图片处理" width="860px" append-to-body @opened="initCropBox">
      <div class="crop-dialog">
        <div class="cover-actions">
          <el-button type="primary" plain :icon="Upload" @click="chooseImage">重新选择</el-button>
          <el-radio-group v-model="cropRatio" @change="resetCropBox">
            <el-radio-button label="free">自由</el-radio-button>
            <el-radio-button label="16:9">16:9</el-radio-button>
            <el-radio-button label="4:3">4:3</el-radio-button>
            <el-radio-button label="1:1">1:1</el-radio-button>
            <el-radio-button label="3:4">3:4</el-radio-button>
          </el-radio-group>
          <el-radio-group v-model="cropShape" @change="handleShapeChange">
            <el-radio-button label="rect">矩形</el-radio-button>
            <el-radio-button label="round">圆角</el-radio-button>
            <el-radio-button label="circle">圆形</el-radio-button>
          </el-radio-group>
        </div>
        <div v-if="cropImageUrl" ref="cropStageRef" class="crop-stage" @pointerdown="startCropDrag">
          <img ref="cropImageRef" class="crop-image" :src="cropImageUrl" alt="" @load="initCropBox" />
          <div class="crop-mask"></div>
          <div
            class="crop-box"
            :class="`shape-${cropShape}`"
            :style="cropBoxStyle"
          ></div>
        </div>
      </div>
      <template #footer>
        <el-button @click="cropDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="applyCrop">应用裁剪</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="previewVisible" title="封面预览" width="720px" append-to-body>
      <div class="cover-large-preview">
        <img v-if="form.image" :src="form.image" alt="" />
      </div>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Delete, Plus, Refresh, Search, Upload } from '@element-plus/icons-vue';
import { adminApi, records } from '../api/modules';
import { money, statusType } from '../utils/status';

const active = ref('coupons');
const activities = ref([]);
const coupons = ref([]);
const keyword = ref('');
const status = ref('');
const visible = ref(false);
const cropDialogVisible = ref(false);
const previewVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref();
const fileInputRef = ref();
const cropStageRef = ref();
const cropImageRef = ref();
const editingId = ref('');
const storeOptions = ref(['全部门店']);
const cropImageUrl = ref('');
const cropRatio = ref('16:9');
const cropShape = ref('rect');
const cropBox = reactive({ left: 0, top: 0, width: 0, height: 0 });
let dragState = null;

const form = reactive(defaultForm('coupon'));

const rules = {
  name: [{ required: true, message: '请输入优惠券名称', trigger: 'blur' }],
  title: [{ required: true, message: '请输入活动标题', trigger: 'blur' }],
  store: [{ required: true, message: '请选择适用门店', trigger: 'change' }],
  amount: [{ required: true, message: '请输入优惠面额', trigger: 'change' }],
  threshold: [{ required: true, message: '请输入使用门槛', trigger: 'change' }],
  total: [{ required: true, message: '请输入发放总量', trigger: 'change' }],
  type: [{ required: true, message: '请选择活动类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  validRanges: [{ validator: validateRangeRule, trigger: 'change' }],
  rule: [{ required: true, message: '请输入规则说明', trigger: 'blur' }]
};

const filteredCoupons = computed(() => coupons.value.filter((item) => {
  const text = `${item.name || ''}${item.scope || ''}`;
  return (!keyword.value || text.includes(keyword.value)) && (!status.value || item.status === status.value);
}));

const cropBoxStyle = computed(() => ({
  left: `${cropBox.left}px`,
  top: `${cropBox.top}px`,
  width: `${cropBox.width}px`,
  height: `${cropBox.height}px`
}));

function defaultForm(kind) {
  return {
    kind,
    id: '',
    name: '',
    title: '',
    store: '全部门店',
    amount: 20,
    threshold: 99,
    total: 100,
    type: '',
    status: kind === 'coupon' ? '发放中' : '上架',
    image: '',
    validRanges: [['', '']],
    rule: ''
  };
}

function reset() {
  keyword.value = '';
  status.value = '';
}

function open(kind) {
  editingId.value = '';
  dialogTitle.value = kind === 'coupon' ? '新增优惠券' : '新增活动';
  Object.assign(form, defaultForm(kind));
  resetCoverCrop();
  visible.value = true;
  nextTick(() => formRef.value?.clearValidate());
}

function editCoupon(row) {
  editingId.value = row.id || row.couponId || '';
  dialogTitle.value = `编辑优惠券：${row.name}`;
  Object.assign(form, {
    ...defaultForm('coupon'),
    id: editingId.value,
    name: row.name || '',
    store: row.store || row.scope || '全部门店',
    amount: amountValue(row.amount, row.amountCent),
    threshold: amountValue(row.threshold, row.thresholdCent),
    total: Number(row.total ?? 1),
    status: row.status || '发放中',
    validRanges: parseRanges(row.valid),
    rule: row.rule || row.rules || ''
  });
  resetCoverCrop();
  visible.value = true;
  nextTick(() => formRef.value?.clearValidate());
}

function editActivity(row) {
  editingId.value = row.id || row.activityId || '';
  dialogTitle.value = `编辑活动：${row.title}`;
  Object.assign(form, {
    ...defaultForm('activity'),
    id: editingId.value,
    title: row.title || '',
    type: row.type || '',
    store: row.store || '全部门店',
    status: row.status || '上架',
    image: row.image || '',
    validRanges: parseRanges(row.time),
    rule: row.rule || row.rules || ''
  });
  cropImageUrl.value = row.image || '';
  visible.value = true;
  nextTick(() => {
    formRef.value?.clearValidate();
  });
}

function chooseImage() {
  fileInputRef.value?.click();
}

function handleImageUpload(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请上传图片文件');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 5MB');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const imageUrl = String(reader.result || '');
    cropImageUrl.value = imageUrl;
    form.image = imageUrl;
    cropDialogVisible.value = true;
    nextTick(initCropBox);
  };
  reader.readAsDataURL(file);
}

function openCropEditor() {
  if (!form.image) return;
  cropImageUrl.value = form.image;
  cropDialogVisible.value = true;
  nextTick(initCropBox);
}

function handleShapeChange() {
  if (cropShape.value === 'circle') cropRatio.value = '1:1';
  resetCropBox();
}

function resetCoverCrop() {
  cropDialogVisible.value = false;
  previewVisible.value = false;
  cropImageUrl.value = '';
  cropRatio.value = '16:9';
  cropShape.value = 'rect';
  Object.assign(cropBox, { left: 0, top: 0, width: 0, height: 0 });
}

function clearCover() {
  form.image = '';
  resetCoverCrop();
}

function initCropBox() {
  const rect = imageDisplayRect();
  if (!rect.width || !rect.height) return;
  const ratio = activeRatio();
  let width = rect.width * 0.72;
  let height = ratio ? width / ratio : rect.height * 0.58;
  if (height > rect.height * 0.72) {
    height = rect.height * 0.72;
    width = ratio ? height * ratio : rect.width * 0.72;
  }
  Object.assign(cropBox, {
    left: rect.left + (rect.width - width) / 2,
    top: rect.top + (rect.height - height) / 2,
    width,
    height
  });
}

function resetCropBox() {
  nextTick(initCropBox);
}

function startCropDrag(event) {
  if (!cropImageUrl.value) return;
  const rect = imageDisplayRect();
  if (!rect.width || !rect.height) return;
  const point = stagePoint(event);
  const inside = point.x >= cropBox.left && point.x <= cropBox.left + cropBox.width && point.y >= cropBox.top && point.y <= cropBox.top + cropBox.height;
  dragState = {
    mode: inside ? 'move' : 'draw',
    startX: point.x,
    startY: point.y,
    original: { ...cropBox },
    rect
  };
  event.currentTarget.setPointerCapture?.(event.pointerId);
  window.addEventListener('pointermove', handleCropDrag);
  window.addEventListener('pointerup', stopCropDrag, { once: true });
}

function handleCropDrag(event) {
  if (!dragState) return;
  const point = stagePoint(event);
  if (dragState.mode === 'move') {
    const next = {
      ...dragState.original,
      left: dragState.original.left + point.x - dragState.startX,
      top: dragState.original.top + point.y - dragState.startY
    };
    Object.assign(cropBox, clampBox(next, dragState.rect));
    return;
  }
  Object.assign(cropBox, clampBox(drawBox(dragState.startX, dragState.startY, point.x, point.y, dragState.rect), dragState.rect));
}

function stopCropDrag() {
  window.removeEventListener('pointermove', handleCropDrag);
  dragState = null;
}

function drawBox(startX, startY, endX, endY, rect) {
  const ratio = activeRatio();
  let left = Math.min(startX, endX);
  let top = Math.min(startY, endY);
  let width = Math.abs(endX - startX);
  let height = Math.abs(endY - startY);
  if (ratio) {
    if (width / Math.max(height, 1) > ratio) width = height * ratio;
    else height = width / ratio;
    left = endX < startX ? startX - width : startX;
    top = endY < startY ? startY - height : startY;
  }
  return { left, top, width: Math.max(width, 24), height: Math.max(height, 24), rect };
}

function clampBox(box, rect) {
  const width = Math.min(Math.max(box.width, 24), rect.width);
  const height = Math.min(Math.max(box.height, 24), rect.height);
  return {
    left: Math.min(Math.max(box.left, rect.left), rect.left + rect.width - width),
    top: Math.min(Math.max(box.top, rect.top), rect.top + rect.height - height),
    width,
    height
  };
}

function activeRatio() {
  if (cropShape.value === 'circle') return 1;
  if (cropRatio.value === 'free') return 0;
  const [width, height] = cropRatio.value.split(':').map(Number);
  return width && height ? width / height : 0;
}

function stagePoint(event) {
  const bounds = cropStageRef.value.getBoundingClientRect();
  return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
}

function imageDisplayRect() {
  const stage = cropStageRef.value;
  const image = cropImageRef.value;
  if (!stage || !image?.naturalWidth || !image?.naturalHeight) return { left: 0, top: 0, width: 0, height: 0 };
  const bounds = stage.getBoundingClientRect();
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const stageRatio = bounds.width / bounds.height;
  if (imageRatio > stageRatio) {
    const width = bounds.width;
    const height = width / imageRatio;
    return { left: 0, top: (bounds.height - height) / 2, width, height };
  }
  const height = bounds.height;
  const width = height * imageRatio;
  return { left: (bounds.width - width) / 2, top: 0, width, height };
}

function applyCrop() {
  const image = cropImageRef.value;
  const rect = imageDisplayRect();
  if (!image || !rect.width || !cropBox.width || !cropBox.height) {
    ElMessage.warning('请先选择裁剪区域');
    return;
  }
  const scaleX = image.naturalWidth / rect.width;
  const scaleY = image.naturalHeight / rect.height;
  const sourceX = Math.max(0, (cropBox.left - rect.left) * scaleX);
  const sourceY = Math.max(0, (cropBox.top - rect.top) * scaleY);
  const sourceWidth = Math.min(image.naturalWidth - sourceX, cropBox.width * scaleX);
  const sourceHeight = Math.min(image.naturalHeight - sourceY, cropBox.height * scaleY);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sourceWidth);
  canvas.height = Math.round(sourceHeight);
  const context = canvas.getContext('2d');
  if (!context) {
    ElMessage.warning('当前浏览器无法处理图片裁剪');
    return;
  }
  clipCropCanvas(context, canvas.width, canvas.height);
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
  context.restore();
  form.image = canvas.toDataURL('image/png');
  cropDialogVisible.value = false;
  ElMessage.success('封面裁剪已应用');
}

function clipCropCanvas(context, width, height) {
  context.save();
  context.beginPath();
  if (cropShape.value === 'circle') {
    const radius = Math.min(width, height) / 2;
    context.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
  } else if (cropShape.value === 'round') {
    const radius = Math.min(width, height) * 0.08;
    roundedRect(context, 0, 0, width, height, radius);
  } else {
    context.rect(0, 0, width, height);
  }
  context.clip();
}

function roundedRect(context, x, y, width, height, radius) {
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
}

function addRange() {
  const result = getRangeError(form.validRanges);
  if (result) {
    ElMessage.warning(result);
    formRef.value?.validateField('validRanges');
    return;
  }
  form.validRanges.push(['', '']);
}

function removeRange(index) {
  form.validRanges.splice(index, 1);
  validateRanges();
}

function validateRanges() {
  formRef.value?.validateField('validRanges');
}

function validateRangeRule(rule, value, callback) {
  const result = getRangeError(value);
  if (result) callback(new Error(result));
  else callback();
}

function getRangeError(ranges) {
  if (!ranges?.length) return '请至少设置一个有效期';
  const normalized = [];
  for (const range of ranges) {
    if (!range?.[0] || !range?.[1]) return '请完整选择每个时间段的开始和结束日期';
    const start = new Date(`${range[0]}T00:00:00`).getTime();
    const end = new Date(`${range[1]}T23:59:59`).getTime();
    if (start > end) return '结束日期不能早于开始日期';
    normalized.push({ start, end });
  }
  for (let i = 0; i < normalized.length; i += 1) {
    for (let j = i + 1; j < normalized.length; j += 1) {
      if (normalized[i].start <= normalized[j].end && normalized[j].start <= normalized[i].end) {
        return '多段有效期不能有交集';
      }
    }
  }
  return '';
}

function parseRanges(text) {
  if (!text) return [['', '']];
  const ranges = String(text).split(/[；;]/).map((item) => {
    const match = item.match(/(\d{4}-\d{2}-\d{2}).*?(\d{4}-\d{2}-\d{2})/);
    return match ? [match[1], match[2]] : null;
  }).filter(Boolean);
  return ranges.length ? ranges : [['', '']];
}

function formatRanges(ranges) {
  return ranges.map(([start, end]) => `${start} 至 ${end}`).join('；');
}

function amountValue(value, centValue) {
  if (value !== undefined && value !== null && value !== '') return Number(value);
  if (centValue !== undefined && centValue !== null && centValue !== '') return Number(centValue) / 100;
  return 0;
}

function save() {
  formRef.value.validate((valid) => {
    if (!valid) return;
    if (form.kind === 'coupon') {
      const id = editingId.value || `C${Date.now()}`;
      const payload = {
        id,
        couponId: id,
        name: form.name,
        amount: form.amount,
        threshold: form.threshold,
        scope: form.store,
        total: form.total,
        used: 0,
        status: form.status,
        valid: formatRanges(form.validRanges),
        rules: form.rule
      };
      upsert(coupons.value, payload);
    } else {
      const id = editingId.value || `A${Date.now()}`;
      const payload = {
        id,
        activityId: id,
        title: form.title,
        type: form.type,
        store: form.store,
        time: formatRanges(form.validRanges),
        visits: 0,
        status: form.status,
        image: form.image,
        rules: form.rule
      };
      upsert(activities.value, payload);
    }
    visible.value = false;
    ElMessage.success('营销配置已保存');
  });
}

function upsert(list, payload) {
  const index = list.findIndex((item) => item.id === editingId.value || item.couponId === editingId.value || item.activityId === editingId.value);
  if (index >= 0) list.splice(index, 1, { ...list[index], ...payload });
  else list.unshift(payload);
}

function confirm(text) {
  ElMessageBox.confirm(`${text}？`, '营销操作确认', { type: 'warning' }).then(() => ElMessage.success('操作成功'));
}

async function loadMarketing() {
  try {
    const [couponData, activityData, storeData] = await Promise.all([adminApi.coupons(), adminApi.activities(), adminApi.stores()]);
    coupons.value = records(couponData);
    activities.value = records(activityData);
    storeOptions.value = ['全部门店', ...records(storeData).map((item) => item.name).filter(Boolean)];
  } catch (error) {
    coupons.value = [];
    activities.value = [];
    storeOptions.value = ['全部门店'];
  }
}

onMounted(loadMarketing);
</script>

<style scoped>
.form-control {
  width: 100%;
}

.range-editor {
  display: grid;
  width: 100%;
  gap: 10px;
}

.range-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 40px;
  gap: 8px;
  align-items: center;
}

.range-picker {
  width: 100%;
}

.cover-uploader {
  display: grid;
  width: 100%;
  gap: 12px;
}

.cover-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.hidden-file {
  display: none;
}

.upload-empty {
  display: grid;
  place-items: center;
  gap: 8px;
  color: var(--muted);
  background: #f8fafc;
  border: 1px dashed #c8d3e0;
  border-radius: 8px;
  cursor: pointer;
}

.upload-empty .el-icon {
  font-size: 28px;
}

.upload-empty.compact {
  width: 240px;
  height: 135px;
}

.crop-dialog {
  display: grid;
  gap: 14px;
}

.crop-stage {
  position: relative;
  width: 100%;
  height: 320px;
  overflow: hidden;
  background: #0f172a;
  border: 1px solid var(--line);
  border-radius: 8px;
  cursor: crosshair;
  touch-action: none;
}

.crop-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
}

.crop-mask {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(45deg, rgba(255, 255, 255, 0.06) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(255, 255, 255, 0.06) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.06) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.06) 75%);
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
  background-size: 16px 16px;
  pointer-events: none;
}

.crop-box {
  position: absolute;
  background: rgba(64, 158, 255, 0.18);
  border: 2px solid #409eff;
  box-shadow: 0 0 0 999px rgba(15, 23, 42, 0.48);
  cursor: move;
}

.crop-box::before,
.crop-box::after {
  position: absolute;
  content: "";
  inset: 33.333% 0 auto;
  height: 1px;
  background: rgba(255, 255, 255, 0.8);
}

.crop-box::after {
  inset: 0 auto 0 33.333%;
  width: 1px;
  height: auto;
}

.shape-round {
  border-radius: 18px;
}

.shape-circle {
  border-radius: 50%;
}

.cover-preview-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.cover-field {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
}

.cover-thumb {
  width: 240px;
  height: 135px;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid var(--line);
  border-radius: 8px;
  cursor: zoom-in;
}

.cover-thumb img,
.cover-large-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-large-preview {
  width: 100%;
  max-height: 68vh;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid var(--line);
  border-radius: 8px;
}

.cover-large-preview img {
  max-height: 68vh;
  object-fit: contain;
}
</style>
