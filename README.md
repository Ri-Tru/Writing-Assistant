# Writing Assistant

**[中文版本](docs/user/README.zh-cn.md)**

---

Writing Assistant is a VSCode extension designed specifically for technical writers, providing a series of practical features such as term management and word count to help you write more effectively.

We welcome any translator to participate in the translation work.

If any questions, please [open an issue](https://github.com/Ri-Tru/Writing-Assistant/issues).

## 1. Installation & Setup

### 1-1. Installation

- 1. [Get the latest .vsix package](https://github.com/Ri-Tru/Writing-Assistant/Release).
- 2. Open VSCode, press `Ctrl+Shift+P`, choose the command `Extensions: Install from VSIX`, select the package downloaded in the previous step, and click “OK” to install.
- 3. After installation, restart VSCode to activate the extension, or use the command `Developer: Reload Window`.

### 1-2. Setup

Writing Assistant has no extra dependencies. If you need advanced Markdown preview functions (like mermaid chart preview), you can install extension Markdown Preview Enhanced.  
For use, the default configuration values are sufficient for simple projects.

[Detailed Configuration Guide](docs/user/CONFIG.zh-cn.md)

## 2. Features

### 2-1. Term Management

Term management helps manage proper nouns, character names, etc., and includes the following features:

- **Term Search**: Select a piece of text in the workspace, right‑click, and choose “Search as Term” from the context menu. The extension will search for that term in the term definition files and automatically jump to the corresponding entry.
- **Term Hover**: Add the relative path(s) of your core term definition file(s) to the `writingAssistant.term.hoverFiles` setting to enable hover. When the mouse lineNum stays on a term, a hover card will pop up showing the summary information from the term definition file, saving you from frequently looking up the term file. To use this feature, set `writingAssistant.term.termFiles` to the path(s) of your term definition files.

Simple example of a term definition file:

```markdown
## Zhang San
- **Alias**: Lao Zhang, Zhang San'er
- **Summary**: Outlaw
- **Personality**: Reckless, audacious
```

[View Detailed Configuration](docs/user/CONFIG.md##1.Term Management)
[View Term Definition Specification](docs/user/CONFIG.zh-cn.md##Term-Definition Specification)

### 2-2. Word Count

Set `writingAssistant.wordCount.enable` to `true` to enable the word count feature. Once enabled, the real‑time word count will be shown in the status bar. Empty lines, line breaks, indentation, etc. are not counted; punctuation marks are counted; English text is counted by word rather than by letter.

Word count is enabled by default and supports:

- **Full Document Count**: Counts the total number of words in the current file; the result updates in real time as the file content changes.
- **Selection Count**: Counts the total number of words in the selected area; the result updates in real time as the selection changes.
- **Exclude Specified Content**: By configuring related options, you can choose to exclude punctuation or other content from the count.

[View Detailed Configuration](docs/user/CONFIG.md#2.Word Count)

## 3. Important Notes

- The extension only reads files under the workspace root. Ensure your project is opened as a VSCode workspace.
- The heading `## Term Name` can **use Chinese or English characters**; the preview anchor is handled automatically.
· Heading `## Term Name` is **case‑sensitive by default**. If you prefer case‑insensitivity, adjust the relevant configuration.
- Field names are **case‑sensitive**. Make sure they exactly match the field names in your configuration.
- If `hoverFiles` matches multiple files, all terms are merged. If the same term name appears in multiple files, the later one takes precedence.
- Word count only applies to `.txt` files and counts only non‑whitespace characters. You can configure whether to exclude title lines and empty lines.
- If you are using Markdown Preview Enhanced, ensure the extension is installed; otherwise the built‑in preview will be used automatically.

## 4. Frequently Asked Questions

**Q1: No reaction when hovering?**
A1: 1. Confirm the extension is installed and restart VSCode.
    2. Verify that at least one term definition file exists in the project root.
    3. Ensure the term definition file contains the proper headings and corresponding fields.
    4. Open Developer Tools (Help → Toggle Developer Tools) → Console to check for error logs.

**Q2: Aliases not triggering?**
A2: Check that the alias field name matches the `aliasField` setting. Alias separators are limited to commas, Chinese commas, and spaces.

**Q3: After modifying the term definition file, the hover still shows old content?**
A3: The extension automatically updates indexes when the term file is saved. Make sure the file has been saved. If it still doesn’t work, or if you modified the configuration file, run the command `Writing Assistant: Reload Term Index` to manually refresh.

**Q4: How to completely disable hover for a specific term?**
A4: Add the comment `<!-- @hover: exclude=true -->` under the term’s secondary heading.

**Q5: I want different term definition files to display different fields. How?**
A5: Add an `@hover` directive at the beginning of the term definition file. See the [Configuration Guide for details](docs/user/CONFIG.md#1.Term Management).

**Q6: Word count not showing or inaccurate?**
A6: Make sure the current file is a `.txt` file and that `wordCount.enabled` is set to `true`. The count includes only non‑whitespace characters; spaces and line breaks are excluded.

## 5. Limitations

- This extension is **not designed for large‑scale scenarios**, so no optimisations have been made for large data volumes.
- Compatibility has not been fully tested on all platforms.

Other limitations are described in the documentation for each feature.

## 6. Compatibility

Minimum required VSCode version: 1.70.0. Tested on Windows + VSCode 1.121.0. Linux/macOS and earlier versions have not been fully tested; feedback is welcome if you encounter issues.

---

Happy Writing! —— RiTru