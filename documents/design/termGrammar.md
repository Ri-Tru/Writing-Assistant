# @hover 指令语法参考

*版本：V1.0，上次更新：2026-06-11*

---

## 1. 概述

`@hover` 指令是嵌入在术语档案 Markdown 文件中的注释，用于**覆盖**当前文件或某个术语的悬停配置，而不需要修改 VS Code 的 `settings.json`。

所有 `@hover` 指令都以 HTML 注释形式编写，句柄为 `@hover:`。

```
<!-- @hover: key1=value1; key2="value2" -->
```

**适用位置：**
- **文件开头** → 文件级指令，作用于整个档案文件
- **术语标题之后、字段行之前** → 术语级指令，作用于单个术语

---

## 2. 指令格式

### 2-1. 基本语法

```
<!-- @hover: 键1=值1; 键2=值2; ... -->
```

| 要素 | 规则 |
|------|------|
| 定界符 | `<!--` 开头，`-->` 结尾，`@hover:` 紧随其后 |
| 键值对分隔 | 分号 `;` |
| 键值分隔 | 等号 `=` |
| 值引号 | 可选。可加双引号 `"value"` 或单引号 `'value'`，不加也行 |
| 空白 | 键和值前后的空格会被 trim；分号前后的空格也会被 trim |

### 2-2. 文件级 vs 术语级

| | 文件级 | 术语级 |
|--|--------|--------|
| 位置 | 文件开头（第一行起连续放置） | 术语标题 `## 术语名` 的下一行起 |
| 键前缀 | 可选加 `file.` 前缀 | 不加 `file.` 前缀 |
| 作用域 | 整个文件的所有术语 | 仅当前术语 |
| 示例 | `<!-- @hover: file.titleLevel=3 -->` | `<!-- @hover: exclude=true -->` |

文件级指令使用 `file.` 前缀表示"该键是文件级配置"，不加 `file.` 前缀的指令在文件级位置会被忽略。

---

## 3. 支持的指令键

### 3-1. 完整键表

| 指令键 | 文件级 | 术语级 | 类型 | 作用 | 示例 |
|--------|--------|--------|------|------|------|
| `titleLevel` | ✅ | ❌ | `number` | 覆盖当前文件的标题级别 | `file.titleLevel=3` |
| `aliasField` | ✅ | ❌ | `string` | 覆盖当前文件的别名字段名 | `file.aliasField=其他称谓` |
| `hoverField` | ✅ | ✅ | `string` | 覆盖悬停卡片主字段名 | `hoverField=背景` |
| `showFields` | ✅ | ✅ | `string` | 覆盖额外显示字段（逗号分隔） | `showFields=技能,装备` |
| `exclude` | ❌ | ✅ | `"true"` | 完全排除该术语，不触发悬停 | `exclude=true` |

> `titleLevel` 和 `aliasField` 仅支持文件级指令，因为它们的值需要在**索引构建阶段**（`parseSingleFileAndUpdateIndex`）就被确定，而术语级指令在**悬停触发阶段**（`getTermInfo`）才被解析。

### 3-2. showFields 值格式

当值需要传递一个列表时，使用逗号分隔：

```
<!-- @hover: showFields=性格,技能,口头禅 -->
```

解析结果：`["性格", "技能", "口头禅"]`

逗号前后的空格会被自动 trim。目前仅支持逗号作为列表分隔符（顿号、空格等不会被识别为列表分隔符）。

### 3-3. 多条指令

多个 `@hover` 指令可以连续放置，后定义的会覆盖先定义的：

```markdown
## 李四
<!-- @hover: hoverField=简介 -->
<!-- @hover: showFields=技能,装备 -->
- **简介**: 主角的挚友
- **别称**: 小李
- **技能**: 剑术
- **装备**: 铁剑
```

等同于单条合并：

```markdown
<!-- @hover: hoverField=简介; showFields=技能,装备 -->
```

---

## 4. 配置优先级链

完整的配置覆盖顺序（从高到低）：

```
术语级 @hover 指令      ← 最高优先级
  │
  ▼
文件级 @hover 指令
  │
  ▼
fileRules（目前未实现）
  │
  ▼
settings.json 全局配置（writingAssistant.*）
  │
  ▼
默认值                 ← 最低优先级
```

当前版本中，文件规则（`fileRules`）尚未实现，因此仅有三层：术语级 > 文件级 > 全局配置 > 默认值。

---

## 5. 错误处理

| 场景 | 行为 |
|------|------|
| 格式错误（如 `<!-- @hover wrong -->` 缺少冒号） | `parseHoverComment()` 返回 `null`，忽略该行 |
| 键名拼写错误（如 `hoveField`） | 不报错，该键被加入 overrides 对象但不被任何消费代码识别，相当于无效果 |
| 值类型错误（如 `exclude=TRUE`） | `exclude` 检查严格为字符串 `"true"`，大小写不敏感的处理未实现，`TRUE` 不会触发排除 |
| 术语级使用了 `file.` 前缀 | `parseHoverComment(line, isFileLevel=false)` 返回 `null`，指令被忽略 |
| 文件级指令未使用 `file.` 前缀 | 指令会被 `parseHoverComment(line, true)` 正常解析并合并到当前配置 |
| 超出支持的键（如 `hoverColor=red`） | 不报错，overrides 对象包含该键但无消费方，静默忽略 |
| 多条指令中同键冲突 | 后定义的覆盖先定义的，不报错 |

---

## 6. 完整示例

### 6-1. 文件级 + 术语级混合

```markdown
<!-- @hover: file.titleLevel=3 -->
<!-- @hover: file.aliasField=其他称呼 -->

### 青云门
- **摘要**: 江湖第一大宗门
- **其他称呼**: 青门，云门
- **掌门**: 清虚道人

### 天机阁
<!-- @hover: hoverField=简介; showFields=阁主,镇派之宝 -->
- **简介**: 以机关术闻名
- **其他称呼**: 天机楼
- **阁主**: 墨玄
- **镇派之宝**: 天机罗盘
```

解析效果：
- 两个术语都按三级标题（`###`）解析
- 别名字段是"其他称呼"而非全局的"别称"
- "天机阁"的悬停卡片显示"简介"作为主字段，额外显示"阁主"和"镇派之宝"
- "青云门"的悬停卡片使用全局或文件级其他配置

### 6-2. 排除某个术语

```markdown
## 保密角色
<!-- @hover: exclude=true -->
- **摘要**: 这个术语不会触发悬停
- **别称**: 隐藏人
```

"保密角色"及其别名"隐藏人"都不会被加入 TermMap，悬停时无反应。

### 6-3. 同键覆盖

```markdown
## 王五
<!-- @hover: showFields=年龄 -->
<!-- @hover: showFields=年龄,职业 -->
- **摘要**: 普通路人
- **年龄**: 25
- **职业**: 铁匠
```

第二条指令覆盖第一条，最终 `showFields = ["年龄", "职业"]`。

---

## 7. 实现参考

`@hover` 指令的解析实现在 `markdownUtils.js` 的 `parseHoverComment()` 函数中：

```javascript
function parseHoverComment(termLine, isFileLevel = false) {
    const match = termLine.match(/^<!--\s*@hover:\s*(.+?)\s*-->$/);
    if (!match) return null;

    const overrides = {};
    const directiveStr = match[1];
    const pairs = directiveStr.split(/\s*;/);

    for (const pair of pairs) {
        const eqIndex = pair.indexOf('=');
        if (eqIndex > 0) {
            let key = pair.slice(0, eqIndex).trim();
            let value = pair.slice(eqIndex + 1).trim();

            if (key.startsWith('file.')) {
                if (isFileLevel) key = key.slice(5);
                else return null;
            }

            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            overrides[key] = value;
        }
    }

    return overrides;
}
```

指令的消费方分别在：
- **索引构建**：`indexBuilder.js` 的 `parseSingleFileAndUpdateIndex()` — 仅消费文件级指令的 `titleLevel` 和 `aliasField`
- **悬停触发**：`markdownUtils.js` 的 `getTermInfo()` — 消费文件级和术语级指令的 `hoverField`、`showFields`、`exclude`
