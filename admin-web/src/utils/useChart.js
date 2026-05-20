import * as echarts from 'echarts';
import { onBeforeUnmount, onMounted, ref } from 'vue';

export function useChart(optionFactory) {
  const el = ref();
  let chart;

  function render() {
    if (!el.value) return;
    if (!chart) chart = echarts.init(el.value);
    chart.setOption(optionFactory());
  }

  function resize() {
    chart?.resize();
  }

  onMounted(() => {
    render();
    window.addEventListener('resize', resize);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', resize);
    chart?.dispose();
  });

  return { el, render };
}
