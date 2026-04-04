# Docker 部署（backend + web）

本目录提供 NanoPaste 后端的容器化部署文件，镜像内已包含前端 Web 静态资源。

## 文件说明

- `Dockerfile`：多阶段构建（Web + Go backend）
- `../.dockerignore`：Docker 构建忽略规则（位于仓库根目录）
- `.env`：本地 Compose 环境变量
- `.env.example`：环境变量模板
- `docker-build.sh`：手动构建镜像脚本
- `docker-compose.yml`：Compose 启动配置（持久化 SQLite 数据）

## 使用

在仓库根目录执行：

```bash
bash build/docker-build.sh
docker compose -f build/docker-compose.yml up -d
```

查看日志：

```bash
docker compose -f build/docker-compose.yml logs -f backend
```

访问地址：

- `http://<主机IP>:8080/`
- `http://<主机IP>:8080/health`

## 环境变量

建议先复制模板再修改：

```bash
cp build/.env.example build/.env
```

重点配置：

- `JWT_SECRET`：必须改为强随机字符串。
- 其他变量见 `build/.env` 与 `build/docker-compose.yml`。
