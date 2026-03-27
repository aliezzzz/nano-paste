# NanoPaste

NanoPaste 项目当前处于 **阶段 A（桌面端 + Mock）**。

## 阶段 A 目标

- 先实现桌面端（Windows/macOS）基础能力。
- 技术方向采用 Tauri。
- 使用本地 Mock（不接真实后端）。
- 先规范项目目录结构，为后续云端后端接入做准备。

## 目录说明

- `apps/desktop`：桌面端应用（Tauri）目录。
- `packages/contracts`：接口契约与数据结构定义目录。
- `packages/mock-server`：本地 Mock 服务目录。
- `packages/shared`：可复用共享模块目录。
- `docs/architecture`：架构与阶段规划文档。
- `docs/api`：接口文档与契约说明。
- `scripts`：项目脚本目录。

> 当前子任务仅完成目录与最小文档初始化，不包含业务代码实现。
