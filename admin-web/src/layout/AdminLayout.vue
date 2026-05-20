<template>
  <el-container class="admin-shell">
    <el-aside :width="collapsed ? '72px' : '232px'" class="sidebar">
      <div class="brand">
        <div class="brand-mark">幺</div>
        <div v-if="!collapsed" class="brand-text">
          <strong>伊幺体育</strong>
          <span>运营管理后台</span>
        </div>
      </div>
      <el-menu :default-active="$route.path" router :collapse="collapsed" class="side-menu">
        <el-menu-item v-for="item in menus" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="topbar">
        <div class="top-left">
          <el-button :icon="collapsed ? Expand : Fold" circle @click="collapsed = !collapsed" />
          <div>
            <div class="crumb">{{ $route.meta.title || '首页看板' }}</div>
            <div class="date">SpringBoot + 微信小程序体育馆运营管理系统</div>
          </div>
        </div>
        <div class="top-actions">
          <el-select v-model="currentStore" class="store-select" size="large">
            <el-option label="全部门店" value="全部门店" />
            <el-option label="伊幺体育中心店" value="伊幺体育中心店" />
            <el-option label="伊幺体育龙华馆" value="伊幺体育龙华馆" />
            <el-option label="伊幺体育天河馆" value="伊幺体育天河馆" />
          </el-select>
          <el-badge :value="4" class="notice">
            <el-button :icon="Bell" circle />
          </el-badge>
          <el-dropdown>
            <button class="user-entry">
              <el-avatar :size="34">{{ auth.user.name.slice(0, 1) }}</el-avatar>
              <span>{{ auth.user.name }}</span>
              <el-icon><ArrowDown /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="$router.push('/system')">个人中心</el-dropdown-item>
                <el-dropdown-item divided @click="confirmLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
      <el-footer class="footer">Yiyao Gym Admin v0.1.0</el-footer>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessageBox } from 'element-plus';
import { ArrowDown, Bell, DataAnalysis, Fold, Expand, House, OfficeBuilding, Tickets, Wallet, User, Present, ChatDotRound, Setting } from '@element-plus/icons-vue';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const collapsed = ref(false);
const currentStore = ref(auth.user.store);

const menus = [
  { path: '/dashboard', title: '首页', icon: House },
  { path: '/resources', title: '门店与场地', icon: OfficeBuilding },
  { path: '/orders', title: '订单管理', icon: Tickets },
  { path: '/payments', title: '支付与退款', icon: Wallet },
  { path: '/users', title: '用户与会员', icon: User },
  { path: '/marketing', title: '优惠券与活动', icon: Present },
  { path: '/reviews', title: '评价管理', icon: ChatDotRound },
  { path: '/statistics', title: '数据统计', icon: DataAnalysis },
  { path: '/system', title: '系统管理', icon: Setting }
];

function confirmLogout() {
  ElMessageBox.confirm('确认退出当前后台账号？', '退出登录', { type: 'warning' }).then(() => auth.logout());
}
</script>

<style scoped>
.admin-shell {
  min-height: 100vh;
}

.sidebar {
  background: #10231f;
  border-right: 1px solid #18342d;
  transition: width 0.2s ease;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 64px;
  padding: 0 18px;
  color: #fff;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  background: #17b890;
  border-radius: 8px;
  font-weight: 800;
}

.brand-text {
  display: grid;
  gap: 3px;
}

.brand-text span {
  color: #9bb7ae;
  font-size: 12px;
}

.side-menu {
  border-right: 0;
  background: transparent;
}

:deep(.el-menu-item) {
  color: #c7d6d1;
}

:deep(.el-menu-item.is-active),
:deep(.el-menu-item:hover) {
  color: #fff;
  background: #173a32;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 64px;
  background: #fff;
  border-bottom: 1px solid var(--line);
}

.top-left,
.top-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.crumb {
  font-size: 17px;
  font-weight: 800;
}

.date {
  margin-top: 3px;
  color: var(--muted);
  font-size: 12px;
}

.store-select {
  width: 180px;
}

.user-entry {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  cursor: pointer;
}

.main {
  min-height: calc(100vh - 104px);
  padding: 22px;
}

.footer {
  height: 40px;
  color: var(--muted);
  text-align: center;
  font-size: 12px;
}

@media (max-width: 760px) {
  .store-select,
  .date {
    display: none;
  }

  .topbar {
    padding: 0 12px;
  }

  .main {
    padding: 14px;
  }
}
</style>
