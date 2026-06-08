# NanoPaste 当前阶段说明

本文档保留项目阶段说明。早期“桌面 + Mock 阶段 A”已经结束，当前项目已经进入真实后端与多端前端联调阶段。

## 当前范围

- 后端：Go 1.22 + SQLite，提供真实 `/v1/*` HTTP API。
- 前端：Vue 3 + TypeScript，同一套界面支持 Web、Tauri 桌面端、Android 构建和 Chrome 扩展 popup。
- 契约：`packages/contracts/v1` 提供前端消费的 TypeScript 类型定义。
- 部署：`build` 目录提供 Docker 镜像构建与 Compose 部署。

## 当前已包含

- 账号登录、刷新 token、登出。
- 文本条目创建、列表、删除、收藏。
- 文件上传、下载准备、下载直链、清理。
- 后端托管 Web 静态资源。
- Chrome 扩展右键菜单发送文本、链接、页面和图片。

## 当前不包含

- devices 设备管理接口。
- events / WebSocket 实时同步接口。
- Mock Server 联调链路。
- 多用户组织、分享或权限分组。

## 下一阶段建议

1. 强化生产部署配置校验，尤其是 `JWT_SECRET`。
2. 增加最小端到端验证脚本或集成测试。
3. 继续收口 auth 字段命名策略。
