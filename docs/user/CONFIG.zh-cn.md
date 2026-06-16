# 配置说明

所有配置项均在 VS Code 的 `.vscode/settings.json` 中设置（全局或工作区设置均可）。  
**优先级**：术语级注释 > 文件规则 > 全局配置 > 默认配置。

## 配置项详情
| 配置项 | 说明 | 缺省值 |
|------|------|------|
| `writingSssistant.mainText` | 指定正文文件 | `["正文/*.md"]` |
| `writingAssistant.previewMode` | 跳转Markdown预览使用的预览器。`builtin`：VS Code内置预览器；`mpe`：Markdown Preview Enhanced扩展 | `"builtin"` |
| `writingAssistant.openLocation` | 术语编辑跳转打开视图。`beside`：在侧边栏打开；`active`：在当前组打开 | `"beside"` |
| `writingAssistant.term.termFiles` | 术语档案文件路径列表 | `["设定.md"]` |
| `writingAssistant.term.hoverFiles` | 启用悬停的术语档案文件路径列表 | `[]` |
| `writingAssistant.term.titleLevel` | 术语标题的 Markdown 级别 | `2` |
| `writingAssistant.term.hoverField` | 悬停显示的主字段名 | `"摘要"` |
| `writingAssistant.term.aliasField` | 别名字段名，值支持`，` `、` `,` ` `（空格）分割 | `"别称"` |
| `writingAssistant.term.showFields` | 额外显示的字段列表 | `[]` |
| `writingAssistant.term.scanRange` | 术语匹配时向左右两侧扫描的最大字符数。设小可避免误触，设大可匹配更长的术语。 | `5` |
| `writingAssistant.wordCount.enabled` | 是否启用字数统计 | `true` |
| `writingAssistant.wordCount.excludeHeaders` | 字数统计是否排除标题行（以 `#` 开头的行） | `true` |
| `writingAssistant.wordCount.excludeBlankLines` | 字数统计是否排除空行 | `true` |

所有路径配置均支持glob通配符

完整配置示例请参考 [EXAMPLES.zh-cn.md](EXAMPLES.zh-cn.md) 中的配置示例。

----------

*版本：V1.0，上次更新：2026-6-16*