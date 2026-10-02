/* ==========================================================================
   颜文字工坊 · 项目全景观览页 —— 交互逻辑
   无第三方依赖：主题切换 / 滚动进度 / 导航高亮 / 目录树 / Tab /
   数字动画 / 代码复制 / 架构图 tooltip / 返回顶部
   ========================================================================== */
(function () {
  'use strict'

  // 标记 JS 可用，用于启用「滚动渐入」这类依赖 JS 的效果
  document.body.classList.add('js')

  var $ = function (sel, root) { return (root || document).querySelector(sel) }
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel))
  }

  /* ---------- 主题切换 ---------- */
  var THEME_KEY = 'kaomoji.overview.theme'
  var root = document.documentElement

  function applyTheme(mode) {
    root.setAttribute('data-theme', mode)
  }

  ;(function initTheme() {
    var saved = null
    try { saved = localStorage.getItem(THEME_KEY) } catch (e) { /* 隐私模式忽略 */ }
    if (saved === 'light' || saved === 'dark') { applyTheme(saved); return }
    var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
    applyTheme(prefersLight ? 'light' : 'dark')
  })()

  var themeBtn = $('#themeToggle')
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      try { localStorage.setItem(THEME_KEY, next) } catch (e) { /* 忽略 */ }
      // 主题切换后图表配色需重绘
      if (window.__overviewCharts) {
        try { window.__overviewCharts.refresh() } catch (e) { /* 忽略 */ }
      }
    })
  }

  /* ---------- 滚动进度条 ---------- */
  var progress = $('#progress')
  function updateProgress() {
    if (!progress) return
    var h = document.documentElement
    var max = h.scrollHeight - h.clientHeight
    var ratio = max > 0 ? h.scrollTop / max : 0
    progress.style.width = (ratio * 100).toFixed(2) + '%'
  }

  /* ---------- 返回顶部 ---------- */
  var toTop = $('#toTop')
  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  function updateToTop() {
    if (!toTop) return
    toTop.classList.toggle('show', window.scrollY > window.innerHeight * 0.8)
  }

  /* ---------- 侧边栏（移动端） ---------- */
  var sidebar = $('#sidebar')
  var hamburger = $('#hamburger')
  if (hamburger && sidebar) {
    hamburger.addEventListener('click', function () {
      sidebar.classList.toggle('open')
    })
    $$('.toc a', sidebar).forEach(function (a) {
      a.addEventListener('click', function () { sidebar.classList.remove('open') })
    })
    document.addEventListener('click', function (ev) {
      if (window.innerWidth > 1080) return
      if (!sidebar.classList.contains('open')) return
      if (sidebar.contains(ev.target) || hamburger.contains(ev.target)) return
      sidebar.classList.remove('open')
    })
  }

  /* ---------- 章节渐入 + 导航高亮 ---------- */
  var sections = $$('.section, .hero')
  var navLinks = $$('.nav a')
  var tocLinks = $$('.toc a')

  function markActive(id) {
    navLinks.concat(tocLinks).forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + id)
    })
  }

  if ('IntersectionObserver' in window) {
    var reveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('visible')
          reveal.unobserve(en.target)
        }
      })
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 })
    sections.forEach(function (s) { reveal.observe(s) })

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) markActive(en.target.id)
      })
    }, { rootMargin: '-84px 0px -62% 0px', threshold: 0 })
    sections.forEach(function (s) { if (s.id) spy.observe(s) })
  } else {
    sections.forEach(function (s) { s.classList.add('visible') })
  }

  /* ---------- 数字计数动画 ---------- */
  var counters = $$('.count')
  function runCount(el) {
    var target = Number(el.getAttribute('data-target') || 0)
    var start = performance.now()
    var dur = 900
    function step(now) {
      var t = Math.min(1, (now - start) / dur)
      var eased = 1 - Math.pow(1 - t, 3)
      el.textContent = String(Math.round(target * eased))
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }
  if ('IntersectionObserver' in window && counters.length) {
    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCount(en.target); countObs.unobserve(en.target) }
      })
    }, { threshold: 0.4 })
    counters.forEach(function (c) { countObs.observe(c) })
  } else {
    counters.forEach(function (c) { c.textContent = c.getAttribute('data-target') || '0' })
  }

  /* ---------- Tab 切换 ---------- */
  $$('.tabs').forEach(function (group) {
    var name = group.getAttribute('data-tabs')
    var panelHost = group.parentElement
    var tabs = $$('.tab', group)
    var panels = $$('.tab-panel', panelHost)
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var key = tab.getAttribute('data-tab')
        tabs.forEach(function (t) { t.classList.toggle('on', t === tab) })
        panels.forEach(function (p) {
          p.classList.toggle('on', p.getAttribute('data-panel') === key)
        })
        // 切回图表视图时重绘，修正在隐藏容器中创建导致的尺寸为 0
        if (window.__overviewCharts) {
          try { window.__overviewCharts.resize() } catch (e) { /* 忽略 */ }
        }
      })
    })
    if (name) { /* 预留：可用于埋点或状态记忆 */ }
  })

  /* ---------- 代码复制 ---------- */
  $$('.copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var wrap = btn.closest('.code')
      var codeEl = wrap ? $('code', wrap) : null
      if (!codeEl) return
      var text = codeEl.innerText

      function done() {
        btn.textContent = '已复制'
        btn.classList.add('done')
        setTimeout(function () {
          btn.textContent = '复制'
          btn.classList.remove('done')
        }, 1400)
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () { fallback(text, done) })
      } else {
        fallback(text, done)
      }
    })
  })

  function fallback(text, cb) {
    var ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try { document.execCommand('copy') } catch (e) { /* 忽略 */ }
    ta.remove()
    cb()
  }

  /* ---------- 架构图 tooltip ---------- */
  var diagram = $('#diagram')
  var tip = $('#tip')
  if (diagram && tip) {
    var nodes = $$('.node', diagram)
    nodes.forEach(function (node) {
      node.addEventListener('mouseenter', function () {
        var text = node.getAttribute('data-tip')
        if (!text) return
        var nRect = node.getBoundingClientRect()
        var dRect = diagram.getBoundingClientRect()
        tip.textContent = text
        tip.style.left = (nRect.left - dRect.left + nRect.width / 2 + diagram.scrollLeft) + 'px'
        tip.style.top = (nRect.top - dRect.top) + 'px'
        tip.classList.add('on')
      })
      node.addEventListener('mouseleave', function () { tip.classList.remove('on') })
    })
  }

  /* ---------- 滚动监听（合并到一次 rAF） ---------- */
  var ticking = false
  function onScroll() {
    if (ticking) return
    ticking = true
    requestAnimationFrame(function () {
      updateProgress()
      updateToTop()
      ticking = false
    })
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  onScroll()
})()
