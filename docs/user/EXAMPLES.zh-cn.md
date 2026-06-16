# 文件编写规范与示例

## 术语档案文件格式

### 基础用法

- 使用 Markdown 文件（`.md`）存储术语。
- 每个术语以二级标题（`## 术语名`）开始，标题级别可通过 `titleLevel` 配置调整（参见[高级用法](#高级用法)）。
- 字段格式：`- **字段名**: 内容`（冒号支持全角 `：` 或半角 `:`）。
- 别名字段的值会自动按 `，` `、` `,` ` `（空格）分割，每个别名都会独立触发悬停。例如以下示例中，“张老三”和“老张”均可触发张三的悬停卡片。

示例
```markdown
## 张三
- **摘要**: 主角，初出茅庐的冒险者
- **别称**: 张老三，老张
- **性格**: 易冲动，易上头
- **实力**: C级
```

### 高级用法

- 术语级注释（覆盖规则）
  在标题行下方任意位置添加 `<!--@hover:key1=value1;key2=value2...-->` 注释，可覆盖全局配置和文件规则。

指令键说明
  
  |指令键|作用|示例|
  |----|----|----|
  |`hoverField`|覆盖该术语的主字段|`<!--@hover:hoverField=自定义摘要-->`|
  |`aliasField`|覆盖该术语的别名字段|`<!--@hover:aliasField=其他称谓-->`|
  |`showFields`|覆盖额外字段列表（逗号分隔）|`<!--@hover:showFields=性格,任务,口头禅-->`|
  |`exclude`|设为 "true" 彻底排除该术语|`<!--@hover:exclude=true-->`|
  
  多条注释可同时存在，后定义的会覆盖先定义的。

注释示例
```markdown
## 李四
<!--@hover:hoverField=简介-->
<!--@hover:showFields=技能,装备-->
- **简介**: 主角的挚友
- **别称**: 小李
- **技能**: 剑术
- **装备**: 铁剑
```

## .vscode/settings.json配置示例

```json
{
    // Writing Assistant 通用设置
    "writingAssistant.mainText":["正文/*.txt"],
    "writingAssistant.previewMode": "mpe",
    "writingAssistant.openLocation": "beside",
    // 术语管理设置
    "writingAssistant.term.termFiles": ["术语档案/*.md"],
    "writingAssistant.term.hoverFiles": ["术语档案/核心术语.md"],
    "writingAssistant.term.titleLevel": 2,
    "writingAssistant.term.hoverField": "摘要",
    "writingAssistant.term.aliasField": "别称",
    "writingAssistant.term.showFields": ["性格", "实力"],
    "writingAssistant.term.scanRange": 5,
    "writingAssistant.term.fileRules": [
        {
            "pattern": "术语档案/世界观.md",
            "titleLevel": 3,
            "showFields": ["分类", "风险等级"]
        }
    ],
    // 字数统计设置
    "writingAssistant.wordCount.enabled": true,
    "writingAssistant.wordCount.excludeHeaders": true,
    "writingAssistant.wordCount.excludeBlankLines": true
}
```

### 文件规则匹配
若您有多个术语档案，并希望不同档案使用不同的显示字段，可参照如下示例设置：
```json
"writingAssistant.fileRules": [
    {
        "pattern": "人物/*.md",
        "titleLevel": 3,
        "showFields": ["年龄", "职业"]
    },
    {
        "pattern": "地点/*.md",
        "hoverField": "概述",
        "showFields": ["所属国家", "气候"]
    }
]
```
这样，匹配人物索引是将匹配三级标题，悬停触发时，会额外显示“年龄”和“职业”；悬停在“地点”类术语上时，则显示“概述”（作为主要悬停字段）,“所属国家”和“气候”（作为次要悬停字段）。

----------

*版本：V1.0，上次更新：2026-6-11*