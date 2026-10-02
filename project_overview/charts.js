/* ==========================================================================
   颜文字工坊 · 项目全景观览页 —— Chart.js 图表配置与数据
   --------------------------------------------------------------------------
   数据来源：直接统计自 src/data/kaomoji.ts 与 src/data/parts.ts，非估算。
     · 成品库 167 条（含 4 条多行图案）
     · 组件库 146 个零件（眼 56 / 嘴 39 / 装饰 20 / 臂 17 / 腮红 14）
   若词库变动，请重新统计后同步本文件的 DATA，再刷新页面。
   依赖：Chart.js 4（CDN 引入）；CDN 不可用时自动回退到表格视图。
   ========================================================================== */
(function () {
  'use strict'

  var PARTS = {
    labels: ['眼 EYES', '嘴 MOUTHS', '装饰 DECOR', '臂 ARMS', '腮红 BLUSH'],
    values: [56, 39, 20, 17, 14],
  }
  var EMOTIONS = {
    labels: ['happy 开心', 'sad 难过', 'cry 大哭', 'angry 生气', 'neutral 平静', 'love 喜欢',
      'tired 疲惫', 'smug 得意', 'surprised 惊讶', 'shy 害羞', 'confused 疑惑'],
    values: [60, 22, 15, 15, 15, 14, 11, 11, 10, 7, 7],
  }
  var SUBJECTS = {
    labels: ['cat 猫', 'rabbit 兔子', 'dog 狗', 'bear 熊', 'bird 鸟', 'pig 猪'],
    values: [12, 7, 6, 4, 3, 3],
  }
  var ACTIONS = {
    labels: ['greet 打招呼', 'cheer 加油', 'night 晚安', 'sorry 道歉', 'thanks 道谢', 'ok', 'run 跑走', 'pray 祈祷'],
    values: [10, 7, 6, 4, 4, 3, 2, 2],
  }

  /** 读取当前主题的 CSS 变量，保证图表配色与页面一致 */
  function theme() {
    var cs = getComputedStyle(document.documentElement)
    var v = function (name, fallback) {
      var x = cs.getPropertyValue(name).trim()
      return x || fallback
    }
    return {
      text: v('--text', '#e8eaf0'),
      dim: v('--dim', '#9aa1b2'),
      border: v('--border', '#2a2e3a'),
      accent: v('--accent', '#7c8cff'),
      accent2: v('--accent-2', '#ff8ad4'),
      green: v('--green', '#48d597'),
      amber: v('--amber', '#e8b84b'),
    }
  }

  /** 把主题色转成带透明度的 rgba，用于半透明填充 */
  function alpha(color, a) {
    var hex = color.trim()
    if (hex.charAt(0) !== '#') return hex
    if (hex.length === 4) {
      hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
    }
    var n = parseInt(hex.slice(1), 16)
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'
  }

  /** CDN 未加载时的兜底：提示并切到表格视图 */
  function degrade() {
    var note = document.getElementById('chartFallback')
    if (note) note.hidden = false
    var group = document.querySelector('.tabs[data-tabs="data"]')
    if (!group) return
    var tabs = group.querySelectorAll('.tab')
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle('on', tabs[i].getAttribute('data-tab') === 'table')
    }
    var host = group.parentElement
    var panels = host.querySelectorAll('.tab-panel')
    for (var j = 0; j < panels.length; j++) {
      panels[j].classList.toggle('on', panels[j].getAttribute('data-panel') === 'table')
    }
  }

  if (typeof Chart === 'undefined') { degrade(); return }

  var charts = []

  function barChart(id, data, color, t) {
    var el = document.getElementById(id)
    if (!el) return
    charts.push(new Chart(el, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          backgroundColor: alpha(color, 0.55),
          hoverBackgroundColor: alpha(color, 0.85),
          borderColor: color,
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 700, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: t.border,
            titleColor: t.text,
            bodyColor: t.text,
            padding: 10,
            cornerRadius: 8,
            displayColors: false,
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: alpha(t.border, 0.5), drawBorder: false },
            ticks: { color: t.dim, font: { size: 11 } },
          },
          y: {
            grid: { display: false },
            ticks: { color: t.dim, font: { size: 11 } },
          },
        },
      },
    }))
  }

  function doughnutChart(id, data, t) {
    var el = document.getElementById(id)
    if (!el) return
    var palette = [t.accent, t.green, t.amber, t.accent2, alpha(t.accent, 0.45)]
    charts.push(new Chart(el, {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          backgroundColor: palette,
          borderColor: t.border,
          borderWidth: 2,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '58%',
        animation: { duration: 700, easing: 'easeOutQuart' },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: t.dim, boxWidth: 10, boxHeight: 10, padding: 10, font: { size: 11 } },
          },
          tooltip: {
            backgroundColor: t.border,
            titleColor: t.text,
            bodyColor: t.text,
            padding: 10,
            cornerRadius: 8,
          },
        },
      },
    }))
  }

  function build() {
    var t = theme()
    Chart.defaults.color = t.dim
    Chart.defaults.font.family =
      "'Inter', system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif"

    doughnutChart('chartParts', PARTS, t)
    barChart('chartEmotions', EMOTIONS, t.accent, t)
    barChart('chartSubjects', SUBJECTS, t.green, t)
    barChart('chartActions', ACTIONS, t.amber, t)
  }

  function destroyAll() {
    charts.forEach(function (c) { try { c.destroy() } catch (e) { /* 忽略 */ } })
    charts = []
  }

  build()

  // 供 script.js 调用：主题切换后重绘 / Tab 切回后修正尺寸
  window.__overviewCharts = {
    refresh: function () { destroyAll(); build() },
    resize: function () { charts.forEach(function (c) { try { c.resize() } catch (e) { /* 忽略 */ } }) },
  }
})()
