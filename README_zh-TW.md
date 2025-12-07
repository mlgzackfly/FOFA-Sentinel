# FOFA Sentinel

<div align="center">

![FOFA Sentinel](https://img.shields.io/badge/FOFA-Sentinel-d72638?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)

一個現代化、駭客風格的網頁應用程式，用於使用 FOFA API 進行主動式安全偵測。

[English](./README.md) • [简体中文](./README_zh-CN.md) • [繁體中文](./README_zh-TW.md)

[功能](#功能) • [安裝](#開始使用) • [文件](#文件) • [貢獻](./CONTRIBUTING.md)

</div>

## 截圖

<div align="center">

![Query Interface](./docs/screenshots/query-interface.png)

*FOFA Sentinel 查詢介面*

</div>

## 功能

- 🔍 **完整的 FOFA API 整合** - 支援所有 API 端點
- 💾 **查詢歷史** - 儲存和管理您的搜尋查詢
- 📊 **結果儲存** - 將查詢結果儲存在 SQLite 資料庫中
- 📄 **匯出結果** - 以 JSON、TXT 或 CSV 格式匯出結果
- 🔐 **API 金鑰管理** - 安全的 API 金鑰儲存
- 🎨 **駭客風格 UI** - 現代化、專業的介面，帶有終端機美學

## 技術棧

- **前端**: React + TypeScript + Vite
- **後端**: Node.js + Express + TypeScript
- **資料庫**: SQLite (better-sqlite3)

## 開始使用

### 前置需求

- Node.js 18+
- npm 或 yarn

### 安裝

```bash
# 安裝依賴
npm install

# 複製環境變數檔案（選用）
cp .env.example .env

# 執行開發伺服器（前端和後端）
npm run dev
```

應用程式將在以下位置可用：
- 前端: http://localhost:3000
- 後端 API: http://localhost:3002（預設值，可透過 `.env` 設定）

### 首次設定

1. 啟動應用程式：`npm run dev`
2. 導航至設定頁面（側邊欄中的 CONFIG）
3. 輸入您的 FOFA API 金鑰，從 https://fofa.info/user/personal 取得
4. 點擊「儲存」以儲存您的憑證
   - 注意：您的 email 會自動從帳號資訊中取得

### 建置生產版本

```bash
npm run build
```

### 執行生產版本

建置後，您可以執行生產伺服器：

```bash
# 啟動伺服器
npm run build:server

# 伺服器將在連接埠 3002 上執行（或從 .env 中的 PORT）
# 使用任何靜態檔案伺服器從 dist/client 提供前端建置
```

## 文件

- [環境變數](./docs/ENVIRONMENT.md) - 設定指南
- [疑難排解](./docs/TROUBLESHOOTING.md) - 常見問題和解決方案
- [貢獻](./CONTRIBUTING.md) - 如何貢獻
- [更新日誌](./CHANGELOG.md) - 版本歷史

## 專案結構

```
fofa/
├── src/
│   ├── server/          # 後端伺服器
│   │   ├── index.ts     # 伺服器進入點
│   │   ├── routes/      # API 路由
│   │   ├── db/          # 資料庫設定
│   │   └── services/    # 業務邏輯
│   ├── client/          # 前端 React 應用程式
│   │   ├── components/  # React 元件
│   │   ├── pages/       # 頁面元件
│   │   ├── hooks/       # 自訂 Hooks
│   │   └── utils/       # 工具函數
│   └── shared/          # 共享類型
├── docs/                # 文件
├── .github/             # GitHub 範本和工作流程
├── data/                # SQLite 資料庫檔案
└── public/              # 靜態資源
```

## API 端點

### FOFA API 包裝器
- `POST /api/fofa/search` - 搜尋主機
- `POST /api/fofa/stats` - 取得統計資料
- `POST /api/fofa/host` - 主機聚合
- `GET /api/fofa/account` - 帳號資訊
- `POST /api/fofa/search-after` - 搜尋後續（分頁）

### 應用程式 API
- `GET /api/history` - 取得查詢歷史
- `GET /api/history/:id` - 取得特定查詢
- `DELETE /api/history/:id` - 刪除查詢
- `GET /api/results/:id` - 取得查詢結果
- `POST /api/export/:id` - 匯出結果為 TXT
- `POST /api/config/key` - 儲存 API 金鑰
- `GET /api/config/key` - 取得 API 金鑰（遮罩）

## 貢獻

歡迎貢獻！請閱讀我們的[貢獻指南](./CONTRIBUTING.md)以了解行為準則和提交 Pull Request 的流程。

## 授權

本專案採用 MIT 授權條款 - 詳見 [LICENSE](./LICENSE) 檔案。

## 致謝

- [FOFA](https://fofa.info/) - 提供優秀的安全搜尋引擎 API
- 設計靈感來自終端機和駭客美學

## 支援

如果您覺得這個專案有幫助，請考慮在 GitHub 上給它一個 ⭐！

---

Made with ❤️ by the FOFA Sentinel contributors

