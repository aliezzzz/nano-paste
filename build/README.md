# Docker 部署（backend + web）

本目录提供 NanoPaste 后端的容器化部署文件，镜像内已包含前端 Web 静态资源。

## 文件说明

- `Dockerfile`：多阶段构建（Web + Go backend）
- `../.dockerignore`：Docker 构建忽略规则（位于仓库根目录）
- `.env`：本地 Compose 环境变量
- `.env.example`：环境变量模板
- `docker-build.sh`：手动构建镜像脚本
- `docker-compose.yml`：Compose 启动配置（SQLite 数据映射到 `build/data`，前端静态资源映射到 `build/web`）

## 前端目录挂载

`docker-compose.yml` 将宿主机 `build/web` 只读挂载到容器内 `/app/web`。后端按请求读取文件系统，因此**更新前端无需重新打包镜像，也不用重启容器**：

1. 本地构建前端：

   ```bash
   cd apps/desktop && pnpm install && pnpm run build:web
   ```

2. 同步 dist 内容到 `build/web`（注意是内容，不是 dist 文件夹本身）：

   ```bash
   rm -rf build/web && mkdir -p build/web && cp -r apps/desktop/dist/. build/web/
   ```

   服务器上同理，可直接上传覆盖：

   ```bash
   scp -r apps/desktop/dist/* 用户@服务器:部署目录/build/web/
   ```

注意事项：

- 首次 `docker compose up -d` 前，`build/web` 必须已包含构建产物（至少有 `index.html`），否则后端因找不到 Web 入口文件启动失败。
- 首次加入该挂载或调整挂载配置时，需要 `docker compose -f build/docker-compose.yml up -d` 重建容器；日常更新只需覆盖 `build/web` 内文件，即时生效。
- `build/web/` 已加入 `.gitignore`，不会被提交到仓库。

## 使用

在仓库根目录执行：

```bash
mkdir -p build/data
chmod 777 build/data
bash build/docker-build.sh
docker compose -f build/docker-compose.yml up -d
```

说明：

- 在 Windows 上请使用 Git Bash 执行上述命令；在 WSL 中可直接执行同一组命令。
- 仓库强制 `.sh` 文件使用 LF 换行，避免在 Windows 工作区执行时出现 `pipefail` 解析错误。
- 默认按 `linux/amd64` 构建，适合部署到 x86_64 Linux 机器。
- 如需覆盖平台，可临时指定：`PLATFORM=linux/arm64 bash build/docker-build.sh`。

查看日志：

```bash
docker compose -f build/docker-compose.yml logs -f nanopaste
```

访问地址：

- `http://<主机IP>:${HOST_PORT}/`
- `http://<主机IP>:${HOST_PORT}/health`

## 环境变量

建议先复制模板再修改：

```bash
cp build/.env.example build/.env
```

重点配置：

- `JWT_SECRET`：必须改为强随机字符串。
- `HOST_PORT`：宿主机暴露端口（默认 `8989`）。
- `APP_PORT`：容器内服务监听端口（默认 `8080`）。
- 其他变量见 `build/.env` 与 `build/docker-compose.yml`。
