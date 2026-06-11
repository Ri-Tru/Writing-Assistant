# 构建与发布指南

> 本文档说明如何将 Writing Assistant 扩展打包为 `.vsix` 安装包，以及如何发布到 VSCode Marketplace。

---

## 目录

1. [构建方式概览](#1-构建方式概览)
2. [方式一：使用 vsce（官方工具）](#2-方式一使用-vsce官方工具)
3. [方式二：使用 build.py（项目定制脚本）](#3-方式二使用-buildpy项目定制脚本)
4. [构建产物说明](#4-构建产物说明)
5. [安装 .vsix](#5-安装-vsix)
6. [发布到 Marketplace（可选）](#6-发布到-marketplace可选)
7. [常见构建问题](#7-常见构建问题)

---

## 1. 构建方式概览

Writing Assistant 提供两种构建方式：

| 方式 | 工具 | 适用场景 |
|------|------|----------|
| **vsce** | npm 包 `@vscode/vsce` | 标准构建、发布到 Marketplace |
| **build.py** | Python 3 脚本 | 项目定制打包（自动处理文档复制与清理） |

两种方式最终都生成 `.vsix` 文件。推荐使用 `build.py` 进行日常构建，它自动处理了项目文档目录到扩展根目录的复制逻辑。

### 文件依赖关系

构建时，`extension/` 目录下需要包含以下文件才能成功打包：

| 必需文件 | 说明 |
|----------|------|
| `package.json` | 扩展清单（已有） |
| `extension.js` | 扩展入口（已有） |
| `*.js`（所有模块） | 所有 JS 源文件（已有） |
| `icon.png` | 扩展图标（已有） |

| 构建时复制 | 来源 | 目标（打包前） |
|------------|------|----------------|
| README（多语言） | `documents/README/` | `extension/` 根目录 |
| CHANGELOG（多语言） | `documents/CHANGELOG/` | `extension/` 根目录 |
| CONFIG 目录 | `documents/CONFIG/` | `extension/CONFIG/` |
| EXAMPLES 目录 | `documents/EXAMPLES/` | `extension/EXAMPLES/` |

> vsce 要求 `README.md` 和 `CHANGELOG.md` 与 `package.json` 同级。`build.py` 就是为此而设计。

---

## 2. 方式一：使用 vsce（官方工具）

### 2-1. 安装 vsce

```bash
npm install -g @vscode/vsce
```

### 2-2. 手动准备文档

由于 `package.json` 在 `extension/` 下，而 README/CHANGELOG 在 `documents/` 下，打包前需要手动复制：

```bash
# 从项目根目录执行

# 复制 README
copy documents\README\README.md extension\README.md
copy documents\README\README.zh-cn.md extension\README.zh-cn.md

# 复制 CHANGELOG
copy documents\CHANGELOG\CHANGELOG.zh-cn.md extension\CHANGELOG.zh-cn.md

# 复制 CONFIG 目录
xcopy documents\CONFIG extension\CONFIG /E /I

# 复制 EXAMPLES 目录
xcopy documents\EXAMPLES extension\EXAMPLES /E /I
```

> **注意**：vsce 在打包时会检查 `README.md` 是否存在。如果缺少，打包会失败。

### 2-3. 执行打包

```bash
cd extension
vsce package
```

### 2-4. 清理临时文件（可选）

```bash
# 清理复制到 extension 下的临时文档
del extension\README.md
del extension\README.zh-cn.md
del extension\CHANGELOG.zh-cn.md
rmdir /S /Q extension\CONFIG
rmdir /S /Q extension\EXAMPLES
```

---

## 3. 方式二：使用 build.py（项目定制脚本）

项目根目录下的 `build.py` 封装了整个流程。

### 3-1. 前置条件

- Python 3（已添加到环境变量）
- `vsce`（已全局安装并添加到环境变量，见 [2-1](#2-1-安装-vsce)）

### 3-2. 执行打包

在项目根目录下运行：

```bash
cd D:\project\Software\Writing Assistant
python build.py
```

### 3-3. build.py 工作流程

该脚本按以下顺序执行：

```
1. 复制文档
   ├── documents/README/*.md          → extension/
   ├── documents/CHANGELOG/*.md       → extension/
   ├── documents/CONFIG/              → extension/CONFIG/
   └── documents/EXAMPLES/            → extension/EXAMPLES/

2. 执行 vsce package
   工作目录：extension/
   命令：vsce.cmd package

3. 清理临时文件
   ├── 删除 extension/ 下刚复制的文档文件
   └── 将生成的 .vsix 从 extension/ 移动到项目根目录
```

### 3-4. 构建成功标志

构建成功后，会在 **项目根目录** 生成 `writing-assistant-<版本号>.vsix` 文件，并输出：

```
打包成功！生成的 .vsix 文件位于 D:\project\Software\Writing Assistant\writing-assistant-0.0.5.vsix
```

### 3-5. build.py 注意事项

- 脚本使用 `vsce.cmd`（Windows 的 CMD 版本）。在 Linux/macOS 上需将脚本中的 `vsce.cmd` 改为 `vsce`。
- 脚本中的 `CONFIG_FOLDER` 和 `EXAMPLES_FOLDER` 指向 `PROJECT_ROOT` 下的同名文件夹，但目前这些文件夹在 `documents/` 下。如果打包失败，请检查路径配置。
- Python 的 `shutil.copytree` 如果目标文件夹已存在会报错，但脚本在每次打包时都会覆盖。

---

## 4. 构建产物说明

成功构建后会生成一个 `.vsix` 文件，命名格式为：`<扩展名>-<版本号>.vsix`。

```
writing-assistant-0.0.5.vsix
```

该文件是一个 ZIP 压缩包，内部结构如下：

```
writing-assistant-0.0.5.vsix
├── extension.vsixmanifest          # 扩展元数据
├── [Content_Types].xml             # 内容类型定义
└── extension/                      # 扩展本体
    ├── package.json
    ├── extension.js
    ├── config.js
    ├── indexBuilder.js
    ├── hoverProvider.js
    ├── wordCount.js
    ├── commands.js
    ├── globUtils.js
    ├── markdownUtils.js
    ├── icon.png
    ├── README.md
    ├── README.zh-cn.md
    ├── CHANGELOG.zh-cn.md
    ├── CONFIG/
    └── EXAMPLES/
```

---

## 5. 安装 .vsix

### 5-1. 通过 VSCode UI

1. 打开 VSCode
2. 按 `Ctrl+Shift+P` 打开命令面板
3. 输入并选择 **Extensions: Install from VSIX...**
4. 在弹出的文件选择器中找到并选择 `.vsix` 文件
5. 点击确定后扩展会自动安装

### 5-2. 通过命令行

```bash
code --install-extension writing-assistant-0.0.5.vsix
```

### 5-3. 验证安装

安装后在 VSCode 扩展面板中搜索 `Writing Assistant` 确认已启用。
打开一个包含术语档案的工作区，将鼠标悬停在术语上验证功能。

---

## 6. 发布到 Marketplace（可选）

如果需要将扩展发布到 [VSCode Marketplace](https://marketplace.visualstudio.com/) 供所有人安装：

### 6-1. 前置条件

1. 一个 [Azure DevOps 组织](https://dev.azure.com/) 账号
2. 创建 [Personal Access Token (PAT)](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#get-a-personal-access-token)
3. 使用 PAT 创建一个 VSCE 发布者：

```bash
vsce create-publisher <your-publisher-name>
```

### 6-2. 发布

```bash
vsce publish
```

这会自动执行打包并发布到 Marketplace。

### 6-3. 更新版本号

发布前需更新 `extension/package.json` 中的 `version` 字段。vsce 也支持：

```bash
vsce publish patch   # 0.0.1 → 0.0.2
vsce publish minor   # 0.0.1 → 0.1.0
vsce publish major   # 0.0.1 → 1.0.0
```

### 6-4. 取消发布

```bash
vsce unpublish <publisher>.<extension-name>
```

---

## 7. 常见构建问题

### Q1: `'vsce' 不是内部或外部命令`

vsce 未安装或未添加到 PATH。

**解决**：
```bash
npm install -g @vscode/vsce
```

### Q2: `Missing 'README.md' in the extension`

`extension/` 目录下缺少 README.md。执行打包前需从 `documents/README/` 复制，或使用 `build.py`。

### Q3: `build.py 报错 "目标文件夹已存在"`

这通常是 `shutil.copytree` 的行为（Python < 3.8 版本）。在复制前删除目标文件夹，或升级 Python 至 3.8+（此时 `copytree` 的 `dirs_exist_ok` 参数默认为 True）。

### Q4: 打包后功能异常

检查打包后的 `.vsix` 内容是否完整（可重命名为 `.zip` 查看）。常见原因：
- 文档目录复制不完整
- `package.json` 中的 `main` 字段指向错误的路径
- 文件编码不是 UTF-8（尤其是中文内容）

---

*本文档版本：1.0，最后更新：2026-06-11*
