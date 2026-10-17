# 汽车零部件库存与追溯管理系统

基于 Django、React 和 PostgreSQL 的库存与订单管理项目，面向汽车零部件管理方向进行中文化整理与学习实践。

当前版本提供通用库存、采购、销售及库存流转查询能力；车型、装车记录等汽车专属业务尚未实现。

## 功能介绍

- **商品管理**：维护商品名称、编码、计量单位及基础信息。
- **库存管理**：登记入库记录，查询可用数量、库存分配与流转情况。
- **采购与销售**：管理订单明细，完成采购收货和销售库存分配。
- **财务分析**：查看收入、采购成本、销售成本及利润等指标。
- **用户管理**：登录认证、用户数据隔离及超级管理员管理用户。
- **中文界面**：菜单、表单、按钮、状态、日期及常见错误提示中文化。

## 技术栈

- 后端：Python、Django、Django REST Framework、JWT
- 前端：React、TypeScript、Vite、Mantine、TanStack Query
- 数据库与部署：PostgreSQL、Docker、Docker Compose

## 本地运行

安装并启动 Docker Desktop，在项目根目录执行：

```powershell
docker compose up -d --build
```

浏览器访问 http://localhost:8000 。首次使用可创建管理员账号：

```powershell
docker compose exec app python manage.py createsuperuser
```

按终端提示设置自己的用户名和密码。请勿将真实密码、数据库备份或 `.env` 文件上传至仓库。

修改代码后重新构建应用：

```powershell
docker compose up -d --build app
```

当前 Docker 配置用于本地学习和演示，包含上游提供的演示配置。数据库数据保存在 Docker 数据卷中，不包含在本仓库内。

## 项目结构

```text
backend/             Django 接口、业务模型与测试
frontend/            React 页面与交互
docker/              容器启动脚本
Dockerfile           前端构建与应用镜像配置
docker-compose.yml   应用和数据库服务编排
docs/                原项目说明及本版本说明
```

## 来源与本版本改动

原项目：[TiagoFelice/Inventory-Management-System](https://github.com/TiagoFelice/Inventory-Management-System)。

本仓库保留原有提交历史与项目来源。原项目提供主要库存与订单业务；本版本主要完成界面中文化、中文语言环境配置及中文说明整理，未将原有业务功能声明为从零独立开发。

- [原项目完整说明](docs/UPSTREAM_README.md)
- [中文化改动说明](docs/CHANGES_ZH.md)

原仓库当前未附带独立许可证文件，本仓库未擅自为上游代码添加新的许可证。
