<template>
  <main class="login-page">
    <section class="login-visual">
      <div class="visual-copy">
        <span>YIYAO GYM OPS</span>
        <h1>体育馆运营管理系统</h1>
        <p>统一管理门店、场地、预约、支付、退款、会员营销与经营数据。</p>
      </div>
    </section>
    <section class="login-panel">
      <div class="login-card">
        <h2>管理员登录</h2>
        <p>登录信息由 `/api/auth/admin/login` 校验。</p>
        <el-form :model="form" :rules="rules" ref="formRef" label-position="top" @keyup.enter="submit">
          <el-form-item label="账号" prop="account">
            <el-input v-model="form.account" size="large" prefix-icon="User" placeholder="admin / manager / staff" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" size="large" prefix-icon="Lock" type="password" show-password placeholder="admin123" />
          </el-form-item>
          <el-form-item label="验证码" prop="captcha">
            <div class="captcha-row">
              <el-input v-model="form.captcha" size="large" placeholder="输入 2026" />
              <div class="captcha">2026</div>
            </div>
          </el-form-item>
          <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="submit">登录</el-button>
        </el-form>
      </div>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();
const formRef = ref();
const loading = ref(false);
const form = reactive({ account: 'admin', password: 'admin123', captcha: '2026' });
const rules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
};

async function submit() {
  await formRef.value.validate();
  loading.value = true;
  try {
    await auth.login(form);
    ElMessage.success('登录成功');
    router.replace('/dashboard');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(420px, 0.9fr);
  min-height: 100vh;
  background: #f5f7fb;
}

.login-visual {
  display: flex;
  align-items: flex-end;
  min-height: 100vh;
  padding: 64px;
  color: #fff;
  background:
    linear-gradient(180deg, rgba(7, 30, 25, 0.28), rgba(7, 30, 25, 0.88)),
    url('../assets/gym-admin-bg.svg');
  background-size: cover;
  background-position: center;
}

.visual-copy {
  max-width: 640px;
}

.visual-copy span {
  font-size: 13px;
  font-weight: 800;
}

.visual-copy h1 {
  margin: 14px 0;
  font-size: 46px;
  line-height: 1.1;
}

.visual-copy p {
  max-width: 520px;
  margin: 0;
  color: #d7ece5;
  font-size: 17px;
  line-height: 1.8;
}

.login-panel {
  display: grid;
  place-items: center;
  padding: 40px;
}

.login-card {
  width: min(100%, 420px);
  padding: 34px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(16, 35, 31, 0.08);
}

.login-card h2 {
  margin: 0;
  font-size: 28px;
}

.login-card p {
  margin: 8px 0 26px;
  color: var(--muted);
}

.captcha-row {
  display: grid;
  grid-template-columns: 1fr 96px;
  gap: 10px;
  width: 100%;
}

.captcha {
  display: grid;
  place-items: center;
  height: 40px;
  background: #eaf7f2;
  border: 1px solid #b7e1d5;
  border-radius: 6px;
  color: var(--brand-deep);
  font-weight: 800;
}

.login-btn {
  width: 100%;
}

@media (max-width: 900px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-visual {
    min-height: 320px;
    padding: 36px;
  }

  .visual-copy h1 {
    font-size: 34px;
  }
}
</style>
