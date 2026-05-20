<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">系统管理</h1>
        <p class="page-subtitle">管理员资料、员工账号、角色权限、操作日志和基础参数。</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openAccount()">新增员工</el-button>
    </div>

    <div class="two-col">
      <div class="panel">
        <div class="panel-title">当前管理员</div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="姓名">{{ auth.user.name }}</el-descriptions-item>
          <el-descriptions-item label="账号">{{ auth.user.account }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ auth.user.phone }}</el-descriptions-item>
          <el-descriptions-item label="角色">{{ auth.user.role }}</el-descriptions-item>
          <el-descriptions-item label="所属门店">{{ auth.user.store }}</el-descriptions-item>
          <el-descriptions-item label="最近登录">{{ auth.user.lastLoginAt }}</el-descriptions-item>
        </el-descriptions>
        <div class="system-actions">
          <el-button type="primary" @click="profileVisible = true">编辑资料</el-button>
          <el-button @click="passwordVisible = true">修改密码</el-button>
          <el-button type="danger" plain @click="logout">退出登录</el-button>
        </div>
      </div>
      <div class="panel">
        <div class="panel-title">基础参数</div>
        <el-form label-width="130px">
          <el-form-item label="最大预约天数"><el-input-number v-model="settings.days" :min="1" :max="14" /></el-form-item>
          <el-form-item label="最小预约单位"><el-input-number v-model="settings.unit" :step="15" :min="15" /> 分钟</el-form-item>
          <el-form-item label="订单超时关闭"><el-input-number v-model="settings.timeout" :min="5" /> 分钟</el-form-item>
          <el-form-item label="退款审核开关"><el-switch v-model="settings.refundAudit" /></el-form-item>
          <el-form-item><el-button type="primary" @click="ElMessage.success('系统参数已保存')">保存参数</el-button></el-form-item>
        </el-form>
      </div>
    </div>

    <div class="panel">
      <div class="panel-title">员工账号与权限</div>
      <el-table :data="accounts" stripe>
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="account" label="账号" width="120" />
        <el-table-column prop="phone" label="手机号" width="130">
          <template #default="{ row }">{{ row.phone || '-' }}</template>
        </el-table-column>
        <el-table-column prop="employeeNo" label="员工编号" width="150">
          <template #default="{ row }">{{ row.employeeNo || row.employeeCode || '-' }}</template>
        </el-table-column>
        <el-table-column prop="position" label="岗位" width="110">
          <template #default="{ row }">{{ row.position || '-' }}</template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="100" />
        <el-table-column prop="store" label="门店范围" min-width="140" />
        <el-table-column prop="permissions" label="权限范围" min-width="260" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }"><el-tag :type="statusType(row.status)">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <span class="table-actions">
              <el-button link type="primary" @click="editAccount(row)">编辑</el-button>
              <el-button link type="danger" @click="confirm(`停用账号 ${row.account}`)">停用</el-button>
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="panel">
      <div class="panel-title">近期操作日志</div>
      <el-table :data="logs" stripe>
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column prop="module" label="模块" width="120" />
        <el-table-column prop="action" label="操作内容" min-width="220" />
        <el-table-column prop="ip" label="IP/来源" width="130" />
        <el-table-column prop="time" label="操作时间" width="170" />
      </el-table>
    </div>

    <el-dialog v-model="profileVisible" title="编辑资料" width="520px">
      <el-form :model="profileForm" label-width="90px">
        <el-form-item label="昵称"><el-input v-model="profileForm.name" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model="profileForm.phone" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="profileVisible = false">取消</el-button><el-button type="primary" @click="save">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="passwordVisible" title="修改密码" width="520px">
      <el-form label-width="100px">
        <el-form-item label="原密码"><el-input type="password" show-password /></el-form-item>
        <el-form-item label="新密码"><el-input type="password" show-password /></el-form-item>
        <el-form-item label="确认密码"><el-input type="password" show-password /></el-form-item>
      </el-form>
      <template #footer><el-button @click="passwordVisible = false">取消</el-button><el-button type="primary" @click="savePassword">确认修改</el-button></template>
    </el-dialog>

    <el-dialog v-model="accountVisible" :title="accountDialogTitle" width="760px" @closed="accountFormRef?.clearValidate()">
      <el-form ref="accountFormRef" :model="accountForm" :rules="accountRules" label-width="104px">
        <div class="form-section-title">员工信息</div>
        <div class="form-grid">
          <el-form-item label="员工姓名" prop="name">
            <el-input v-model.trim="accountForm.name" maxlength="20" show-word-limit placeholder="请输入真实姓名" />
          </el-form-item>
          <el-form-item label="手机号" prop="phone">
            <el-input v-model.trim="accountForm.phone" maxlength="11" placeholder="用于登录验证和通知" />
          </el-form-item>
          <el-form-item label="员工编号" prop="employeeNo">
            <el-input v-model.trim="accountForm.employeeNo" maxlength="24" placeholder="如 EMP20260518001" />
          </el-form-item>
          <el-form-item label="岗位" prop="position">
            <el-select v-model="accountForm.position" class="form-control" placeholder="请选择岗位">
              <el-option label="店长" value="店长" />
              <el-option label="前台收银" value="前台收银" />
              <el-option label="场地运营" value="场地运营" />
              <el-option label="财务审核" value="财务审核" />
            </el-select>
          </el-form-item>
        </div>

        <div class="form-section-title">账号归属</div>
        <div class="form-grid">
          <el-form-item label="登录账号" prop="account">
            <el-input v-model.trim="accountForm.account" maxlength="32" placeholder="英文、数字或下划线，4-32 位" />
          </el-form-item>
          <el-form-item label="初始密码" prop="password">
            <el-input v-model.trim="accountForm.password" type="password" show-password maxlength="32" placeholder="新增时必填，至少 8 位" />
          </el-form-item>
          <el-form-item label="角色" prop="role">
            <el-select v-model="accountForm.role" class="form-control" placeholder="请选择角色">
              <el-option label="店长" value="店长" />
              <el-option label="员工" value="员工" />
              <el-option label="财务" value="财务" />
              <el-option label="运营" value="运营" />
            </el-select>
          </el-form-item>
          <el-form-item label="所属门店" prop="store">
            <el-select v-model="accountForm.store" class="form-control" placeholder="请选择门店">
              <el-option v-for="store in storeOptions" :key="store" :label="store" :value="store" />
            </el-select>
          </el-form-item>
          <el-form-item label="账号状态" prop="status">
            <el-radio-group v-model="accountForm.status">
              <el-radio-button label="正常" />
              <el-radio-button label="停用" />
            </el-radio-group>
          </el-form-item>
        </div>

        <el-form-item label="权限范围" prop="permissions">
          <el-checkbox-group v-model="accountForm.permissions" class="permission-grid">
            <el-checkbox v-for="permission in permissionOptions" :key="permission.value" :label="permission.value">
              <span class="permission-name">{{ permission.label }}</span>
              <span class="permission-desc">{{ permission.desc }}</span>
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="accountVisible = false">取消</el-button><el-button type="primary" @click="saveAccount">保存</el-button></template>
    </el-dialog>
  </section>
</template>

<script setup>
import { nextTick, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { adminApi, records } from '../api/modules';
import { useAuthStore } from '../stores/auth';
import { statusType } from '../utils/status';

const auth = useAuthStore();
const profileVisible = ref(false);
const passwordVisible = ref(false);
const accountVisible = ref(false);
const accountFormRef = ref();
const accountDialogTitle = ref('新增员工');
const editingAccountId = ref('');
const settings = reactive({ days: 7, unit: 30, timeout: 15, refundAudit: true });
const profileForm = reactive({ name: auth.user.name, phone: auth.user.phone });
const storeOptions = ref(['全部门店']);
const permissionOptions = [
  { label: '门店管理', value: '门店管理', desc: '维护门店、场地、营业状态' },
  { label: '订单管理', value: '订单管理', desc: '查看订单、核销到场、处理取消' },
  { label: '退款审核', value: '退款审核', desc: '处理退款申请与审核备注' },
  { label: '数据统计', value: '数据统计', desc: '查看经营看板与导出报表' }
];
const accountForm = reactive(defaultAccountForm());
const logs = ref([]);
const accounts = ref([]);

const accountRules = {
  name: [{ required: true, message: '请输入员工姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入 11 位有效手机号', trigger: 'blur' }
  ],
  employeeNo: [{ required: true, message: '请输入员工编号', trigger: 'blur' }],
  position: [{ required: true, message: '请选择岗位', trigger: 'change' }],
  account: [
    { required: true, message: '请输入登录账号', trigger: 'blur' },
    { pattern: /^[A-Za-z0-9_]{4,32}$/, message: '账号需为英文、数字或下划线，4-32 位', trigger: 'blur' }
  ],
  password: [{ validator: validatePassword, trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  store: [{ required: true, message: '请选择所属门店', trigger: 'change' }],
  status: [{ required: true, message: '请选择账号状态', trigger: 'change' }],
  permissions: [{ validator: validatePermissions, trigger: 'change' }]
};

function save() {
  profileVisible.value = false;
  ElMessage.success('资料已保存');
}

function savePassword() {
  passwordVisible.value = false;
  ElMessage.success('密码已修改，建议重新登录');
}

function defaultAccountForm() {
  return {
    id: '',
    name: '',
    phone: '',
    employeeNo: '',
    position: '',
    account: '',
    password: '',
    role: '员工',
    store: '伊幺体育中心店',
    status: '正常',
    permissions: ['订单管理']
  };
}

function openAccount() {
  editingAccountId.value = '';
  accountDialogTitle.value = '新增员工';
  Object.assign(accountForm, defaultAccountForm());
  accountVisible.value = true;
  nextTick(() => accountFormRef.value?.clearValidate());
}

function editAccount(row) {
  editingAccountId.value = row.id || row.account || '';
  accountDialogTitle.value = `编辑员工：${row.name || row.account}`;
  Object.assign(accountForm, {
    ...defaultAccountForm(),
    id: editingAccountId.value,
    name: row.name || '',
    phone: row.phone || '',
    employeeNo: row.employeeNo || row.employeeCode || '',
    position: row.position || (row.role === '店长' ? '店长' : '场地运营'),
    account: row.account || '',
    password: '',
    role: row.role || '员工',
    store: row.store || '伊幺体育中心店',
    status: row.status || '正常',
    permissions: normalizePermissions(row.permissions)
  });
  accountVisible.value = true;
  nextTick(() => accountFormRef.value?.clearValidate());
}

function saveAccount() {
  accountFormRef.value.validate((valid) => {
    if (!valid) return;
    const payload = {
      id: editingAccountId.value || `account-${Date.now()}`,
      name: accountForm.name,
      phone: accountForm.phone,
      employeeNo: accountForm.employeeNo,
      position: accountForm.position,
      account: accountForm.account,
      role: accountForm.role,
      store: accountForm.store,
      permissions: accountForm.permissions.join('、'),
      status: accountForm.status
    };
    const index = accounts.value.findIndex((item) => (item.id || item.account) === editingAccountId.value);
    if (index >= 0) accounts.value.splice(index, 1, { ...accounts.value[index], ...payload });
    else accounts.value.unshift(payload);
    accountVisible.value = false;
    ElMessage.success('员工账号已保存');
  });
}

function normalizePermissions(value) {
  if (Array.isArray(value)) return value.filter((item) => permissionOptions.some((permission) => permission.value === item));
  if (!value || value === '全部权限') return permissionOptions.map((permission) => permission.value);
  const permissions = String(value).split(/[、,，]/).map((item) => item.trim()).filter(Boolean);
  return permissions.filter((item) => permissionOptions.some((permission) => permission.value === item));
}

function validatePassword(rule, value, callback) {
  if (!editingAccountId.value && !value) {
    callback(new Error('请输入初始密码'));
    return;
  }
  if (value && value.length < 8) {
    callback(new Error('密码至少 8 位'));
    return;
  }
  callback();
}

function validatePermissions(rule, value, callback) {
  if (!value?.length) {
    callback(new Error('请至少选择一项权限'));
    return;
  }
  callback();
}

function confirm(text) {
  ElMessageBox.confirm(`${text}？`, '账号操作确认', { type: 'warning' }).then(() => ElMessage.success('操作成功'));
}

function logout() {
  ElMessageBox.confirm('确认退出当前后台账号？', '退出登录', { type: 'warning' }).then(() => auth.logout());
}

async function loadSystem() {
  try {
    const [accountData, logData, storeData] = await Promise.all([adminApi.accounts(), adminApi.logs(), adminApi.stores()]);
    accounts.value = records(accountData).map((item) => ({ ...item, permissions: item.permissions || '未配置' }));
    logs.value = records(logData);
    storeOptions.value = ['全部门店', ...records(storeData).map((item) => item.name).filter(Boolean)];
  } catch (error) {
    accounts.value = [];
    logs.value = [];
    storeOptions.value = ['全部门店'];
  }
}

onMounted(loadSystem);
</script>

<style scoped>
.system-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.form-control {
  width: 100%;
}

.form-section-title {
  margin: 2px 0 14px;
  color: var(--text);
  font-size: 14px;
  font-weight: 700;
}

.form-section-title:not(:first-child) {
  margin-top: 8px;
}

.permission-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: 100%;
  gap: 10px 14px;
}

.permission-grid :deep(.el-checkbox) {
  align-items: flex-start;
  height: auto;
  margin-right: 0;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
}

.permission-grid :deep(.el-checkbox__label) {
  display: grid;
  gap: 4px;
  white-space: normal;
}

.permission-name {
  color: var(--text);
  font-weight: 700;
}

.permission-desc {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.45;
}

@media (max-width: 760px) {
  .permission-grid {
    grid-template-columns: 1fr;
  }
}
</style>
