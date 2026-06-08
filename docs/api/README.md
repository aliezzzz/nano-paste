# API / Contracts 说明

本目录用于管理 NanoPaste 当前真实后端 API 文档与共享契约说明。

## 目录职责

- 记录当前 Go 后端已经注册的接口。
- 约定请求/响应数据结构。
- 作为 `packages/contracts` 的文档索引入口。

## 当前状态

- `docs/api/backend-api.md` 对应当前 Go + SQLite 后端实现。
- `packages/contracts/v1` 是前端使用的 TypeScript 类型契约。
- 早期设计中的 devices、events、WebSocket 同步接口当前没有注册。

## 契约索引

- [`packages/contracts/v1/index.ts`](../../packages/contracts/v1/index.ts)
- [`packages/contracts/v1/errors.ts`](../../packages/contracts/v1/errors.ts)
- [`packages/contracts/v1/common.ts`](../../packages/contracts/v1/common.ts)
- [`packages/contracts/v1/auth.ts`](../../packages/contracts/v1/auth.ts)
- [`packages/contracts/v1/items.ts`](../../packages/contracts/v1/items.ts)
- [`packages/contracts/v1/files.ts`](../../packages/contracts/v1/files.ts)

## 实现版 API 文档

- [`docs/api/backend-api.md`](./backend-api.md)
