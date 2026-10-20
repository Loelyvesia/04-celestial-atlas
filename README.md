# 星图档案 · Celestial Atlas

十六颗著名亮星组成的一张可交互示意星图。

## 核心互动

拖拽平移、滚轮缩放、点击恒星、切换星座连线。

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

构建产物输出到 `dist/`，使用相对路径 `base: './'`，可部署到 GitHub Pages 的任意子路径。

## 技术栈

Vue 3 · TypeScript · Vite · CSS / SVG / Canvas（本作全部视觉为原创代码绘制，无外部图片与付费 API 依赖）。
