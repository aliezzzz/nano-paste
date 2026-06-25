# NanoPaste UI 改造方案（参考 nanopaste-demo.html）

> 参考原型：`C:\Users\50414\Downloads\nanopaste-demo.html`
> 原则：参考呈现效果和配色，不照搬细节
> 范围：一次性全改

---

## 改动文件清单

| 文件 | 改动内容 |
|------|----------|
| `apps/desktop/src/assets/css/global.css` | 配色调整 + 新增 CSS 变量 |
| `apps/desktop/uno.config.ts` | header 高度 + sidebar 宽度 |
| `apps/desktop/src/components/workspace/ItemsPanel.vue` | 卡片内容区 + 分类动态显示 + 瀑布流 + type-icon 分色 + 收藏金色 |
| `apps/desktop/src/components/workspace/SendPanel.vue` | mode-tabs + editor-wrap + 字数统计 |
| `apps/desktop/src/components/WorkspaceHost.vue` | header 布局调整 |
| `apps/desktop/src/components/workspace/UploadPanel.vue` | 微调适配 |

---

## 1. global.css — 配色 + 新增变量

### 1.1 浅色模式调整为 demo 绿灰调

```css
:root {
  --bg-main: #f5f7f7;
  --bg-card: #ffffff;
  --text-main: #182421;
  --text-muted: #66736f;
  --text-subtle: #97a39f;
  --accent-rgb: 22, 184, 137;
  --accent-soft: #e8f8f2;
  --border-soft: #e2e8e5;
  --border-strong: #d3ddd8;
  --shadow-sm: 0 8px 24px rgba(21, 34, 29, 0.055);
  --shadow-md: 0 14px 34px rgba(21, 34, 29, 0.09);
}
```

### 1.2 深色模式

```css
.dark {
  --bg-main: #0d1413;
  --bg-card: #141e1c;
  --accent-rgb: 57, 214, 163;
  --accent-soft: #17372e;
  --border-soft: #293936;
  --border-strong: #39504a;
}
```

### 1.3 新增变量（浅色 + 深色）

**代码黑底预览：**
```css
:root {
  --code-bg: #17242d;
  --code-text: #d9f8ec;
}
.dark {
  --code-bg: #0b1116;
  --code-text: #d5f9ec;
}
```

**收藏金色星标：**
```css
:root {
  --warning: #f0b429;
  --warning-soft: rgba(240, 180, 41, 0.12);
}
.dark {
  --warning: #f3c15c;
  --warning-soft: rgba(243, 193, 92, 0.15);
}
```

**type-icon 分色（只分图标颜色，话题标签统一 accent）：**
```css
:root {
  --type-code-bg: #eaf1ff;
  --type-code-fg: #4d7df3;
  --type-file-bg: #fff4d8;
  --type-file-fg: #d99c14;
  --type-image-bg: #e7f4ff;
  --type-image-fg: #4c92d4;
}
.dark {
  --type-code-bg: #1b2c52;
  --type-code-fg: #7ea4ff;
  --type-file-bg: #42351c;
  --type-file-fg: #f4c85f;
  --type-image-bg: #1c3448;
  --type-image-fg: #74b5ef;
}
```

---

## 2. uno.config.ts — header + sidebar

```ts
// header 高度从 h-20 (80px) 改为 h-16 (64px)
"host-header": "relative z-[80] h-16 border-b border-[var(--border-soft)] ...",

// sidebar 宽度从 420px 改为 332px
"host-sidebar": "w-[332px] border-r border-[var(--border-soft)] ...",
```

---

## 3. ItemsPanel.vue — 核心改造

### 3.1 分类动态显示

**新增 `visibleCategories` computed：**
```ts
const visibleCategories = computed(() =>
  categories.filter((c) => c.key === "all" || categoryCounts.value[c.key] > 0)
);
```

**新增 watch 防止选中态悬空：**
```ts
watch(visibleCategories, (list) => {
  if (!list.some((c) => c.key === activeCategory.value)) {
    activeCategory.value = "all";
  }
});
```

**模板 `v-for` 改用 `visibleCategories`：**
```vue
<button v-for="category in visibleCategories" ...>
```

规则：
- `全部` 始终保留（默认入口 + 空状态）
- `文本 / 代码 / 文件 / 图片 / 收藏` 仅 count > 0 时显示
- 当前选中分类消失后自动回退到 `全部`

### 3.2 卡片内容区改造

| 类型 | 当前 | 改为 |
|------|------|------|
| 文本 | `<p class="item-text-content">` 纯文本单行截断 | `<div class="content">` 保留换行 `white-space: pre-wrap` |
| 代码 | 和文本一样 | `<pre class="code-block">` 黑底等宽字体预览 |
| 图片文件 | 只显示文件名 | 占位图区域（图标 + 文件信息）+ 点击触发 preview |
| 普通文件 | 只显示文件名 | 文件信息行（图标 + 大小 + "可下载"） |

**代码黑底预览：**
```vue
<pre v-if="isCodeItem(item)" class="code-block">{{ item.content }}</pre>
```

```css
.code-block {
  background: var(--code-bg);
  color: var(--code-text);
  border-radius: 12px;
  padding: 13px;
  white-space: pre-wrap;
  overflow: auto;
  font-size: 12.5px;
  line-height: 1.62;
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin: 0;
}
```

**图片占位区域：**
```vue
<div v-if="item.type === 'file' && isImageFile(item.fileName)" class="image-preview" @click="emit('item-action', itemPayload(item, 'preview'))">
  <ImageIcon class="image-preview-icon" />
  <span>{{ item.fileName }}</span>
  <span class="image-preview-hint">点击预览</span>
</div>
```

> 注意：图片真实缩略图需要异步调 `prepareFileDownload(fileId)` 获取 URL，复杂度高。
> 本次先做占位区域，点击触发已有的 preview action 打开 `ImagePreviewModal`。

### 3.3 type-icon 分色

**script：**
```ts
function typeIconClass(item: ItemView): string {
  if (isCodeItem(item)) return "type-code";
  if (item.type === "file" && item.fileName && isImageFile(item.fileName)) return "type-image";
  if (item.type === "file") return "type-file";
  return "type-text";
}
```

**模板：**
```vue
<div class="item-icon" :class="typeIconClass(item)" v-html="item.iconSvg"></div>
```

**CSS：**
```css
.item-icon.type-text {
  background: var(--accent-soft);
  color: var(--text-accent);
}
.item-icon.type-code {
  background: var(--type-code-bg);
  color: var(--type-code-fg);
}
.item-icon.type-file {
  background: var(--type-file-bg);
  color: var(--type-file-fg);
}
.item-icon.type-image {
  background: var(--type-image-bg);
  color: var(--type-image-fg);
}
```

### 3.4 收藏金色星标

```css
.favorite-btn--active {
  color: var(--warning);
  background: var(--warning-soft);
}
```

收藏卡片背景保持 `--accent-soft` 纯色底（之前已确认的方案）。

### 3.5 字体大小调整

| 元素 | 当前 | 改为 |
|------|------|------|
| 卡片标题 | `14px / 800` | `15px / 850` |
| 卡片内容 | `12px / 1.5` | `14px / 1.72` |
| 类型标签 | 无 | 新增 `11px` 灰色小标签 |
| 时间 | `11px` | `11px`（不变） |
| 操作按钮 | `11px / 700` | `11px / 750` |

### 3.6 瀑布流布局

```css
.items-section {
  columns: 3 280px;
  column-gap: 12px;
}

.item-card {
  break-inside: avoid;
  margin: 0 0 12px;
  display: block;  /* 瀑布流下不需要 flex column */
}
```

- 去掉 grid 的 `align-items: start` / `align-self: start`（瀑布流不需要）
- 去掉 `.item-footer` 的 `margin-top: auto`（瀑布流卡片高度自由，不需要推底部）
- 卡片高度由内容自然决定

---

## 4. SendPanel.vue — 发送区域改造

### 4.1 mode-tabs 保持三段式

- 文本 / 代码 / 文件
- 文件按钮保持提示性质（滚动到上传区，不切换 contentKind）

### 4.2 editor-wrap 包裹

```vue
<div class="editor-wrap" :class="contentKind === 'code' ? 'editor-wrap--code' : ''">
  <textarea v-model="content" id="text-content" ...></textarea>
  <div class="editor-meta">
    <span>Ctrl + Enter 快速发送</span>
    <span>{{ content.length }}/5000</span>
  </div>
</div>
```

```css
.editor-wrap {
  border: 1px solid var(--border-soft);
  border-radius: 14px;
  background: var(--input-bg);
  padding: 12px;
  transition: 0.18s ease;
}

.editor-wrap:focus-within {
  border-color: rgba(var(--accent-rgb), 0.45);
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.11);
  background: var(--bg-card);
}

```

### 4.3 字数统计

```ts
const contentLength = computed(() => content.value.length);
```

---

## 5. WorkspaceHost.vue — header 调整

- header 高度跟随 `uno.config.ts` 的 `h-16`（64px）
- 搜索框样式微调：
  - 高度 42px
  - 圆角 13px
  - 聚焦时 accent 边框 + 3px glow
- 品牌区副标题保留

---

## 6. UploadPanel.vue — 微调

- 上传区视觉和 SendPanel 的 editor-wrap 风格统一
- 虚线边框 + accent 聚焦态

---

## 不改的内容

- 不改后端
- 不改 `packages/contracts`
- 不改 `composables/useBridge.ts`（preview/download 链路不变）
- 不改 `ImagePreviewModal` / `CodePreviewModal`
- 不改 `api/items.ts`
- 不新增依赖
- 话题标签保持统一 accent 色（只分 type-icon 颜色）

---

## 技术约束

### 文件 URL 构建

图片预览不能直接拼 `baseUrl + fileId`，必须走：
1. `POST /v1/files/{fileId}/prepare-download`
2. 后端返回 `downloadUrl`（可能相对路径）
3. 拼接 `runtimeStore.apiBaseUrl`
4. 喂给 `ImagePreviewModal` 的 `<img :src>`

所以本次图片卡片先做**占位区域**，点击触发已有的 `preview` action，由 `useBridge.ts` 异步获取 URL 并打开 modal。

### 代码预览

代码内容在 `item.content` 里，无需网络请求，可直接在卡片内嵌 `<pre class="code-block">` 显示。

---

## 验证顺序

```bash
# 1. 类型检查
pnpm run typecheck

# 2. 组件测试
pnpm run test:run -- src/components/workspace/ItemsPanel.test.ts src/components/workspace/SendPanel.test.ts

# 3. Web 构建
pnpm run build:web
```

---

## 验收标准

- [ ] 配色为绿灰调，浅色/深色模式都协调
- [ ] 代码卡片有黑底等宽字体预览区
- [ ] 图片卡片有占位预览区域，点击可打开预览
- [ ] 文件卡片显示文件信息行
- [ ] type-icon 按类型分色（文本青绿、代码蓝、文件黄、图片蓝）
- [ ] 收藏星标为金色，和主色区分
- [ ] 卡片标题 15px、内容 14px、行高 1.72
- [ ] 卡片瀑布流排列，高度自由
- [ ] 分类 tab 只显示有内容的分类
- [ ] 发送区 textarea 有 editor-wrap 包裹，聚焦时整体高亮
- [ ] 发送区有字数统计
- [ ] header 高度 64px，搜索框更协调
- [ ] sidebar 宽度 332px
- [ ] 类型检查通过
- [ ] 组件测试通过
- [ ] Web 构建通过
