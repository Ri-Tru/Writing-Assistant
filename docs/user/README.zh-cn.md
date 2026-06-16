# Writing Assistant

[English](README.md)

----------

Writing Assistant是一款专门针对技术型作者设计的VSCode扩展，提供术语管理、字数统计等一系列实用功能，帮助您更好地进行创作。

我们欢迎任何翻译者参与到翻译工作中。

如有疑问，请[提issue](https://github.com/Ri-Tru/Writing-Assistant/issues)。

## 1. 安装与设置

### 1-1. 安装

- 1. [获取最新版本的.vsix安装包](https://github.com/Ri-Tru/Writing-Assistant/Release)。
- 2. 打开VSCode，按下 `Ctrl+Shift+P`，在弹出的窗口中选择命令 `扩展：从 VSIX 安装`，选择上一步获取的安装包，点击“确定”进行安装。
- 3. 安装完成后，重启VSCode以使扩展生效，或者使用 `开发人员：重新加载窗口` 命令重新加载窗口。

### 1-2. 设置

Writing Assistant无额外依赖，若需要高级Markdown预览功能（如mermaid图表预览），可安装扩展Markdown Preview Enhanced。
使用时，配置项应用默认值足以满足简单项目需求，基本默认配置如下：

```json
{
    // 工作区通用设置
    "files.encoding": "utf8",
    // Writing Assistant 插件设置
    "writingAssistant.previewMode": "builtin",
    "writingAssistant.openLocation": "beside",
    "writingAssistant.term.hoverFiles": [
        "设定/*.md"
    ],
    "writingAssistant.term.titleLevel": 2,
    "writingAssistant.term.hoverField": "摘要",
    "writingAssistant.term.aliasField": "别称",
    "writingAssistant.wordCount.enabled": true
}
```

对应的项目结构示例如下：
```text
root
├─.vscode
│ └─settings.json  // 相关设置
├─正文             // 正文文件
│ ├─第1章.txt
│ └─...
├─设定             // 术语档案
│ ├─人物.md
│ └─...
└─...              // 其它内容
```

[详细配置说明](CONFIG.zh-cn.md)

## 2. 功能说明

### 2-1. 术语管理

术语管理可用于管理专有名词、人物角色等术语词汇，包含以下功能：

- **术语搜索**：在工作区选中一段文字并右键，点击右键菜单中的“作为术语搜索”，软件便会在术语档案中搜索此术语，并自动跳转至相应档案。
- **术语悬停**：将核心术语档案文件的相对路径添加至配置项 `writingAssistant.term.hoverFiles` 即可启用悬停。当鼠标光标停留在术语上时，便会弹出悬停卡片显示术语档案中的摘要信息，避免频繁查看术语档案。欲使用此功能，应将 `writingAssistant.term.termFiles` 设为术语档案文件的路径。

术语档案简单示例

```markdown
## 张三
- **别称**: 老张，张老三
- **摘要**: 法外狂徒
- **性格**: 大胆妄为，胆大包天
```

[查看详细配置说明](CONFIG.zh-cn.md#1.术语管理)  
[查看术语档案编写规范](CONFIG.zh-cn.md#术语档案编写规范)

### 2-2. 字数统计

将 `writingAssistant.wordCount.enable` 设为 `true` 即可启用字数统计功能。启用后，会在窗口下方栏中显示实时字数。字数统计时，空行、换行、缩进等不纳入统计，标点符号纳入统计，英文文本按单词而非字母统计。

字数统计功能默认开启，支持以下功能：

- **全文统计**：统计当前文件总字数，统计结果会随文件内容变化实时更新。
- **选区统计**：统计选中区域总字数，统计结果会随着选区变化实时更新。
- **指定内容排除**：通过设置相关配置项，可以选择将标点符号等内容排除统计。

[查看详细配置说明](CONFIG.zh-cn.md#2.字数统计)

## 3.注意事项

- 扩展仅读取工作区根目录下的文件，请确保你的项目已作为 VSCode 工作区打开。
- 标题 `## 术语名` **中英文均可使用**，预览锚点会自动处理。
- 标题 `## 术语名` **默认区分大小写**，若不希望区分大小写请调整相关配置；
- 字段名**区分大小写**，请确保与配置中的字段名完全一致。
- 若 `hoverFiles` 匹配到多个文件，所有术语会合并索引，同名术语以后加载的为准。
- 字数统计仅对 `.txt` 文件生效，且仅统计非空白字符；可通过配置调整是否排除标题行和空行。
- 如果使用 Markdown Preview Enhanced 预览模式，请确保已安装该扩展，否则会自动回退到内置预览。

## 4.常见问题

**Q1: 悬停没有反应？**  
A1: 1. 确认扩展已安装并重启 VSCode。  
    2. 确认项目根目录下存在至少一个术语档案文件。  
    3. 确认术语档案文件中存在正确的标题及对应的字段。  
    4. 打开开发者工具（帮助 → 切换开发人员工具）→ 控制台，查看错误日志。

**Q2: 别名无法触发？**  
A2: 检查别名字段名是否与配置中的 `aliasField` 一致。别名分隔符仅支持逗号、顿号、空格。

**Q3: 修改术语档案后，悬停还是旧内容？**  
A3: 扩展会在术语文件保存时自动更新索引，请确保已保存文件。若仍不生效，或修改的是配置文件，执行命令 `Writing Assistant: 重新加载术语索引` 手动刷新。

**Q4: 如何彻底禁用某个术语的悬停？**  
A4: 在该术语的二级标题下添加注释 `<!-- @hover: exclude=true -->`。

**Q5: 不同术语档案文件想显示不同字段怎么办？**  
A5: 在术语文档开头添加 `@hover` 指令进行配置，详见[配置说明](CONFIG.zh-cn.md#1.术语管理)。

**Q6: 字数统计未显示或统计不准确？**  
A6: 确认当前打开的是 `.txt` 文件，且 `wordCount.enabled` 为 `true`。统计的是非空白字符数，空格和换行不计入。

## 5.扩展局限

- 本扩展**并非针对大规模场景设计**，故未对大体积数据做优化。
- 本扩展兼容性尚未全面测试。
  
其它局限性，可在相关功能的说明中看到。

## 6.兼容性
最低要求 VSCode 1.70.0。已在 Windows + VSCode 1.121.0 上完成测试；Linux/macOS 及更早版本未经过完整测试，如遇问题欢迎反馈。

----------

*版本：V1.0，上次更新：2026-6-16*

----------

写作愉快！——理川RiTru