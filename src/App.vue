<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { constellations, makeField, stars, type Star } from './data'

const canvas = ref<HTMLCanvasElement | null>(null)
const field = makeField(360)
const showLines = ref(true)
const selected = ref<Star | null>(null)
const search = ref('')

let ctx: CanvasRenderingContext2D | null = null
let scale = 1.4
let ox = 0
let oy = 0
let raf = 0
let drag = { active: false, x: 0, y: 0, moved: 0 }

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return stars
  return stars.filter((s) => s.name.includes(q) || s.en.toLowerCase().includes(q))
})

function selectStar(s: Star) {
  selected.value = s
}

function resetView() {
  scale = 1.4
  ox = 0
  oy = 0
  selected.value = null
}

function draw(t: number) {
  const c = canvas.value
  if (!c) return
  ctx = ctx || c.getContext('2d')
  if (!ctx) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = c.clientWidth
  const h = c.clientHeight
  if (c.width !== Math.round(w * dpr)) c.width = Math.round(w * dpr)
  if (c.height !== Math.round(h * dpr)) c.height = Math.round(h * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  // vignette background
  const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7)
  bg.addColorStop(0, '#0c1230')
  bg.addColorStop(1, '#050817')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  const W = Math.max(w, h) * 1.2
  const toScreen = (x: number, y: number) => ({ sx: x * W * scale + ox + (w - W * scale) / 2, sy: y * W * scale + oy + (h - W * scale) / 2 })

  // constellation lines
  if (showLines.value) {
    ctx.strokeStyle = 'rgba(216,184,106,.34)'
    ctx.lineWidth = 1
    for (const con of constellations) {
      ctx.beginPath()
      let first = true
      for (const i of con.stars) {
        const { sx, sy } = toScreen(stars[i].x, stars[i].y)
        if (first) { ctx.moveTo(sx, sy); first = false } else ctx.lineTo(sx, sy)
      }
      ctx.stroke()
    }
  }

  // background stars
  for (const s of field) {
    const { sx, sy } = toScreen(s.x, s.y)
    if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) continue
    const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t / 900 + s.tw))
    const r = Math.max(0.4, (6 - s.mag) * 0.42)
    ctx.fillStyle = `rgba(220,230,255,${0.28 * tw})`
    ctx.beginPath()
    ctx.arc(sx, sy, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // named stars
  for (const s of stars) {
    const { sx, sy } = toScreen(s.x, s.y)
    if (sx < -40 || sx > w + 40 || sy < -40 || sy > h + 40) continue
    const r = Math.max(2.2, (1 - s.mag) * 1.6 + 3)
    const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 3.2)
    glow.addColorStop(0, s.color)
    glow.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(sx, sy, r * 3.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(sx, sy, r, 0, Math.PI * 2)
    ctx.fill()

    if (selected.value?.en === s.en) {
      ctx.strokeStyle = '#e6c878'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.arc(sx, sy, r + 7, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = '#e6c878'
      ctx.font = '12px Georgia, "Noto Serif SC", serif'
      ctx.fillText(s.name, sx + r + 12, sy - 6)
    }
  }

  raf = requestAnimationFrame(draw)
}

function screenToWorld(ev: PointerEvent) {
  const c = canvas.value!
  const rect = c.getBoundingClientRect()
  const w = rect.width
  const h = rect.height
  const W = Math.max(w, h) * 1.2
  const sx = ev.clientX - rect.left
  const sy = ev.clientY - rect.top
  return { x: (sx - ox - (w - W * scale) / 2) / (W * scale), y: (sy - oy - (h - W * scale) / 2) / (W * scale) }
}

function onDown(ev: PointerEvent) {
  drag = { active: true, x: ev.clientX, y: ev.clientY, moved: 0 }
  canvas.value?.setPointerCapture(ev.pointerId)
}
function onMove(ev: PointerEvent) {
  if (!drag.active) return
  const dx = ev.clientX - drag.x
  const dy = ev.clientY - drag.y
  ox += dx
  oy += dy
  drag.x = ev.clientX
  drag.y = ev.clientY
  drag.moved += Math.abs(dx) + Math.abs(dy)
}
function onUp(ev: PointerEvent) {
  if (drag.moved < 6) {
    const p = screenToWorld(ev)
    let best: Star | null = null
    let bd = 1e9
    for (const s of stars) {
      const d = Math.hypot(s.x - p.x, s.y - p.y)
      if (d < bd) { bd = d; best = s }
    }
    if (best && bd < 0.025) selected.value = best
    else selected.value = null
  }
  drag.active = false
}
function onWheel(ev: WheelEvent) {
  ev.preventDefault()
  const c = canvas.value!
  const rect = c.getBoundingClientRect()
  const mx = ev.clientX - rect.left
  const my = ev.clientY - rect.top
  const factor = ev.deltaY < 0 ? 1.12 : 1 / 1.12
  const ns = Math.min(6, Math.max(0.55, scale * factor))
  const k = ns / scale
  ox = mx - (mx - ox) * k
  oy = my - (my - oy) * k
  scale = ns
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

onMounted(() => {
  raf = requestAnimationFrame(draw)
  canvas.value?.addEventListener('wheel', onWheel, { passive: false })
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
})
</script>

<template>
  <div class="atlas">
    <header class="masthead">
      <div class="masthead-brand">
        <span class="star-mark">✦</span>
        <span class="brand-text"><b>星图档案</b><i>CELESTIAL ATLAS · 天文馆科学艺术</i></span>
      </div>
      <nav class="masthead-nav">
        <button @click="scrollToId('atlas')">星图</button>
        <button @click="scrollToId('stories')">星座</button>
        <button @click="scrollToId('catalog')">星表</button>
      </nav>
    </header>

    <section class="hero">
      <div class="hero-inner">
        <p class="kicker">AN INTERACTIVE CELESTIAL ATLAS</p>
        <h1 class="hero-title">星图<br /><em>档案</em></h1>
        <p class="hero-sub">拖拽星空、滚轮缩放、点击恒星。把夜空中最亮的那些名字，一颗一颗点亮。</p>
        <button class="btn" @click="scrollToId('atlas')">进入星图 ↓</button>
      </div>
      <div class="hero-orbit" aria-hidden="true">
        <i class="r1"></i><i class="r2"></i><i class="r3"></i><i class="planet"></i>
      </div>
    </section>

    <section class="atlas-stage" id="atlas">
      <div class="stage-head">
        <div>
          <p class="kicker">SIGNATURE INTERACTION</p>
          <h2>互动星图 <span>· The Sky</span></h2>
        </div>
        <div class="stage-controls">
          <button :class="{ on: showLines }" @click="showLines = !showLines">星座连线 {{ showLines ? '开' : '关' }}</button>
          <button @click="resetView">复位视图</button>
        </div>
      </div>
      <div class="stage-body">
        <div class="sky-wrap">
          <canvas ref="canvas" class="sky" @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp"></canvas>
          <div class="sky-hint">拖拽平移 · 滚轮缩放 · 点击恒星查看详情</div>
        </div>
        <aside class="star-panel" :class="{ empty: !selected }">
          <template v-if="selected">
            <p class="panel-kicker">SELECTED STAR</p>
            <h3>{{ selected.name }} <span>{{ selected.en }}</span></h3>
            <dl>
              <div><dt>所属星座</dt><dd>{{ selected.constellation }}</dd></div>
              <div><dt>视星等</dt><dd>{{ selected.mag }}</dd></div>
              <div><dt>距离</dt><dd>{{ selected.distance }}</dd></div>
              <div><dt>颜色</dt><dd><i class="swatch" :style="{ background: selected.color }"></i></dd></div>
            </dl>
            <p class="panel-note">{{ selected.note }}</p>
          </template>
          <template v-else>
            <p class="panel-kicker">WAITING</p>
            <p class="panel-empty">点击星图中的一颗亮星，这里会浮现它的档案。</p>
          </template>
        </aside>
      </div>
    </section>

    <section class="stories" id="stories">
      <div class="stage-head">
        <div>
          <p class="kicker">CONSTELLATION STORIES</p>
          <h2>星座故事 <span>· Legends</span></h2>
        </div>
      </div>
      <div class="story-grid">
        <article v-for="c in constellations" :key="c.en" class="story-card">
          <span class="story-en">{{ c.en }}</span>
          <h3>{{ c.name }}</h3>
          <p>{{ c.story }}</p>
          <span class="story-best">{{ c.best }}</span>
        </article>
      </div>
    </section>

    <section class="catalog" id="catalog">
      <div class="stage-head">
        <div>
          <p class="kicker">BRIGHT STAR CATALOG</p>
          <h2>亮星目录 <span>· Catalog</span></h2>
        </div>
        <input v-model="search" class="search" placeholder="搜索恒星名，如 天狼 / Vega" />
      </div>
      <div class="catalog-table">
        <div class="cat-row cat-head">
          <span>中文名</span><span>英文名</span><span>星座</span><span>视星等</span><span>距离(约)</span>
        </div>
        <button v-for="s in filtered" :key="s.en" class="cat-row" @click="selectStar(s); scrollToId('atlas')">
          <span class="cat-name">{{ s.name }}</span>
          <span>{{ s.en }}</span>
          <span>{{ s.constellation }}</span>
          <span class="cat-mag">{{ s.mag }}</span>
          <span>{{ s.distance }}</span>
        </button>
      </div>
      <p class="catalog-note">星表为公开常识整理；星图坐标为示意排布，距离为约数，仅用于展览展示。</p>
    </section>

    <section class="about">
      <div class="about-inner">
        <h2>关于这份星图</h2>
        <p>
          《星图档案》把十六颗著名亮星放进一张可拖拽、可缩放、可点选的示意星图。
          恒星的基本事实（视星等、距离、所属星座）来自公开天文学常识；位置经过简化排布以便展示，
          不代表精确天球坐标。所有视觉由 Canvas 与 CSS 原创绘制。
        </p>
        <div class="about-meta"><span>Vue 3 + Canvas</span><span>深蓝金 · 天文馆排版</span><span>无外部素材依赖</span></div>
      </div>
    </section>

    <footer class="foot"><span>星图档案 · Celestial Atlas</span><span>DIGITAL VISUAL LAB</span></footer>
  </div>
</template>

<style>
:root {
  --navy: #070b20;
  --navy2: #0c1230;
  --gold: #d8b86a;
  --gold2: #e6c878;
  --ivory: #f1ead7;
  --muted: #9aa0b8;
  --serif: Georgia, 'Times New Roman', 'Noto Serif SC', 'Songti SC', SimSun, serif;
}
.atlas {
  min-height: 100vh;
  background: linear-gradient(180deg, #0b1130 0%, #070b20 40%, #050817 100%);
  color: var(--ivory);
  font-family: var(--serif);
  overflow-x: hidden;
}
.masthead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px clamp(18px, 4vw, 56px);
  border-bottom: 1px solid rgba(216, 184, 106, 0.25);
}
.masthead-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.star-mark {
  font-size: 26px;
  color: var(--gold);
}
.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.brand-text b {
  letter-spacing: 6px;
  font-size: 17px;
}
.brand-text i {
  font-style: normal;
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--muted);
}
.masthead-nav {
  display: flex;
  gap: 22px;
}
.masthead-nav button {
  background: none;
  border: 0;
  color: var(--ivory);
  font-family: var(--serif);
  letter-spacing: 3px;
  font-size: 13px;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;
}
.masthead-nav button:hover {
  border-color: var(--gold);
}

.hero {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  align-items: center;
  gap: 30px;
  padding: clamp(56px, 10vh, 120px) clamp(18px, 5vw, 90px);
  max-width: 1280px;
  margin: 0 auto;
}
.kicker {
  font-size: 11px;
  letter-spacing: 4px;
  color: var(--gold);
  margin: 0 0 14px;
}
.hero-title {
  font-size: clamp(54px, 11vw, 150px);
  line-height: 0.92;
  margin: 0;
  font-weight: 500;
  letter-spacing: 0.04em;
}
.hero-title em {
  font-style: normal;
  color: var(--gold);
  text-shadow: 0 0 40px rgba(216, 184, 106, 0.35);
}
.hero-sub {
  max-width: 44ch;
  color: var(--muted);
  font-size: clamp(15px, 1.7vw, 18px);
  margin: 24px 0 0;
  line-height: 1.7;
}
.btn {
  margin-top: 28px;
  background: transparent;
  border: 1px solid var(--gold);
  color: var(--gold);
  padding: 12px 26px;
  font-family: var(--serif);
  letter-spacing: 3px;
  transition: background 0.2s, color 0.2s;
}
.btn:hover {
  background: var(--gold);
  color: #0b1130;
}
.hero-orbit {
  position: relative;
  aspect-ratio: 1;
  max-width: 420px;
  margin: 0 auto;
  width: 100%;
}
.hero-orbit i {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(216, 184, 106, 0.3);
  border-radius: 50%;
}
.hero-orbit .r2 { inset: 12%; }
.hero-orbit .r3 { inset: 24%; }
.hero-orbit .planet {
  inset: auto;
  width: 14px;
  height: 14px;
  border: 0;
  background: var(--gold);
  border-radius: 50%;
  top: 8%;
  left: 50%;
  box-shadow: 0 0 24px var(--gold);
  animation: orbit 14s linear infinite;
}
@keyframes orbit {
  from { transform: rotate(0deg) translateX(46%) rotate(0deg); }
  to { transform: rotate(360deg) translateX(46%) rotate(-360deg); }
}

.atlas-stage,
.stories,
.catalog,
.about {
  padding: clamp(48px, 8vh, 96px) clamp(18px, 4vw, 56px);
  max-width: 1280px;
  margin: 0 auto;
}
.stage-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.stage-head h2 {
  font-size: clamp(26px, 4.4vw, 48px);
  font-weight: 500;
  margin: 0;
  letter-spacing: 0.03em;
}
.stage-head h2 span {
  color: var(--muted);
}
.stage-controls {
  display: flex;
  gap: 10px;
}
.stage-controls button {
  background: transparent;
  border: 1px solid rgba(216, 184, 106, 0.4);
  color: var(--ivory);
  padding: 9px 16px;
  font-family: var(--serif);
  letter-spacing: 2px;
  font-size: 13px;
}
.stage-controls button.on {
  border-color: var(--gold);
  color: var(--gold);
}
.stage-body {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
}
.sky-wrap {
  position: relative;
  border: 1px solid rgba(216, 184, 106, 0.3);
  border-radius: 4px;
  overflow: hidden;
  aspect-ratio: 16 / 10;
  background: #050817;
}
.sky {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
}
.sky:active {
  cursor: grabbing;
}
.sky-hint {
  position: absolute;
  left: 14px;
  bottom: 12px;
  font-size: 11px;
  letter-spacing: 2px;
  color: var(--muted);
  pointer-events: none;
}
.star-panel {
  border: 1px solid rgba(216, 184, 106, 0.3);
  padding: 26px 22px;
  background: rgba(12, 18, 48, 0.55);
}
.star-panel.empty {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.panel-kicker {
  font-size: 10px;
  letter-spacing: 3px;
  color: var(--gold);
  margin: 0 0 14px;
}
.star-panel h3 {
  margin: 0 0 18px;
  font-size: 26px;
  font-weight: 500;
}
.star-panel h3 span {
  display: block;
  font-size: 13px;
  color: var(--muted);
  letter-spacing: 2px;
}
.star-panel dl {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.star-panel dl div {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid rgba(216, 184, 106, 0.18);
  padding-bottom: 8px;
}
.star-panel dt {
  color: var(--muted);
  font-size: 13px;
}
.star-panel dd {
  margin: 0;
  font-size: 14px;
}
.swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
}
.panel-note {
  margin: 18px 0 0;
  color: var(--muted);
  line-height: 1.65;
  font-size: 14px;
}
.panel-empty {
  color: var(--muted);
  line-height: 1.7;
}

.story-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}
.story-card {
  border: 1px solid rgba(216, 184, 106, 0.28);
  padding: 26px 24px;
  background: rgba(12, 18, 48, 0.4);
  position: relative;
  overflow: hidden;
  transition: transform 0.25s, border-color 0.25s;
}
.story-card:hover {
  transform: translateY(-5px);
  border-color: var(--gold);
}
.story-en {
  font-size: 11px;
  letter-spacing: 4px;
  color: var(--gold);
  text-transform: uppercase;
}
.story-card h3 {
  font-size: 26px;
  font-weight: 500;
  margin: 12px 0 10px;
}
.story-card p {
  color: var(--muted);
  line-height: 1.7;
  margin: 0 0 16px;
}
.story-best {
  font-size: 12px;
  color: var(--gold2);
  letter-spacing: 1px;
}

.search {
  background: transparent;
  border: 1px solid rgba(216, 184, 106, 0.4);
  color: var(--ivory);
  padding: 10px 14px;
  font-family: var(--serif);
  letter-spacing: 1px;
  min-width: 220px;
}
.search:focus {
  outline: 1px solid var(--gold);
}
.catalog-table {
  border: 1px solid rgba(216, 184, 106, 0.25);
}
.cat-row {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr 0.7fr 1.2fr;
  gap: 10px;
  padding: 13px 18px;
  align-items: center;
  width: 100%;
  text-align: left;
  background: none;
  border: 0;
  border-bottom: 1px solid rgba(216, 184, 106, 0.15);
  color: var(--ivory);
  font-family: var(--serif);
  font-size: 14px;
}
.cat-row:last-child {
  border-bottom: 0;
}
button.cat-row {
  cursor: pointer;
  transition: background 0.15s;
}
button.cat-row:hover {
  background: rgba(216, 184, 106, 0.08);
}
.cat-head {
  color: var(--gold);
  letter-spacing: 2px;
  font-size: 12px;
}
.cat-name {
  color: #fff;
}
.cat-mag {
  color: var(--gold2);
}
.catalog-note {
  color: var(--muted);
  font-size: 12px;
  letter-spacing: 1px;
  margin: 18px 0 0;
}

.about-inner {
  border: 1px solid rgba(216, 184, 106, 0.28);
  padding: clamp(24px, 4vw, 44px);
  max-width: 820px;
  background: rgba(12, 18, 48, 0.4);
}
.about-inner h2 {
  font-weight: 500;
  margin: 0 0 14px;
}
.about-inner p {
  color: var(--muted);
  line-height: 1.75;
  margin: 0 0 16px;
}
.about-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 22px;
  font-size: 12px;
  color: var(--muted);
  letter-spacing: 1px;
}
.foot {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding: 22px clamp(18px, 4vw, 56px);
  border-top: 1px solid rgba(216, 184, 106, 0.25);
  color: var(--muted);
  letter-spacing: 2px;
  font-size: 12px;
}

@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
  }
  .hero-orbit {
    display: none;
  }
  .stage-body {
    grid-template-columns: 1fr;
  }
  .story-grid {
    grid-template-columns: 1fr;
  }
  .cat-row {
    grid-template-columns: 1fr 1fr 1fr;
  }
  .cat-row span:nth-child(4),
  .cat-row span:nth-child(5) {
    display: none;
  }
  .masthead-nav {
    display: none;
  }
}
</style>
