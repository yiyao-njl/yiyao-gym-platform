export function statusType(status) {
  const success = ['营业中', '空闲', '正常', '已支付', '成功', '已展示', '上架', '发放中', '已完成', '同意退款', '无退款'];
  const warning = ['休息中', '待支付', '待到场', '使用中', '待审核', '待处理', '草稿', '已预定', '退款中'];
  const danger = ['停用', '禁用', '失败', '已取消', '已退款', '已隐藏', '拒绝退款'];
  if (success.includes(status)) return 'success';
  if (warning.includes(status)) return 'warning';
  if (danger.includes(status)) return 'danger';
  return 'info';
}

export function money(value) {
  return `¥${Number(value || 0).toLocaleString('zh-CN')}`;
}
