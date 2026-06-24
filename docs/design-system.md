# Desktop Design System Notes

本文档记录 `apps/desktop` 当前样式职责边界。修改 UI 前先读这里，再读 `apps/desktop/uno.config.ts`、`apps/desktop/src/assets/css/global.css` 和对应组件的 `<style scoped>`。

## 样式来源

- `apps/desktop/uno.config.ts`：语义 shortcuts，承担组件级设计系统入口，不是简单 class alias。
- `apps/desktop/src/assets/css/global.css`：主题 token、基础输入、滚动条、安全区 utility。
- 组件 `<style scoped>`：只放组件局部布局、状态和无法抽成通用 shortcut 的细节。

## 主题 Token

- 背景：`--bg-main`、`--bg-card`、`--bg-glass`、`--input-bg`。
- 文本：`--text-main`、`--text-muted`、`--text-accent`。
- 边框：`--border-soft`、`--border-strong`。
- 强调：`--accent-rgb`、`--accent-glow`。
- 阴影：`--shadow-sm`、`--shadow-md`。

不要在组件里使用未定义 token，例如 `--border-subtle`、`--text-primary`、`--accent-soft`、`--accent`。

## Workspace 布局

- `host-root` / `host-desktop` / `host-mobile` 负责应用级外壳。
- `host-header` 负责顶部导航，高度和层级不要在子组件覆盖。
- `host-sidebar` 是桌面左栏容器，scoped CSS 当前负责 `gap` 和 `padding`。
- `host-content` 是桌面主内容容器，保持 `min-width: 0` / `min-height: 0`，让内部滚动生效。
- `host-mobile-main` 是移动端滚动根；底部导航固定时，要避免内容和 safe area utility 重复补偿。
- `host-mobile-send` / `host-mobile-items` 已提供移动端页面外边距，子组件不要再叠加横向 padding。

## Items 区域

- `items-panel` 是内容面板根节点；桌面间距由父容器和该组件协作，移动端不要重复 padding。
- `items-list` 是滚动容器；不要把滚动放到 `items-section` 或 `item-card`。
- `items-section` 负责卡片网格，卡片间距用 grid `gap`。
- `item-card` 负责卡片视觉和内部纵向间距；内部区域间距优先用 card `gap`，不要在 footer 上叠 `margin-top`。
- `item-main` 负责图标 + 内容主行。
- `item-footer` 负责 topic、动作、时间和删除按钮，必须保持 `min-width: 0`，避免 topic 编辑态撑宽卡片。
- `TopicBadge` 可以在 footer 内进入编辑态，父容器必须限制其最大宽度。

## Send 与 Upload

- `send-panel` 和 `upload-panel` 都位于 `host-sidebar` 或移动端 send 页，应保持同一视觉密度。
- `SendPanel.vue` 当前有较多 scoped 样式，改动时先确认是否与 `send-*` shortcuts 重复。
- `UploadPanel.vue` 主要依赖 `upload-*` shortcuts，若调整左栏卡片视觉，应同步考虑 `SendPanel.vue`。
- 上传队列当前隐藏；不要因为调整 `upload-*` shortcut 误恢复队列显示。

## Mobile Tabs

- `mobile-tabs-nav` 负责固定底部导航。
- `safe-bottom` utility 负责底部安全区；不要同时在 shortcut 内重复写 `pb-safe`。
- 移动端内容页由 `WorkspaceHost.vue` 控制外层 padding，子组件只处理自身内部布局。

## 修改 Checklist

修改 UI 前先确认：

1. 当前 class 是否来自 `uno.config.ts` shortcut。
2. shortcut 是否有 `md:` / `lg:` / `max-*` 响应式规则。
3. scoped CSS 是否覆盖了同名 class 或同一属性。
4. 父容器是否已经提供 padding / gap / overflow / height。
5. 使用的 CSS variable 是否在 `global.css` light/dark 中都存在。
6. 改动是通用设计系统规则，还是当前组件局部变体。
