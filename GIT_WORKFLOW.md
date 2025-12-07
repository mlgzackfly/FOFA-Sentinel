# Git 工作流程 Git Workflow

本文檔說明 Fenryx Sentinel 專案的 Git 工作流程。

## 分支策略 Branch Strategy

### 主要分支

- **`main`** - 正式環境分支，只接受 PR merge，保持穩定可部署狀態
- **`develop`** - 開發環境分支，所有功能開發的整合分支

### 功能分支

- **`feature/*`** - 新功能開發
  - 範例：`feature/auth-integration`, `feature/findings-crud`
- **`fix/*`** - 問題修復
  - 範例：`fix/login-error`, `fix/rls-policy`
- **`hotfix/*`** - 緊急修復（從 main 分支建立）
  - 範例：`hotfix/security-patch`

## 工作流程 Workflow

### 1. 開始新功能

```bash
# 從 develop 分支建立功能分支
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### 2. 開發與提交

```bash
# 進行開發...
git add .
git commit -m "feat(scope): your commit message"
```

### 3. 推送與建立 PR

```bash
# 推送分支
git push origin feature/your-feature-name

# 在 GitHub 建立 Pull Request 到 develop 分支
```

### 4. Code Review 與 Merge

- 等待至少一人 code review
- 確保 CI 通過
- 通過後 merge 到 develop

### 5. 發布到正式環境 (Release to Production)

**重要**：`develop` 合併到 `main` **必須**透過 Pull Request，且需要通過所有檢查。

#### 5.1 建立 Release PR

```bash
# 確保 develop 分支是最新的
git checkout develop
git pull origin develop

# 在 GitHub 建立 Pull Request：
# Base: main ← Compare: develop
```

#### 5.2 Release PR 要求

Release PR 必須滿足以下條件：

1. **所有 CI 檢查通過**
   - Lint 檢查
   - TypeScript 類型檢查
   - 格式檢查
   - 建置成功
   - Commit message 格式檢查
   - PR 標題格式檢查

2. **至少一人 Code Review 批准**

3. **使用 Release PR Template**
   - 在建立 PR 時選擇 `pull_request_template_release.md`
   - 填寫完整的發布說明

4. **測試狀態確認**
   - [ ] 已在 staging 環境測試
   - [ ] 已進行回歸測試
   - [ ] 已檢查資料庫遷移（如有）

#### 5.3 合併 Release PR

```bash
# 在 GitHub 上合併 PR（使用 "Squash and merge" 或 "Create a merge commit"）
# 合併後，main 分支會自動觸發 release workflow
```

#### 5.4 建立版本標籤（可選）

```bash
# 合併後，可以建立版本標籤
git checkout main
git pull origin main
git tag -a v0.2.0 -m "Release version 0.2.0"
git push origin v0.2.0
```

## Commit 規範 Commit Convention

使用**約定式提交（Conventional Commits）**，**必須使用英文**：

### 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 類型

- `feat` - 新功能
- `fix` - 問題修復
- `docs` - 文件更新
- `style` - 格式調整（不影響程式邏輯）
- `refactor` - 重構
- `test` - 測試相關
- `chore` - 建置/工具調整

### Scope（可選）

- `auth` - 認證相關
- `ui` - UI 元件
- `api` - API 相關
- `db` - 資料庫相關
- `config` - 設定相關

### 範例

```bash
# 新功能
feat(auth): add JWT token refresh mechanism

# 問題修復
fix(ui): resolve button hover state issue

# 文件更新
docs: update API documentation

# 重構
refactor(api): simplify error handling logic
```

## GitHub Actions CI/CD

專案使用 GitHub Actions 進行自動化檢查和部署。

### CI Workflow

每次 Push 或 PR 時會自動執行：

1. **Lint and Type Check**
   - ESLint 檢查
   - Prettier 格式檢查
   - TypeScript 類型檢查
   - 建置檢查

2. **Commit Message Check** (僅 PR)
   - 檢查所有 commit messages 是否符合約定式提交格式

3. **PR Title Check** (僅 PR)
   - 檢查 PR 標題是否符合約定式提交格式

4. **Release Check** (僅 develop → main PR)
   - 生產環境建置驗證
   - TODO/FIXME 註解檢查

### Release Workflow

當在 `main` 分支建立版本標籤（如 `v0.2.0`）時，會自動：

- 建立 GitHub Release
- 生成 Changelog

### 分支保護規則 (Branch Protection Rules)

在 GitHub 設定中，建議為 `main` 和 `develop` 分支啟用以下保護規則：

#### main 分支保護規則

- ✅ Require a pull request before merging
  - Require approvals: 1
  - Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging
  - Required checks: `lint-and-type-check`, `check-commit-messages`, `check-pr-title`, `release-check`
- ✅ Require conversation resolution before merging
- ✅ Require linear history (建議使用 "Squash and merge")
- ✅ Do not allow bypassing the above settings

#### develop 分支保護規則

- ✅ Require a pull request before merging
  - Require approvals: 1
- ✅ Require status checks to pass before merging
  - Required checks: `lint-and-type-check`, `check-commit-messages`, `check-pr-title`
- ✅ Require conversation resolution before merging

## Git Hooks

專案使用 Husky 設定 Git hooks：

### Pre-commit Hook

自動執行：

- 程式碼格式檢查 (`npm run format:check`)
- ESLint 檢查 (`npm run lint`)
- TypeScript 類型檢查 (`npm run type-check`)

### Commit-msg Hook

自動檢查 commit message 是否符合約定式提交格式。

## Pull Request 規範

### PR 標題

**必須**遵循 commit 規範格式，GitHub Actions 會自動檢查：

```
feat(auth): add JWT token refresh mechanism
fix(ui): resolve button hover state issue
```

格式：`<type>(<scope>): <subject>`

- `type`: feat, fix, docs, style, refactor, test, chore, perf
- `scope`: auth, ui, api, db, config, compliance, security (可選)
- `subject`: 簡短描述，**不能以大寫字母開頭**

### PR 類型

#### 一般功能 PR (feature/fix → develop)

使用預設的 `PULL_REQUEST_TEMPLATE.md`，必須包含：

- 變更說明
- 變更類型
- 測試計畫
- 相關 Issue（如有）

#### Release PR (develop → main)

使用 `pull_request_template_release.md`，必須包含：

- 版本資訊
- 變更摘要（新功能、修復、改進等）
- 測試狀態
- 部署檢查清單

### PR 檢查清單

#### 一般 PR 檢查清單

- [ ] 程式碼遵循專案開發規範
- [ ] 已通過本地測試
- [ ] 已通過 TypeScript 類型檢查
- [ ] 已通過 ESLint 檢查
- [ ] 已通過格式檢查
- [ ] 已更新相關文件（如有需要）
- [ ] PR 標題符合約定式提交格式
- [ ] 所有 commit messages 符合約定式提交格式

#### Release PR 檢查清單

- [ ] 所有一般 PR 檢查項目
- [ ] 所有 CI 檢查已通過
- [ ] 已在 staging 環境測試
- [ ] 已進行回歸測試
- [ ] 已檢查資料庫遷移（如有）
- [ ] 已檢查環境變數變更（如有）
- [ ] 已更新版本號
- [ ] 已準備回滾計畫

## 緊急修復 Hotfix

當 `main` 分支需要緊急修復時：

### 1. 建立 Hotfix 分支

```bash
# 從 main 建立 hotfix 分支
git checkout main
git pull origin main
git checkout -b hotfix/issue-description
```

### 2. 修復與提交

```bash
# 進行修復...
git add .
git commit -m "fix(scope): description of the hotfix"
git push origin hotfix/issue-description
```

### 3. 建立 PR 到 main

- 在 GitHub 建立 Pull Request：`hotfix/issue-description` → `main`
- 標記為 `hotfix` 類型
- 說明緊急修復的原因和影響範圍
- 等待 Code Review 和 CI 通過後合併

### 4. 合併回 develop

```bash
# 合併到 main 後，將 hotfix 也合併回 develop
git checkout develop
git pull origin develop
git merge hotfix/issue-description
git push origin develop

# 或透過 PR 合併回 develop（推薦）
```

**注意**：Hotfix 必須同時合併到 `main` 和 `develop`，確保兩個分支保持同步。

## 最佳實踐 Best Practices

1. **經常同步**：定期從 develop 拉取最新變更

   ```bash
   git checkout develop
   git pull origin develop
   git checkout feature/your-branch
   git merge develop
   ```

2. **保持分支乾淨**：完成功能後立即 merge，避免長期分支

3. **小步提交**：頻繁提交，每次提交只做一件事

4. **清晰的 commit message**：清楚說明變更內容

5. **測試後再提交**：確保本地測試通過

## 常見問題 FAQ

### Q: 如何更新功能分支？

```bash
git checkout feature/your-branch
git fetch origin
git merge origin/develop
```

### Q: 如何修改最後一次 commit？

```bash
# 修改 commit message
git commit --amend

# 修改內容
git add .
git commit --amend --no-edit
```

### Q: 如何清理已 merge 的分支？

```bash
# 刪除本地分支
git branch -d feature/merged-branch

# 刪除遠端分支
git push origin --delete feature/merged-branch
```

## 版本發布流程 Version Release Process

### 1. 準備發布

在 `develop` 分支完成所有功能開發和測試後：

```bash
# 確保 develop 是最新的
git checkout develop
git pull origin develop

# 檢查是否有未合併的 PR
# 確認所有功能都已測試通過
```

### 2. 建立 Release PR

在 GitHub 建立 Pull Request：

- **Base**: `main`
- **Compare**: `develop`
- **Title**: `chore: release v0.2.0` (使用實際版本號)
- **Template**: 選擇 `pull_request_template_release.md`

### 3. Release PR 審查

- 填寫完整的發布說明
- 列出所有變更（新功能、修復、改進）
- 確認測試狀態
- 等待 Code Review 批准
- 確保所有 CI 檢查通過

### 4. 合併 Release PR

- 使用 "Squash and merge" 或 "Create a merge commit"
- 合併後，`main` 分支會自動觸發 release workflow

### 5. 建立版本標籤（可選）

```bash
git checkout main
git pull origin main

# 建立版本標籤
git tag -a v0.2.0 -m "Release version 0.2.0: Add GDPR compliance features"

# 推送標籤（會觸發 GitHub Release）
git push origin v0.2.0
```

### 6. 驗證發布

- 檢查 GitHub Release 是否自動建立
- 驗證生產環境部署
- 通知相關團隊成員

## GitHub Actions 設定說明

### 設定分支保護規則

1. 前往 GitHub Repository → Settings → Branches
2. 為 `main` 分支新增規則：
   - Branch name pattern: `main`
   - 啟用所有建議的保護規則（見上方「分支保護規則」章節）
3. 為 `develop` 分支新增規則：
   - Branch name pattern: `develop`
   - 啟用基本的保護規則

### 設定 Secrets（如需要）

如果 CI 需要存取外部服務，在 Settings → Secrets and variables → Actions 中設定：

- `NEXT_PUBLIC_SUPABASE_URL` (可選，用於建置測試)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (可選，用於建置測試)

## 工作流程圖 Workflow Diagram

```
feature/* ──PR──> develop ──PR──> main ──tag──> Release
   │                │                │
   │                │                │
   └────────────────┴────────────────┘
              (hotfix 同時合併)
```

---

_最後更新：2025-12_
