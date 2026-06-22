/**
 * 悬停提供器模块
 * 
 * 负责注册 VS Code 的悬停提供器（Hover Provider），当鼠标悬停在文本上时，
 * 根据光标附近的文本块匹配术语，并显示包含摘要和详细信息的悬停卡片。
 * 
 * 依赖：
 * - config.js          -> 提供全局配置（scanRange, hoverField, showFields, fileRules, previewMode）
 * - indexBuilder.js    -> 提供术语映射表 TermMap 和文件路径信息
 * - globUtils.js       -> 提供 simpleGlobMatch 用于文件规则匹配
 * 
 * 导出：
 * - provideHover()     -> 返回 Disposable 对象
 */

const vscode = require('vscode');
const logger = require('./logger');
const { getConfig } = require('./config');
const { getTermMap } = require('./indexBuilder');
const { simpleGlobMatch } = require('./globUtils');
const { getTermInfo } = require('./markdownUtils');

/**
 * 提供悬停业务逻辑
 * @returns {vscode.Disposable} 用于释放悬停提供器的对象
 */
async function termHover(document, position, token) {
    // 获取配置等信息
    const termConfig = getConfig().term;
    const TermMap = getTermMap();
    
    // 获取光标所在行文本
    const line = document.lineAt(position.line);
    const text = line.text;
    const lineNumOffset = position.character;

    // 从配置中读取术语匹配时的扫描范围
    const scanRange = termConfig.scanRange;

    // 向左扩展，最多 scanRange 个字符
    let start = lineNumOffset, left = 0;
    while (start > 0 && left < scanRange) {  
        start--;
        left++;
    }
    // 向右扩展
    let end = lineNumOffset, right = 0;
    while (end < text.length && right < scanRange) {
        end++;
        right++;
    }

    // 提取出光标附近的文本块（局部匹配区域）
    const block = text.slice(start, end);
    if (!block) return null;

    // 在文本块中查找最长匹配的术语
    let matchedTerm = null;
    let maxLen = 0;
    // 枚举块中的所有子串，找到最长的、存在于 TermMap 中的术语
    for (let i = 0; i < block.length; i++) {
        if (token.isCancellationRequested) return null;
        for (let j = i + 1; j <= block.length; j++) {
            const cand = block.slice(i, j);
            if (TermMap.has(cand) && cand.length > maxLen) {
                matchedTerm = cand;
                maxLen = cand.length;
                break;  // 优先匹配最长的术语，找到后立即跳出内层循环
            }
        }
        if (matchedTerm) break;  // 已找到匹配项，跳出外层循环
    }
    if (!matchedTerm) return null;   // 未匹配到任何术语

    logger.debug("hoverProvider", "hover trigged", {
        file: document.uri.fsPath,
        block
    });

    // 获取该术语的详细信息
    const termSource = TermMap.get(matchedTerm);
    const termInfo = await getTermInfo(termSource.filePath, termSource.lineNum);
    if (!termInfo) return null;
                
    // 构建悬停卡片内容（Markdown 格式）
    const hoverLines = [`**${matchedTerm}**`];
    if (termInfo.hoverField) {
        hoverLines.push(termInfo.hoverField);
    }
    logger.debug("hoverProvider",
        "termInfo length",
        {length: Object.keys(termInfo.showFields).length});
    if (Object.keys(termInfo.showFields).length > 0) {
        Object.entries(termInfo.showFields).forEach(([key, value]) => {
            hoverLines.push(`- **${key}**: ${value}`);
        });
    }
    // 分隔线和可点击的命令链接（打开完整设定预览）
    hoverLines.push('', '---');
    const args = JSON.stringify({ filePath: TermMap.get(matchedTerm).filePath, anchor: termInfo.anchor });
    hoverLines.push(`[$(book)查看完整设定](command:writing-assistant.showDetail?${encodeURIComponent(args)})`);
    hoverLines.push(`[$(pencil)编辑术语设定](command:writing-assistant.editTerm?${encodeURIComponent(args)})`);
                

    // 将 Markdown 字符串包装为 Hover 对象
    const md = new vscode.MarkdownString(hoverLines.join('  \n'));
    md.isTrusted = true;
    md.supportThemeIcons = true;
    return new vscode.Hover(md);
}

module.exports = { termHover };