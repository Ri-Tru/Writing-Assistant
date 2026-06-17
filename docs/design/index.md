# Writing Assistant — 技术设计文档

## 1. 概述

Writing Assistant 是一个纯 JavaScript 实现的 VS Code 扩展，零外部 npm 依赖。

**核心能力：**
- **术语悬停** — 从 Markdown 档案文件中读取术语定义，鼠标悬停时弹出卡片
- **字数统计** — 在状态栏实时显示当前文档的非空白字符数
- **术语搜索** — 右键选中文本作为术语搜索，跳转到档案文件中对应的定义

扩展运行在 Extension Host (Node.js) 环境中，通过 VS Code API 与编辑器交互。

---

## 2. 技术栈

| 项目 | 说明 |
|------|------|
| 运行环境 | Node.js 12+（随 VS Code 内置） |
| 语言 | JavaScript (ES2020) |
| VS Code API | ^1.70.0 |
| 外部依赖 | 无 |
| 打包工具 | vsce |

---

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
│   ├── commands.js                 # 命令注册（统一切入点）
│   ├── listeners.js                # 监听器注册（统一切入点）
│   ├── config.js                   # 获取项目配置
│   ├── hoverProvider.js            # 悬停提供器
│   ├── termMgmt.js                 # 术语管理业务逻辑（查看/编辑/搜索）
│   ├── indexBuilder.js             # 创建悬停索引
│   ├── markdownUtils.js            # Markdown解析工具
│   ├── globUtils.js                # glob通配符路径处理
│   ├── wordCount.js                # 字数统计模块
│   ├── logger.js                   # 日志管理器
│   ├── localize.js                 # 语言适配（vscode.l10n 封装）
│   └── i18n/                       # 代码内部多语言包（vscode-l10n 专用）
│       ├── bundle.l10n.json        # 默认语言（英文 / 后备语言）
│       └── bundle.l10n.zh-cn.json  # 简体中文覆盖
│
├── docs/                           # 开发者内部文档（不打包进 .vsix）
│   ├── design/                     # 架构设计、流程图
│   │   ├── index.md
│   │   ├── termGrammar.md
│   │   ├── termMgmt.md
│   │   └── wordCount.md
│   ├── dev/                        # 贡献指南、发布流程、测试指南
│   │   ├── CONTRIBUTING.md
│   │   ├── BUILD_PUBLISH.md
│   │   └── TESTING.md
│   └── user/                       # 用户手册
│       ├── README.zh-cn.md
│       ├── CONFIG.md
│       ├── CONFIG.zh-cn.md
│       ├── EXAMPLES.md
│       └── EXAMPLES.zh-cn.md
│
├── imgs/                           # 静态资源（截图、图标等）
│   └── icon.png                    # 扩展图标（package.json 中引用）
│
├── test/                           # 测试数据（不打包）
│   ├── termTest.md                 # 术语档案测试文件
│   ├── wordCountTest.txt           # 字数统计测试文件
│   └── .vscode/settings.json       # 测试用工作区设置
│
├── package.json                    # 扩展清单
├── package.nls.json                # 静态清单英文（命令标题/菜单/设置描述）
├── package.nls.zh-cn.json          # 静态清单简体中文
│
├── README.md                       # 用户文档
├── CHANGELOG.md                    # 更新日志
│
├── .vscodeignore                   # 打包忽略规则
├── .gitignore                      # Git 忽略规则
└── LICENCE.txt                     # 许可证
```

---

## 4. 模块架构
```
Layer 0 (最底层，无内部依赖)：
  logger.js          ← 仅依赖 console
  globUtils.js       ← 纯函数，无依赖

Layer 1 (依赖 vscode 或 Layer 0)：
  localize.js        ← 依赖 vscode.l10n
  config.js          ← 依赖 vscode.workspace

Layer 2 (依赖 Layer 0~1)：
  markdownUtils.js   ← 依赖 vscode, config, logger
  wordCount.js       ← 依赖 vscode, config

Layer 3 (核心数据层)：
  indexBuilder.js    ← 依赖 vscode, fs, path, config, logger, localize, globUtils, markdownUtils

Layer 4 (业务逻辑层)：
  hoverProvider.js   ← 依赖 vscode, config, logger, indexBuilder, globUtils, markdownUtils
  termMgmt.js        ← 依赖 vscode, fs, config, localize, logger

Layer 5 (注册管理层)：
  commands.js        ← 依赖 vscode, config, termMgmt, indexBuilder, wordCount
  listeners.js       ← 依赖 vscode, indexBuilder, hoverProvider, wordCount

Layer 6 (入口层)：
  extension.js       ← 依赖除本层外的所有模块
```

### 各模块职责一览

| 模块 | 文件 | 一句话职责 |
|------|------|-----------|
| 入口 | `extension.js` | 按序完成各模块的初始化 |
| 配置 | `config.js` | 读取 `settings.json`，缓存并提供全局访问 |
| 命令注册 | `commands.js` | 注册所有 VS Code 命令 |
| 监听器注册 | `listeners.js` | 注册所有事件监听器（保存、悬停、切换、选区变更等） |
| 索引 | `indexBuilder.js` | 扫描档案文件，构建 `术语名 → 文件位置` 的内存索引 |
| 悬停 | `hoverProvider.js` | 捕获鼠标悬停，匹配术语，渲染 Markdown 卡片 |
| 术语业务 | `termMgmt.js` | 实现查看完整设定、编辑术语设定、搜索术语的业务逻辑 |
| 字数 | `wordCount.js` | 状态栏实时显示 .txt 文件字数 |
| 解析 | `markdownUtils.js` | 纯函数：标题正则、字段解析、@hover 注释解析、getTermInfo |
| 日志 | `logger.js` | 分级日志输出，支持调试/信息/警告/错误级别 |
| 适配 | `localize.js` | vscode.l10n 封装，实现多语言翻译 |
| Glob | `globUtils.js` | 简单 Glob 模式匹配（支持 `*` 和 `**`） |

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

---

## 6. 模块详解

| 模块 | 文档 | 包含内容 |
|------|------|----------|
| 术语管理 | [termMgmt.md](termMgmt.md) | TermMap 结构、档案解析算法、悬停匹配算法、增量更新、限制 |
| 字数统计 | [wordCount.md](wordCount.md) | 统计规则、事件驱动更新、防抖机制、限制 |

---

## 7. 调试与打包

### 调试

按 `F5` 启动 **Extension Development Host**。修改代码保存后执行 `Developer: Reload Window`（`Ctrl+R`）生效。

日志输出在开发主机窗口的开发者工具（`Ctrl+Shift+I`）→ Console 面板。

### 打包

```bash
# 替换为你的本地项目路径
cd project-root
vsce package
```

生成 `.vsix` 文件，安装方式：命令面板 → `Extensions: Install from VSIX...`

详见 [build_publish.md](../dev/build_publish.md)。

---

## 8. 兼容性

- **VS Code**: ^1.70.0
- **操作系统**: Windows / macOS / Linux（仅 Windows 完成正式测试）
- **可选依赖**: Markdown Preview Enhanced（未安装时自动回退到内置预览）