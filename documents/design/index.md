# Writing Assistant — 技术设计文档

*版本：V2.0，上次更新：2026-06-11*

## 1. 概述

Writing Assistant 是一个纯 JavaScript 实现的 VS Code 扩展，零外部 npm 依赖。

**核心能力：**
- **术语悬停** — 从 Markdown 档案文件中读取术语定义，鼠标悬停时弹出卡片
- **字数统计** — 在状态栏实时显示当前文档的非空白字符数

扩展运行在 Extension Host (Node.js) 环境中，通过 VS Code API 与编辑器交互。

---

## 2. 技术栈

| 项目 | 说明 |
|------|------|
| 运行环境 | Node.js 12+（随 VS Code 内置） |
| 语言 | JavaScript (ES2020) |
| VS Code API | ^1.70.0 |
| 外部依赖 | 无 |
| 打包工具 | [build.py](../build.py)（Python 3 + vsce） |

---

## 3. 项目结构

```
writing-assistant/
├── .vscode/
│   ├── launch.json             # 调试配置（F5 → Extension Host）
│   └── settings.json           # 工作区推荐设置
│
├── extension/                  # 扩展本体
│   ├── package.json            # 扩展清单（名称、版本、配置声明）
│   ├── icon.png                # 扩展图标
│   ├── src/                    # 源代码
│   │   ├── extension.js        # 入口：激活/停用
│   │   ├── config.js           # 配置管理
│   │   ├── indexBuilder.js     # 术语索引构建
│   │   ├── hoverProvider.js    # 悬停提供器
│   │   ├── wordCount.js        # 字数统计
│   │   ├── commands.js         # 命令注册 + 文件保存监听
│   │   ├── markdownUtils.js    # Markdown 解析工具
│   │   └── globUtils.js        # Glob 匹配（预留）
│   └── doc/                    # 用户文档（README/CONFIG/EXAMPLES/CHANGELOG）
│
├── documents/                  # 设计 & 开发者文档
│   ├── design/
│   │   ├── index.md            # ← 本文
│   │   ├── termMgmt.md         # 术语管理模块详解
│   │   ├── wordCount.md        # 字数统计模块详解
│   │   └── termGrammar.md      # @hover 指令语法参考
│   └── dev/
│       ├── CONTRIBUTING.md     # 贡献指南
│       ├── BUILD_PUBLISH.md    # 构建与发布
│       └── TESTING.md          # 测试指南
│
├── test/                       # 测试数据
└── build.py                    # 打包脚本
```

---

## 4. 模块架构

```
                     extension.js
                     ───┬────────
           ┌────────────┼────────────┐
           ▼            ▼            ▼
      config.js    indexBuilder   commands.js
      (配置缓存)    (TermMap)    (命令 + 监听)
           │            │
           ▼            ▼
     ┌─────┴─────┐  hoverProvider.js (悬停匹配 + 渲染)
     │           │        │
  wordCount.js  markdownUtils.js (解析工具)
  (字数统计)
```

### 各模块职责一览

| 模块 | 文件 | 一句话职责 |
|------|------|-----------|
| 入口 | `extension.js` | 按序完成各模块的初始化 |
| 配置 | `config.js` | 读取 `settings.json`，缓存并提供全局访问 |
| 索引 | `indexBuilder.js` | 扫描档案文件，构建 `术语名 → 文件位置` 的内存索引 |
| 悬停 | `hoverProvider.js` | 捕获鼠标悬停，匹配术语，渲染 Markdown 卡片 |
| 命令 | `commands.js` | 注册三条命令 + 监听档案文件保存触发增量更新 |
| 字数 | `wordCount.js` | 状态栏实时显示 .txt 文件字数 |
| 解析 | `markdownUtils.js` | 纯函数：标题正则、字段解析、@hover 注释解析 |

---

## 5. 数据结构总览

### 5-1. 配置结构

```javascript
// 见 config.js loadConfig() 返回值
config = {
    encoding: 'utf8',                    // 文件编码（从 files.encoding 继承）
    previewMode: 'builtin' | 'mpe',     // Markdown 预览器
    openLocation: 'beside' | 'active',  // 编辑术语时打开位置
    term: {
        hoverFiles: string[],            // 术语档案文件路径（glob 模式）
        titleLevel: number,              // 标题级别（默认 2）
        hoverField: string,              // 主字段名（默认 "摘要"）
        aliasField: string,              // 别名字段名（默认 "别称"）
        showFields: string[],            // 卡片额外显示字段
        scanRange: number                // 匹配扫描范围（默认 5）
    },
    wordCount: {
        enabled: boolean,                // 是否启用
        excludeHeaders: boolean,         // 排除标题行
        excludeBlankLines: boolean       // 排除空行
    }
}
```

**配置优先级（从高到低）：** 术语级 `@hover` > 文件级 `@hover` > `settings.json` > 默认值

### 5-2. TermMap

```javascript
// indexBuilder.js 维护的内存索引
Map<string, { filePath: string, lineNum: number }>
// 键：术语名或别名    值：档案绝对路径 + 标题行的 0-based 行号
```

别名字段的每个分割值都会生成独立的键，与主术语指向同一 `lineNum`。

---

## 6. 模块详解

| 模块 | 文档 | 包含内容 |
|------|------|----------|
| 术语管理 | [termMgmt.md](termMgmt.md) | TermMap 结构、档案解析算法、悬停匹配算法、增量更新、限制 |
| 字数统计 | [wordCount.md](wordCount.md) | 统计规则、事件驱动更新、防抖机制、限制 |
| @hover 语法 | [termGrammar.md](termGrammar.md) | 文件级/术语级注释指令格式与键值对定义 |

---

## 7. 调试与打包

### 调试

按 `F5` 启动 **Extension Development Host**。修改代码保存后执行 `Developer: Reload Window`（`Ctrl+R`）生效。

日志输出在开发主机窗口的开发者工具（`Ctrl+Shift+I`）→ Console 面板。

### 打包

```bash
# 替换为你的本地项目路径
cd project-root
python build.py
```

生成 `.vsix` 文件，安装方式：命令面板 → `Extensions: Install from VSIX...`

详见 [build_publish.md](../dev/build_publish.md)。

---

## 8. 兼容性

- **VS Code**: ^1.70.0
- **操作系统**: Windows / macOS / Linux（仅 Windows 完成正式测试）
- **可选依赖**: Markdown Preview Enhanced（未安装时自动回退到内置预览）