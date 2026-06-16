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
| 打包工具 | [build.py](../../build.py)（Python 3 + vsce） |

---

## 3. 项目结构

```
Writing-Assistant/                  # 项目根目录（也是扩展根目录）
│
├── .vscode/                        # VSCode 工作区调试配置
│   ├── launch.json                 # 调试启动配置（直接 F5）
│   └── settings.json               # 推荐的工作区设置（可选）
│
├── src/                            # 核心源代码（全部在此）
│   ├── extension.js                # 扩展入口
│   ├── commands.js                 # 命令具体实现
│   ├── config.js                   # 获取项目配置
│   ├── hoverProvider.js            # 悬停提供器
│   ├── indexBuilder.js             # 创建悬停索引
│   ├── markdownUtils.js            # Markdown解析器
│   ├── globUtil.js                 # glob通配符路径处理
│   ├── wordCount.js                # 字数统计模块
│   └── i18n/                       # 代码内部多语言包（vscode-nls 专用）
│       ├── bundle.l10n.json        # 默认语言（英文 / 后备语言）
│       └── bundle.l10n.zh-cn.json  # 简体中文覆盖
│
├── docs/                           # 开发者内部文档（不打包进 .vsix）
│   ├── design/                     # 架构设计、流程图
│   │   └── architecture.md
│   └── dev/                        # 贡献指南、发布流程、测试指南
│       ├── CONTRIBUTING.md
│       ├── BUILD_PUBLISH.md
│       └── TESTING.md
│
├── test/                           # 测试代码与测试数据（不打包）
│   ├── runTest.js
│   ├── suite/
│   │   └── extension.test.js
│   └── fixtures/                   # 测试用的模拟文件
│
├── images/                         # 静态资源（截图、图标等）
│   ├── icon.png                    # 扩展图标（package.json 中引用）
│   └── screenshot-demo.png         # README 中引用的演示截图
│
├── package.json                    # 扩展清单
├── package.nls.json                # 静态清单英文（命令标题/菜单/设置描述）
├── package.nls.zh-cn.json          # 态清单简体中文
│
├── README.md                       # 用户文档
├── CHANGELOG.md                    # 更新日志（可选，建议单语言）
│
├── .vscodeignore                   # 打包忽略规则
├── .gitignore                      # Git 忽略规则
└── LICENSE                         # 许可证
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