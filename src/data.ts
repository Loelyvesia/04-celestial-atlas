export interface Star {
  name: string
  en: string
  x: number
  y: number
  mag: number
  color: string
  constellation: string
  distance: string
  note: string
}

export interface Constellation {
  name: string
  en: string
  stars: number[]
  story: string
  best: string
}

// Named bright stars with well-known facts; coordinates are schematic for display.
export const stars: Star[] = [
  { name: '天狼星', en: 'Sirius', x: 0.68, y: 0.42, mag: -1.46, color: '#cfe0ff', constellation: '大犬座', distance: '约 8.6 光年', note: '夜空中最亮的恒星，双星系统。' },
  { name: '老人星', en: 'Canopus', x: 0.82, y: 0.62, mag: -0.74, color: '#fff2df', constellation: '船底座', distance: '约 310 光年', note: '南天第二亮星，航海者的重要参照。' },
  { name: '大角星', en: 'Arcturus', x: 0.24, y: 0.3, mag: -0.05, color: '#ffc98a', constellation: '牧夫座', distance: '约 37 光年', note: '北天最亮的恒星，橙黄色巨星。' },
  { name: '织女星', en: 'Vega', x: 0.36, y: 0.2, mag: 0.03, color: '#dce8ff', constellation: '天琴座', distance: '约 25 光年', note: '夏季大三角之一，曾是星等的基准星。' },
  { name: '五车二', en: 'Capella', x: 0.5, y: 0.16, mag: 0.08, color: '#ffe8c4', constellation: '御夫座', distance: '约 43 光年', note: '由两对双星组成的四星系统。' },
  { name: '参宿七', en: 'Rigel', x: 0.61, y: 0.78, mag: 0.13, color: '#c8dbff', constellation: '猎户座', distance: '约 860 光年', note: '猎户座左脚，蓝白色超巨星。' },
  { name: '南河三', en: 'Procyon', x: 0.74, y: 0.5, mag: 0.34, color: '#eef4ff', constellation: '小犬座', distance: '约 11 光年', note: '冬季大三角之一，离我们较近。' },
  { name: '参宿四', en: 'Betelgeuse', x: 0.55, y: 0.68, mag: 0.5, color: '#ffb08a', constellation: '猎户座', distance: '约 548 光年', note: '红超巨星，亮度会周期性变化。' },
  { name: '牛郎星', en: 'Altair', x: 0.7, y: 0.3, mag: 0.76, color: '#e8f2ff', constellation: '天鹰座', distance: '约 17 光年', note: '夏季大三角之一，自转极快。' },
  { name: '毕宿五', en: 'Aldebaran', x: 0.52, y: 0.5, mag: 0.86, color: '#ffc085', constellation: '金牛座', distance: '约 65 光年', note: '金牛座的橙色「牛眼」。' },
  { name: '心宿二', en: 'Antares', x: 0.62, y: 0.88, mag: 1.06, color: '#ff8f70', constellation: '天蝎座', distance: '约 550 光年', note: '「火星的对手」，红色超巨星。' },
  { name: '北河三', en: 'Pollux', x: 0.48, y: 0.38, mag: 1.14, color: '#ffe1bb', constellation: '双子座', distance: '约 34 光年', note: '双子座中较亮的一颗，橙色巨星。' },
  { name: '北河二', en: 'Castor', x: 0.44, y: 0.36, mag: 1.58, color: '#eef4ff', constellation: '双子座', distance: '约 51 光年', note: '肉眼看似单星，实为六合星系统。' },
  { name: '天津四', en: 'Deneb', x: 0.38, y: 0.26, mag: 1.25, color: '#dce8ff', constellation: '天鹅座', distance: '约 2600 光年', note: '夏季大三角之一，极遥远的亮星。' },
  { name: '北落师门', en: 'Fomalhaut', x: 0.86, y: 0.72, mag: 1.16, color: '#eaf2ff', constellation: '南鱼座', distance: '约 25 光年', note: '秋季南天孤星，周围有尘埃盘。' },
  { name: '北极星', en: 'Polaris', x: 0.48, y: 0.08, mag: 1.98, color: '#f8f1d8', constellation: '小熊座', distance: '约 433 光年', note: '几乎正对北天极，是方向的锚点。' },
]

export const constellations: Constellation[] = [
  {
    name: '猎户座',
    en: 'Orion',
    stars: [5, 7],
    story: '冬夜最耀眼的猎人身姿。腰带三星连成一线，肩上是参宿四，脚下是参宿七。',
    best: '最佳观测 · 12 月 — 2 月',
  },
  {
    name: '夏季大三角',
    en: 'Summer Triangle',
    stars: [3, 8, 13],
    story: '织女、牛郎与天津四跨过银河遥遥相望，是夏夜最醒目的三颗星。',
    best: '最佳观测 · 7 月 — 9 月',
  },
  {
    name: '双子座',
    en: 'Gemini',
    stars: [11, 12],
    story: '北河二与北河三这对「兄弟星」并肩而立，一个白，一个橙。',
    best: '最佳观测 · 1 月 — 3 月',
  },
  {
    name: '冬季大三角',
    en: 'Winter Triangle',
    stars: [0, 5, 6],
    story: '天狼、参宿七与南河三围成的等边三角形，点亮整片冬夜。',
    best: '最佳观测 · 12 月 — 2 月',
  },
]

// Deterministic procedural field (background stars).
export function makeField(n: number): { x: number; y: number; mag: number; tw: number }[] {
  let seed = 42
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  return Array.from({ length: n }, () => ({
    x: rnd(),
    y: rnd() * 0.96,
    mag: 3 + rnd() * 3,
    tw: rnd() * Math.PI * 2,
  }))
}
