# FOFA Sentinel

<div align="center">

![FOFA Sentinel](https://img.shields.io/badge/FOFA-Sentinel-d72638?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)

一个现代化、黑客风格的 Web 应用程序，用于使用 FOFA API 进行主动安全侦察。

[English](./README.md) • [简体中文](./README_zh-CN.md) • [繁體中文](./README_zh-TW.md)

[功能](#功能) • [安装](#开始使用) • [文档](#文档) • [贡献](./CONTRIBUTING.md)

</div>

## 截图

<div align="center">

![Query Interface](./docs/screenshots/query-interface.png)

*FOFA Sentinel 查询界面*

</div>

## 功能

- 🔍 **完整的 FOFA API 集成** - 支持所有 API 端点
- 💾 **查询历史** - 保存和管理您的搜索查询
- 📊 **结果存储** - 将查询结果存储在 SQLite 数据库中
- 📄 **导出结果** - 以 JSON、TXT 或 CSV 格式导出结果
- 🔐 **API 密钥管理** - 安全的 API 密钥存储
- 🎨 **黑客风格 UI** - 现代化、专业的界面，带有终端美学

## 技术栈

- **前端**: React + TypeScript + Vite
- **后端**: Node.js + Express + TypeScript
- **数据库**: SQLite (better-sqlite3)

## 开始使用

### 前置要求

- Node.js 18+
- npm 或 yarn

### 安装

```bash
# 安装依赖
npm install

# 复制环境变量文件（可选）
cp .env.example .env

# 运行开发服务器（前端和后端）
npm run dev
```

应用程序将在以下位置可用：
- 前端: http://localhost:3000
- 后端 API: http://localhost:3002（默认值，可通过 `.env` 配置）

### 首次设置

1. 启动应用程序：`npm run dev`
2. 导航到设置页面（侧边栏中的 CONFIG）
3. 输入您的 FOFA API 密钥，从 https://fofa.info/user/personal 获取
4. 点击「保存」以存储您的凭据
   - 注意：您的 email 将自动从账户信息中获取

### 构建生产版本

```bash
npm run build
```

### 运行生产版本

构建后，您可以运行生产服务器：

```bash
# 启动服务器
npm run build:server

# 服务器将在端口 3002 上运行（或从 .env 中的 PORT）
# 使用任何静态文件服务器从 dist/client 提供前端构建
```

## 文档

- [环境变量](./docs/ENVIRONMENT.md) - 配置指南
- [故障排除](./docs/TROUBLESHOOTING.md) - 常见问题和解决方案
- [贡献](./CONTRIBUTING.md) - 如何贡献
- [更新日志](./CHANGELOG.md) - 版本历史

## 项目结构

```
fofa/
├── src/
│   ├── server/          # 后端服务器
│   │   ├── index.ts     # 服务器入口点
│   │   ├── routes/      # API 路由
│   │   ├── db/          # 数据库设置
│   │   └── services/    # 业务逻辑
│   ├── client/          # 前端 React 应用程序
│   │   ├── components/  # React 组件
│   │   ├── pages/       # 页面组件
│   │   ├── hooks/       # 自定义 Hooks
│   │   └── utils/       # 工具函数
│   └── shared/          # 共享类型
├── docs/                # 文档
├── .github/             # GitHub 模板和工作流程
├── data/                # SQLite 数据库文件
└── public/              # 静态资源
```

## API 端点

### FOFA API 包装器
- `POST /api/fofa/search` - 搜索主机
- `POST /api/fofa/stats` - 获取统计信息
- `POST /api/fofa/host` - 主机聚合
- `GET /api/fofa/account` - 账户信息
- `POST /api/fofa/search-after` - 搜索后续（分页）

### 应用程序 API
- `GET /api/history` - 获取查询历史
- `GET /api/history/:id` - 获取特定查询
- `DELETE /api/history/:id` - 删除查询
- `GET /api/results/:id` - 获取查询结果
- `POST /api/export/:id` - 导出结果为 TXT
- `POST /api/config/key` - 保存 API 密钥
- `GET /api/config/key` - 获取 API 密钥（掩码）

## 贡献

欢迎贡献！请阅读我们的[贡献指南](./CONTRIBUTING.md)以了解行为准则和提交 Pull Request 的流程。

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](./LICENSE) 文件。

## 致谢

- [FOFA](https://fofa.info/) - 提供优秀的安全搜索引擎 API
- 设计灵感来自终端和黑客美学

## 支持

如果您觉得这个项目有帮助，请考虑在 GitHub 上给它一个 ⭐！

---

Made with ❤️ by the FOFA Sentinel contributors


