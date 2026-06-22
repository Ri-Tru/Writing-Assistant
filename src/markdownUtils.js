/**
 * Markdown 解析工具模块
 * 
 * 提供用于解析术语档案 Markdown 文件的辅助函数：
 * - 构建标题正则（根据级别 # 数量）
 * - 识别字段行格式：- **字段名**: 值
 * - 解析 @hover 注释指令：<!-- @hover: key="value" ... -->
 * 
 * 依赖：
 * - config.js                -> getConfig() 获取配置
 * - logger.js                -> 日志管理
 * 
 * 导出：
 * - getTitlePattern(level)   -> 返回匹配指定级别标题的正则表达式
 * - parseFieldLine(line)     -> 从行中提取字段名和值，或 null
 * - parseHoverComment(line)  -> 解析 @hover 注释，返回覆盖配置对象或 null
 */

const vscode = require('vscode');
const { getConfig } = require('./config');
const logger = require('./logger');

/**
 * 生成用于匹配 Markdown 标题的正则表达式
 * @param {number} level - 标题级别（1~6）
 * @returns {RegExp}
 */
function getTitlePattern(level) {
    const hashes = '#'.repeat(level);
    return new RegExp(`^${hashes}\\s+(.+)$`);
}

/**
 * 解析形如 "- **字段名**: 值" 的行
 * @param {string} line - 待解析行文本
 * @returns {{fieldName:string, fieldValue:string}|null}
 */
function parseFieldLine(line) {
    const match = line.match(/^\s*-\s*\*\*(.+?)\*\*\s*[:：]\s*(.*)$/);
    if (match) {
        return {
            fieldName: match[1].trim(),
            fieldValue: match[2].trim()
        };
    }
    return null;
}

/**
 * 解析 @hover 注释指令，格式：<!-- @hover: key1=val1;key2="val2" -->
 * @param {string} termLine - 待解析行，可以是文件级配置，也可以是术语级配置
 * @param {boolean} isFileLevel - 是否为文件级配置（默认为 false）
 * @returns {Object|null} - 包含覆盖键值对的对象，或 null
 */
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
            // 去除文件级术语表示（如果有）
            if (key.startsWith('file.')) {
                // 仅文件级配置允许使用 file. 前缀，表示这是针对整个文件的配置
                if (isFileLevel) key = key.slice(5);
                else {
                    // 非文件级配置不应包含 file. 前缀
                    logger.warn("markdownUtil", "invalid prefix 'file.'", {termLine});
                    return null;
                }
            }
            // 去除引号（双引号或单引号）
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            overrides[key] = value;
        }
    }

    return overrides;
}

/**
 * 解析指定位置的文本块，返回术语悬停信息
 * @param {string} filePath - 待解析文件绝对路径
 * @param {number} lineNum  - 待解析文本所在行号
 * @returns {Object|null} - 包含术语信息的对象，或 null
*/
async function getTermInfo(filePath, lineNum) {
    const doc = await vscode.workspace.openTextDocument(filePath);
    const termConfig = getConfig().term;
    
    let currentConfig = {
        titleLevel: termConfig.titleLevel,
        aliasField: termConfig.aliasField,
        hoverField: termConfig.hoverField,
        showFields: termConfig.showFields
    };

    // 解析开头的文件级 @hover 配置（如果存在）
    let lineNumber = 0;  // 0-based line number
    let lineText = doc.lineAt(lineNumber).text;
    let override = parseHoverComment(lineText, true);
    while (override) {
        Object.assign(currentConfig, override);
        lineNumber += 1;
        if (lineNumber >= doc.lineCount) return null;
        lineText = doc.lineAt(lineNumber).text;
        override = parseHoverComment(lineText, true);
    }

    // 加入标题作为URL锚点
    lineText = doc.lineAt(lineNum).text;
    let hoverInfo = {
        // 锚点格式为标题文本，去掉前导#和空白字符
        anchor: lineText.trim().replace(/#+\s+/g, '')
    };


    // 解析术语级 @hover 配置（如果存在）
    lineNum++;  // 从术语标题行的下一行开始解析
    if (lineNum >= doc.lineCount) return null;
    lineText = doc.lineAt(lineNum).text;
    override = parseHoverComment(lineText, true);
    while (override) {
        Object.assign(currentConfig, override);
        lineNum++;
        if (lineNum >= doc.lineCount) return null;
        lineText = doc.lineAt(lineNum).text;
        override = parseHoverComment(lineText);
    }
    
    // 从当前行号往后逐行读取，并解析术语悬停信息
    while (override) {
        Object.assign(currentConfig, override);
        lineNum += 1;
        if (lineNum >= doc.lineCount) return;
        lineText = doc.lineAt(lineNum).text;
        override = parseHoverComment(lineText);
    }
    
    // 从当前行号往前逐行读取，提取悬停信息
    let parse = parseFieldLine(lineText);
    while (parse) {
        if (currentConfig.hoverField === parse.fieldName) {
            hoverInfo.hoverField = parse.fieldValue;
        }
        if (currentConfig.showFields.includes(parse.fieldName)) {
            hoverInfo.showFields = {
                ...(hoverInfo.showFields ?? []),
                [parse.fieldName]: parse.fieldValue
            };
        }
        lineNum += 1;
        if (lineNum >= doc.lineCount) break;
        lineText = doc.lineAt(lineNum).text;
        parse = parseFieldLine(lineText);
    }
    return hoverInfo;
}

module.exports = { 
    getTitlePattern,
    parseFieldLine,
    parseHoverComment,
    getTermInfo
};