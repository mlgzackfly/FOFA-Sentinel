# Fenryx Product Design System

# 銳狼科技產品設計系統

**版本 Version:** 1.0
**發布日期 Release Date:** 2025-12-03
**適用範圍 Scope:** 所有 Fenryx 產品與平台開發

---

## 目錄 Table of Contents

1. [設計原則 Design Principles](#設計原則)
2. [色彩系統 Color System](#色彩系統)
3. [間距系統 Spacing System](#間距系統)
4. [字體系統 Typography](#字體系統)
5. [組件規範 Component Specifications](#組件規範)
6. [深色主題 Dark Theme](#深色主題)
7. [響應式設計 Responsive Design](#響應式設計)
8. [動畫與過渡 Animation & Transitions](#動畫與過渡)
9. [無障礙設計 Accessibility](#無障礙設計)
10. [圖示系統 Iconography](#圖示系統)

---

## 設計原則 Design Principles

### 1. 技術優先 Tech-First

產品設計應體現技術專業性，使用等寬字體、代碼風格元素展現技術深度。

### 2. 極簡高效 Minimalist & Efficient

去除不必要的裝飾，專注於功能性與可用性。每個元素都應有明確目的。

### 3. 深色為主 Dark-First

預設使用深色主題，符合開發者與資安專業人員的使用習慣。

### 4. 一致性 Consistency

所有產品應遵循統一的設計語言，建立可識別的品牌體驗。

### 5. 回饋即時 Immediate Feedback

所有互動應提供即時視覺回饋，讓使用者清楚了解系統狀態。

---

## 色彩系統 Color System

### 基礎色盤 Base Palette

#### 品牌色 Brand Colors

```css
/* Primary - Fenryx Crimson */
--color-primary-50: #fee2e2;
--color-primary-100: #fecaca;
--color-primary-200: #fca5a5;
--color-primary-300: #f87171;
--color-primary-400: #ef4444;
--color-primary-500: #d72638; /* Brand Crimson */
--color-primary-600: #b91c2d;
--color-primary-700: #991423;
--color-primary-800: #7f0e1c;
--color-primary-900: #6b0a17;

/* Neutral - Grayscale */
--color-neutral-50: #fafafa;
--color-neutral-100: #f5f5f5;
--color-neutral-200: #e5e5e5;
--color-neutral-300: #d4d4d4;
--color-neutral-400: #a7a7a7; /* Iron Silver */
--color-neutral-500: #737373;
--color-neutral-600: #525252;
--color-neutral-700: #404040;
--color-neutral-800: #2a2a2a; /* Carbon Grey */
--color-neutral-900: #121212; /* Graphite Black */
--color-neutral-950: #050505; /* Deep Black */
```

#### 語義化顏色 Semantic Colors

```css
/* Success - Green */
--color-success-50: #f0fdf4;
--color-success-100: #dcfce7;
--color-success-200: #bbf7d0;
--color-success-300: #86efac;
--color-success-400: #4ade80;
--color-success-500: #28a745; /* Primary Success */
--color-success-600: #16a34a;
--color-success-700: #15803d;
--color-success-800: #166534;
--color-success-900: #14532d;

/* Warning - Amber */
--color-warning-50: #fffbeb;
--color-warning-100: #fef3c7;
--color-warning-200: #fde68a;
--color-warning-300: #fcd34d;
--color-warning-400: #fbbf24;
--color-warning-500: #ffc107; /* Primary Warning */
--color-warning-600: #d97706;
--color-warning-700: #b45309;
--color-warning-800: #92400e;
--color-warning-900: #78350f;

/* Error - Red */
--color-error-50: #fef2f2;
--color-error-100: #fee2e2;
--color-error-200: #fecaca;
--color-error-300: #fca5a5;
--color-error-400: #f87171;
--color-error-500: #dc3545; /* Primary Error */
--color-error-600: #dc2626;
--color-error-700: #b91c1c;
--color-error-800: #991b1b;
--color-error-900: #7f1d1d;

/* Info - Cyan */
--color-info-50: #ecfeff;
--color-info-100: #cffafe;
--color-info-200: #a5f3fc;
--color-info-300: #67e8f9;
--color-info-400: #22d3ee;
--color-info-500: #17a2b8; /* Primary Info */
--color-info-600: #0891b2;
--color-info-700: #0e7490;
--color-info-800: #155e75;
--color-info-900: #164e63;
```

### 深色主題配色 Dark Theme Colors

#### 背景層級 Background Layers

```css
/* 使用多層次背景營造深度感 */
--bg-base: #050505; /* 最深層背景 */
--bg-elevated: #121212; /* 抬升層（卡片、模態框） */
--bg-surface: #1a1a1a; /* 表面層（輸入框、按鈕） */
--bg-overlay: #2a2a2a; /* 懸浮層（下拉選單、提示） */
--bg-subtle: #1f1f1f; /* 微妙背景（斑馬條紋、禁用狀態） */
```

#### 邊框與分隔線 Borders & Dividers

```css
--border-subtle: rgba(167, 167, 167, 0.1); /* 微妙邊框 */
--border-default: rgba(167, 167, 167, 0.2); /* 標準邊框 */
--border-strong: rgba(167, 167, 167, 0.3); /* 強調邊框 */
--border-brand: rgba(215, 38, 56, 0.5); /* 品牌色邊框 */
--divider: rgba(167, 167, 167, 0.15); /* 分隔線 */
```

#### 文字顏色 Text Colors

```css
--text-primary: #ffffff; /* 主要文字 */
--text-secondary: #a7a7a7; /* 次要文字 */
--text-tertiary: #737373; /* 三級文字 */
--text-disabled: #525252; /* 禁用文字 */
--text-inverse: #121212; /* 反色文字（用於淺色背景） */
--text-brand: #d72638; /* 品牌色文字 */
--text-link: #3b82f6; /* 連結文字 */
--text-link-hover: #60a5fa; /* 連結懸停 */
```

#### 互動狀態 Interactive States

```css
/* Hover States */
--hover-bg: rgba(255, 255, 255, 0.05);
--hover-border: rgba(167, 167, 167, 0.4);
--hover-brand: #e03547;

/* Active/Pressed States */
--active-bg: rgba(255, 255, 255, 0.1);
--active-border: rgba(167, 167, 167, 0.6);
--active-brand: #b91c2d;

/* Focus States */
--focus-ring: rgba(215, 38, 56, 0.4);
--focus-ring-width: 2px;
--focus-ring-offset: 2px;

/* Selected States */
--selected-bg: rgba(215, 38, 56, 0.15);
--selected-border: rgba(215, 38, 56, 0.8);
```

### 功能性顏色 Functional Colors

```css
/* Code & Terminal */
--code-bg: #0d0d0d;
--code-inline-bg: rgba(167, 167, 167, 0.15);
--code-border: rgba(167, 167, 167, 0.2);

/* Syntax Highlighting */
--syntax-keyword: #f472b6; /* Pink */
--syntax-string: #34d399; /* Green */
--syntax-number: #fbbf24; /* Amber */
--syntax-function: #60a5fa; /* Blue */
--syntax-comment: #6b7280; /* Gray */
--syntax-variable: #a78bfa; /* Purple */

/* Chart & Data Visualization */
--chart-1: #d72638; /* Primary Brand */
--chart-2: #3b82f6; /* Blue */
--chart-3: #10b981; /* Green */
--chart-4: #f59e0b; /* Amber */
--chart-5: #8b5cf6; /* Purple */
--chart-6: #ec4899; /* Pink */
--chart-7: #14b8a6; /* Teal */
--chart-8: #f97316; /* Orange */

/* Status Indicators */
--status-online: #10b981; /* Green */
--status-away: #f59e0b; /* Amber */
--status-busy: #dc2626; /* Red */
--status-offline: #6b7280; /* Gray */
```

### 透明度系統 Opacity Scale

```css
--opacity-0: 0;
--opacity-5: 0.05;
--opacity-10: 0.1;
--opacity-20: 0.2;
--opacity-30: 0.3;
--opacity-40: 0.4;
--opacity-50: 0.5;
--opacity-60: 0.6;
--opacity-70: 0.7;
--opacity-80: 0.8;
--opacity-90: 0.9;
--opacity-100: 1;
```

### 漸層 Gradients

```css
/* Brand Gradients */
--gradient-brand-primary: linear-gradient(135deg, #d72638 0%, #a01d28 100%);
--gradient-brand-subtle: linear-gradient(
  135deg,
  rgba(215, 38, 56, 0.2) 0%,
  rgba(160, 29, 40, 0.1) 100%
);

/* Background Gradients */
--gradient-bg-dark: linear-gradient(135deg, #121212 0%, #050505 100%);
--gradient-bg-elevated: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);

/* Accent Gradients */
--gradient-accent-red: linear-gradient(135deg, #d72638 0%, #dc3545 100%);
--gradient-accent-blue: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
--gradient-accent-green: linear-gradient(135deg, #10b981 0%, #059669 100%);

/* Overlay Gradients */
--gradient-overlay-top: linear-gradient(180deg, rgba(5, 5, 5, 0.8) 0%, rgba(5, 5, 5, 0) 100%);
--gradient-overlay-bottom: linear-gradient(0deg, rgba(5, 5, 5, 0.8) 0%, rgba(5, 5, 5, 0) 100%);
```

---

## 間距系統 Spacing System

### 基礎間距 Base Spacing Scale

使用 **8px 基準系統** (8px baseline grid)

```css
--space-0: 0px; /* 0 */
--space-1: 4px; /* 0.25rem */
--space-2: 8px; /* 0.5rem */
--space-3: 12px; /* 0.75rem */
--space-4: 16px; /* 1rem */
--space-5: 20px; /* 1.25rem */
--space-6: 24px; /* 1.5rem */
--space-8: 32px; /* 2rem */
--space-10: 40px; /* 2.5rem */
--space-12: 48px; /* 3rem */
--space-16: 64px; /* 4rem */
--space-20: 80px; /* 5rem */
--space-24: 96px; /* 6rem */
--space-32: 128px; /* 8rem */
--space-40: 160px; /* 10rem */
--space-48: 192px; /* 12rem */
--space-56: 224px; /* 14rem */
--space-64: 256px; /* 16rem */
```

### 語義化間距 Semantic Spacing

```css
/* Component Internal Spacing */
--spacing-xs: var(--space-1); /* 4px - Tight spacing */
--spacing-sm: var(--space-2); /* 8px - Small spacing */
--spacing-md: var(--space-4); /* 16px - Medium spacing */
--spacing-lg: var(--space-6); /* 24px - Large spacing */
--spacing-xl: var(--space-8); /* 32px - Extra large */
--spacing-2xl: var(--space-12); /* 48px - 2XL */

/* Layout Spacing */
--layout-xs: var(--space-4); /* 16px */
--layout-sm: var(--space-6); /* 24px */
--layout-md: var(--space-8); /* 32px */
--layout-lg: var(--space-12); /* 48px */
--layout-xl: var(--space-16); /* 64px */
--layout-2xl: var(--space-24); /* 96px */

/* Container Padding */
--container-padding-mobile: var(--space-4); /* 16px */
--container-padding-tablet: var(--space-6); /* 24px */
--container-padding-desktop: var(--space-8); /* 32px */

/* Gutter */
--gutter-mobile: var(--space-4); /* 16px */
--gutter-tablet: var(--space-6); /* 24px */
--gutter-desktop: var(--space-8); /* 32px */
```

---

## 字體系統 Typography

### 字體家族 Font Families

```css
/* Sans-serif - UI & Content */
--font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', 'Roboto', sans-serif;

/* Monospace - Code & Technical */
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace;

/* Chinese - 繁體中文 */
--font-chinese: 'Microsoft JhengHei', 'Noto Sans TC', sans-serif;
```

### 字體尺寸 Font Sizes

```css
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
--text-3xl: 1.875rem; /* 30px */
--text-4xl: 2.25rem; /* 36px */
--text-5xl: 3rem; /* 48px */
--text-6xl: 3.75rem; /* 60px */
--text-7xl: 4.5rem; /* 72px */
--text-8xl: 6rem; /* 96px */
```

### 字體粗細 Font Weights

```css
--font-thin: 200;
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
--font-black: 900;
```

### 行高 Line Heights

```css
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

### 字距 Letter Spacing

```css
--tracking-tighter: -0.05em;
--tracking-tight: -0.025em;
--tracking-normal: 0;
--tracking-wide: 0.025em;
--tracking-wider: 0.05em;
--tracking-widest: 0.1em;
```

### 文字樣式預設 Text Style Presets

```css
/* Display - Hero Headings */
.text-display {
  font-size: var(--text-6xl);
  font-weight: var(--font-extrabold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
}

/* H1 - Page Title */
.text-h1 {
  font-size: var(--text-5xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
}

/* H2 - Section Heading */
.text-h2 {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-snug);
}

/* H3 - Subsection Heading */
.text-h3 {
  font-size: var(--text-3xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
}

/* Body - Regular Text */
.text-body {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-relaxed);
}

/* Caption - Small Text */
.text-caption {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
  letter-spacing: var(--tracking-wide);
}

/* Code - Monospace */
.text-code {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
}
```

---

## 組件規範 Component Specifications

### 按鈕 Buttons

#### 尺寸 Sizes

```css
/* Small Button */
.btn-sm {
  height: 32px;
  padding: 0 12px;
  font-size: var(--text-sm);
  border-radius: 4px;
}

/* Medium Button (Default) */
.btn-md {
  height: 40px;
  padding: 0 16px;
  font-size: var(--text-base);
  border-radius: 6px;
}

/* Large Button */
.btn-lg {
  height: 48px;
  padding: 0 24px;
  font-size: var(--text-lg);
  border-radius: 8px;
}
```

#### 變體 Variants

```css
/* Primary Button */
.btn-primary {
  background: var(--color-primary-500);
  color: white;
  border: none;
}
.btn-primary:hover {
  background: var(--color-primary-600);
}
.btn-primary:active {
  background: var(--color-primary-700);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--color-primary-500);
  border: 1px solid var(--color-primary-500);
}
.btn-secondary:hover {
  background: rgba(215, 38, 56, 0.1);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: none;
}
.btn-ghost:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

/* Danger Button */
.btn-danger {
  background: var(--color-error-500);
  color: white;
  border: none;
}
```

### 輸入框 Input Fields

```css
.input {
  height: 40px;
  padding: 0 12px;
  font-size: var(--text-base);
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  color: var(--text-primary);
  transition: all 0.2s;
}

.input:hover {
  border-color: var(--border-strong);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 2px var(--focus-ring);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input.error {
  border-color: var(--color-error-500);
}
```

### 卡片 Cards

```css
.card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: var(--spacing-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card:hover {
  border-color: var(--border-default);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.card-header {
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--divider);
  margin-bottom: var(--spacing-md);
}

.card-footer {
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--divider);
  margin-top: var(--spacing-md);
}
```

### 標籤/徽章 Tags/Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  border-radius: 9999px;
  letter-spacing: var(--tracking-wide);
}

.badge-primary {
  background: rgba(215, 38, 56, 0.15);
  color: var(--color-primary-400);
}

.badge-success {
  background: rgba(40, 167, 69, 0.15);
  color: var(--color-success-400);
}

.badge-warning {
  background: rgba(255, 193, 7, 0.15);
  color: var(--color-warning-400);
}

.badge-info {
  background: rgba(23, 162, 184, 0.15);
  color: var(--color-info-400);
}
```

---

## 深色主題 Dark Theme

### 主題切換 Theme Switching

深色主題為**預設主題**，淺色主題可選。

```css
/* Dark Theme (Default) */
:root {
  color-scheme: dark;
  /* All dark theme colors */
}

/* Light Theme (Optional) */
[data-theme='light'] {
  color-scheme: light;
  --bg-base: #ffffff;
  --bg-elevated: #fafafa;
  --bg-surface: #f5f5f5;
  --text-primary: #121212;
  --text-secondary: #525252;
  /* ... other light theme overrides */
}
```

---

## 響應式設計 Responsive Design

### 斷點 Breakpoints

```css
--breakpoint-xs: 320px; /* Mobile S */
--breakpoint-sm: 640px; /* Mobile L */
--breakpoint-md: 768px; /* Tablet */
--breakpoint-lg: 1024px; /* Laptop */
--breakpoint-xl: 1280px; /* Desktop */
--breakpoint-2xl: 1536px; /* Large Desktop */
```

### 容器寬度 Container Max Width

```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

---

## 動畫與過渡 Animation & Transitions

### 動畫時長 Duration

```css
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;
```

### 緩動函數 Easing Functions

```css
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### 標準過渡 Standard Transitions

```css
--transition-fast: all var(--duration-fast) var(--ease-out);
--transition-normal: all var(--duration-normal) var(--ease-out);
--transition-slow: all var(--duration-slow) var(--ease-out);
```

---

## 無障礙設計 Accessibility

### 對比度要求 Contrast Requirements

- **正常文字:** 至少 4.5:1
- **大文字 (18px+ 或 14px+ 粗體):** 至少 3:1
- **互動元素:** 至少 3:1

### Focus 樣式 Focus Styles

所有互動元素必須有明顯的 focus 狀態：

```css
:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

### 鍵盤導航 Keyboard Navigation

- 確保所有功能可透過鍵盤操作
- 提供 Skip to Content 連結
- 使用語義化 HTML 標籤

---

## 圖示系統 Iconography

### 圖示規範

- **風格:** 線性 (Line/Outline)
- **粗細:** 2px stroke
- **尺寸:** 16px, 20px, 24px, 32px
- **推薦圖示庫:** Lucide Icons, Feather Icons

### 圖示使用

```css
.icon-sm {
  width: 16px;
  height: 16px;
}
.icon-md {
  width: 20px;
  height: 20px;
}
.icon-lg {
  width: 24px;
  height: 24px;
}
.icon-xl {
  width: 32px;
  height: 32px;
}
```

---

## 實作範例 Implementation Examples

### CSS Variables 完整範例

```css
:root {
  /* Colors */
  --color-primary: #d72638;
  --color-bg: #121212;
  --color-text: #ffffff;

  /* Spacing */
  --space-unit: 8px;
  --space-xs: calc(var(--space-unit) * 0.5);
  --space-sm: var(--space-unit);
  --space-md: calc(var(--space-unit) * 2);
  --space-lg: calc(var(--space-unit) * 3);

  /* Typography */
  --font-base: 'Inter', sans-serif;
  --font-size-base: 16px;
  --line-height-base: 1.5;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;

  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

---

## 工具與資源 Tools & Resources

### 設計工具

- **Figma** - 主要設計工具
- **Tailwind CSS** - CSS 框架（可選）
- **shadcn/ui** - React 組件庫參考

### 顏色工具

- [Coolors](https://coolors.co) - 配色生成
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) - 對比度檢查

### 開發框架建議

- **React** + **TypeScript** + **Tailwind CSS**
- **Next.js** 或 **Astro** (SSR/SSG)
- **Radix UI** 或 **shadcn/ui** (無障礙組件)

---

## 版本記錄 Version History

- **v1.0** (2025-12-03) - 初始版本，建立完整設計系統

---

**維護者 Maintainer:** Marco Huang (Founder & CEO)
**聯絡 Contact:** contact@fenryx.tech
**文件位置 Location:** `/docs/PRODUCT_DESIGN_SYSTEM.md`

---

_此設計系統為活文件，將隨產品發展持續更新。_
