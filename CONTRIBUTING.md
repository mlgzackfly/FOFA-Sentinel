# Contributing to FOFA API Client

感謝您對 FOFA API Client 的興趣！我們歡迎所有形式的貢獻。

## 如何貢獻

### 報告問題

如果您發現了 bug 或有功能建議，請：

1. 檢查 [Issues](https://github.com/your-username/fofa-api-client/issues) 確認問題尚未被報告
2. 創建新的 Issue，包含：
   - 清晰的問題描述
   - 重現步驟
   - 預期行為 vs 實際行為
   - 環境信息（OS、Node.js 版本等）

### 提交代碼

1. **Fork 專案**並克隆到本地
2. **創建功能分支**：
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```
3. **進行開發**：
   - 遵循現有的代碼風格
   - 確保代碼通過 lint 檢查
   - 添加必要的註釋
4. **提交變更**：
   ```bash
   git commit -m "feat(scope): your feature description"
   ```
   - 遵循 [約定式提交](https://www.conventionalcommits.org/) 格式
   - 使用英文撰寫 commit message
5. **推送並創建 Pull Request**：
   ```bash
   git push origin feature/your-feature-name
   ```
   - 在 GitHub 上創建 PR 到 `develop` 分支
   - 填寫 PR 描述，說明變更內容

## 開發規範

### 代碼風格

- 使用 TypeScript 嚴格模式
- 遵循 ESLint 和 Prettier 配置
- 組件使用函數式組件和 Hooks
- 使用有意義的變數和函數名稱

### Commit 規範

使用約定式提交格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 類型：**
- `feat`: 新功能
- `fix`: 修復 bug
- `docs`: 文檔更新
- `style`: 代碼格式調整
- `refactor`: 重構
- `test`: 測試相關
- `chore`: 構建/工具調整

**範例：**
```bash
feat(ui): add dark mode toggle
fix(api): resolve CORS issue
docs: update installation guide
```

### 分支策略

- `main`: 正式環境分支
- `develop`: 開發分支
- `feature/*`: 新功能分支
- `fix/*`: Bug 修復分支

## 開發環境設置

1. Fork 並克隆專案
2. 安裝依賴：`npm install`
3. 複製環境變數：`cp .env.example .env`
4. 啟動開發服務器：`npm run dev`
5. 運行 lint：`npm run lint`
6. 運行類型檢查：`npm run type-check`

## 測試

在提交 PR 前，請確保：

- [ ] 代碼通過 lint 檢查
- [ ] TypeScript 類型檢查通過
- [ ] 手動測試新功能
- [ ] 更新相關文檔

## 問題？

如有任何問題，請在 [Issues](https://github.com/your-username/fofa-api-client/issues) 中提出。

再次感謝您的貢獻！🎉

