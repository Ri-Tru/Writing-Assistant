# 贡献指南

> 欢迎参与到 Writing Assistant 扩展的开发中来！本文档面向想要理解、修改或贡献代码的开发者。

---

## 目录

1. [项目速览](#1-项目速览)
2. [环境准备](#2-环境准备)
3. [快速开始：本地调试](#3-快速开始本地调试)
4. [项目结构](#4-项目结构)
5. [模块职责一览](#5-模块职责一览)
6. [代码规范](#6-代码规范)
7. [工作流程](#7-工作流程)
8. [文档翻译说明](#8-文档翻译说明)

---

## 1. 项目速览

Writing Assistant 是一个纯 JavaScript 实现的 VSCode 扩展，**零外部 npm 依赖**，仅依赖 VSCode 内置 API（Node.js 环境随 VSCode 提供）。

| 项目 | 值 |
|------|-----|
| 运行环境 | Node.js 12+（随 VSCode 内置） |
| 语言 | JavaScript (ES2020) |
| VSCode API | ^1.70.0 |
| 外部依赖 | 无 |
| 打包工具 | vsce（官方）或 build.py（项目定制） |
| 最低 VSCode 版本 | 1.70.0 |

---

## 2. 环境准备

### 2-1. 必需

- **[Visual Studio Code](https://code.visualstudio.com/)** — 开发与调试的主 IDE
- **Node.js** — 随 VSCode 内置，但建议本地也安装（版本 12+），以便运行打包脚本
- **Git** — 版本管理

### 2-2. 可选（打包需要）

- **Python 3** — 如果使用项目自带的 `build.py` 打包
- **@vscode/vsce** — VSCode 扩展官方打包工具，全局安装：
  ```bash
  npm install -g @vscode/vsce
  ```

### 2-3. 验证

```bash
node --version    # ≥ 12.0
npm --version
vsce --version    # 如果安装了 vsce
python --version  # 如果使用 build.py
```

---

## 3. 快速开始：本地调试

### 3-1. 克隆并打开

```bash
git clone <仓库地址>
cd Writing-Assistant
code .
```

### 3-2. 准备测试数据

在项目根目录下创建测试用的术语档案文件，例如 `术语档案.md`：

```markdown
## 张三
- **摘要**: 主角，初出茅庐的冒险者
- **别称**: 张老三，老张
- **性格**: 易冲动，易上头
- **实力**: C级
```

然后在 `.vscode/settings.json`（工作区设置）中确认或添加：

```json
{
    "writingAssistant.term.hoverFiles": ["术语档案.md"],
    "writingAssistant.term.hoverField": "摘要",
    "writingAssistant.term.aliasField": "别称"
}
```

### 3-3. 启动调试

1. 切换到 **运行和调试** 面板（`Ctrl+Shift+D`）
2. 选择启动配置 **"Run Extension"**
3. 按 `F5` 或点击绿色播放按钮

这会在一个新的 **Extension Development Host** 窗口中启动扩展。

### 3-4. 热重载

修改代码后，无需重新启动调试窗口：
- 在开发窗口中执行 `Developer: Reload Window`（`Ctrl+Shift+P` → 输入 `Reload Window`）
- 或按 `Ctrl+R`（Windows/Linux）/ `Cmd+R`（macOS）重载窗口

### 3-5. 查看日志

扩展使用 `console.log` 输出日志。在 Extension Development Host 中：
- `Ctrl+Shift+I` 打开开发者工具
- 切换到 **Console** 面板
- 日志前缀为 `[Writing Assistant]`

---

## 4. 项目结构

```
writing-assistant/
├── .vscode/                       # VSCode 调试配置
│   ├── launch.json                # 调试启动配置（"Run Extension"）
│   └── settings.json              # 工作区推荐设置
│
├── extension/                     # 扩展代码（核心）
│   ├── package.json               # 扩展清单（名称、版本、配置声明等）
│   ├── extension.js               # 入口：激活/停用
│   ├── config.js                  # 配置管理
│   ├── indexBuilder.js            # 术语索引构建
│   ├── hoverProvider.js           # 悬停提供器
│   ├── wordCount.js               # 字数统计
│   ├── commands.js                # 命令注册 & 文件保存监听
│   ├── globUtils.js               # 极简 glob 匹配工具
│   ├── markdownUtils.js           # Markdown 解析工具
│   └── icon.png                   # 扩展图标
│
├── documents/                     # 文档（用户 & 开发者）
│   ├── README/                    # 用户手册（EN + ZH）
│   ├── CONFIG/                    # 配置指南（ZH）
│   ├── EXAMPLES/                  # 使用示例（ZH）
│   ├── CHANGELOG/                 # 更新日志（ZH）
│   ├── design/                    # 技术设计文档（ZH）
│   └── dev/                       # 开发者文档 ← 你在这里
│
├── test/                          # 测试数据
│   ├── termTest.md
│   └── wordCountTest.txt
│
├── build.py                       # Python 打包脚本
├── LICENCE.txt
└── temp.md                        # 临时文件（可忽略）
```

> **重要**：VSCode 扩展要求 `package.json` 与扩展主文件在同一目录。当前布局中，`extension/` 即为扩展根目录。

---

## 5. 模块职责一览

| 模块 | 文件 | 核心职责 |
|------|------|----------|
| **入口** | `extension.js` | 激活/停用钩子，按序初始化所有模块 |
| **配置** | `config.js` | 从 VSCode settings 读取配置，提供缓存与热重载 |
| **索引** | `indexBuilder.js` | 扫描术语档案文件，构建内存中的术语映射表 (TermMap) |
| **悬停** | `hoverProvider.js` | 注册 HoverProvider，实现光标附近术语匹配与卡片渲染 |
| **命令** | `commands.js` | 注册 `showDetail` / `editTerm` / `reload` 命令；监听文件保存 |
| **字数** | `wordCount.js` | 状态栏字数统计（仅 .txt 文件） |
| **工具** | `markdownUtils.js` | 标题正则生成、字段行解析、@hover 注释解析 |
| **工具** | `globUtils.js` | 简易 glob 模式匹配（* 和 **） |

### 依赖关系

```
extension.js
  ├─ config.js           （所有模块共享）
  ├─ indexBuilder.js     （依赖 config + globUtils + markdownUtils）
  ├─ hoverProvider.js    （依赖 config + indexBuilder + globUtils）
  ├─ commands.js         （依赖 config + indexBuilder + wordCount）
  └─ wordCount.js        （依赖 config）
```

---

## 6. 代码规范

### 6-1. 命名

| 项 | 规范 | 示例 |
|----|------|------|
| 变量/函数 | 小驼峰 | `termMap`, `buildIndex()` |
| 常量 | 大写+下划线 | `DEFAULT_SCAN_RANGE` |
| 类 | 大驼峰 | `TermInfo`（仅 interface 风格对象） |
| 文件 | 小驼峰 | `hoverProvider.js` |
| 文件名（文档） | 大写为主 | `README.md`, `CONFIG.zh-cn.md` |

### 6-2. 注释风格

每个文件头部必须有 JSDoc 风格的模块注释：

```javascript
/**
 * 模块简短说明
 * V0.1 YYYY-MM-DD
 * 
 * [详细描述]
 * 
 * 依赖：
 * - xxx.js          -> 依赖说明
 * 
 * 导出：
 * - functionName()  -> 说明
 */
```

关键函数必须有 JSDoc：

```javascript
/**
 * 构建或重建术语索引
 * @param {boolean} showMessage - 是否显示完成提示
 * @returns {Promise<number>} TermMap 中的条目总数
 */
```

### 6-3. 代码风格

- 使用 `const` 和 `let`，不使用 `var`
- 字符串统一使用单引号（`'...'`）或模板字符串
- 使用 `===` 而非 `==`
- 缩进 4 空格（与项目现有风格保持一致）
- 导出的模块函数放在文件底部统一 `module.exports = { ... }`

### 6-4. 错误处理

- 文件操作类错误使用 `try/catch` 或 `existsSync` 预检
- API 调用失败（如 MPE 预览回退）使用 `.then(undefined, () => fallback)`
- 不要吞掉异常：至少 `console.error` 记录

---

## 7. 工作流程

### 7-1. 功能开发

1. 在 `dev` 分支或 fork 仓库中开发
2. 在 `test/` 下准备测试数据
3. 按 F5 启动调试，验证功能
4. 更新相关文档（用户手册 + 设计文档）
5. 更新 `CHANGELOG`
6. 提交 PR

### 7-2. 提交信息规范

建议采用 [Conventional Commits](https://www.conventionalcommits.org/) 风格：

```
feat: 添加新功能描述
fix: 修复问题描述
docs: 更新文档
refactor: 重构代码
chore: 构建/工具变动
```

### 7-3. PR 检查清单

- [ ] 代码在 Extension Development Host 中通过基本测试
- [ ] 无 `console.log` 调试残留（功能代码中）
- [ ] 用户相关变更已更新 README（中/英文）
- [ ] 新增配置项已更新 CONFIG 文档和 `package.json` 中的 `contributes.configuration`
- [ ] 新增模块/接口已更新设计文档
- [ ] CHANGELOG 已添加对应条目

### 7-4. 版本号规则

遵循 [SemVer](https://semver.org/)：
- **主版本号**：不兼容的 API 变更
- **次版本号**：向下兼容的新功能
- **修订号**：向下兼容的问题修复

---

## 8. 文档翻译说明

目前项目文档以中文为主，欢迎贡献其他语言的翻译。

### 翻译工作流

1. 在原始文档同级目录下创建新文件，命名为 `<文件名>.<语言代码>.md`
   - 例如：`README.md` → `README.en.md`、`README.ja.md`
2. 翻译时保持 Markdown 结构不变（标题层级、代码块、链接）
3. 内部链接指向对应语言版本（如果有）
4. 在 PR 中标注翻译的源文档版本

### 当前翻译状态

| 文档 | 中文 | 英文 |
|------|------|------|
| README/用户手册 | ✅ | ✅ |
| CONFIG/配置指南 | ✅ | ⬜ 待翻译 |
| EXAMPLES/示例 | ✅ | ⬜ 待翻译 |
| CHANGELOG/更新日志 | ✅ | ⬜ 待翻译 |
| design/ 设计文档 | ✅ | ⬜ 待翻译 |
| dev/ 开发者文档 | ✅ | ⬜ 待翻译 |

---

*本文档版本：1.0，最后更新：2026-06-11*
