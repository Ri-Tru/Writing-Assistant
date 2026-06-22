/**
 * 术语索引构建模块
 * 
 * 负责扫描用户指定的档案 Markdown 文件，解析其中的术语定义（以标题为术语名，
 * 以 `- **字段**: 值` 为属性），并构建内存中的 TermMap 索引。
 * 同时维护被监控的文件列表，用于文件保存时的增量更新。
 * 
 * 依赖：
 * - vscode、fs、path       -> 文件相关操作
 * - logger.js              -> 日志管理
 * - localize.js            -> localize多语言适配
 * - globUtils.js           -> simpleGlobMatch 文件规则匹配
 * - markdownUtils.js       -> 提供 getTitlePattern、parseFieldLine、parseHoverComment
 * - config.js              -> getConfig 获取当前配置
 * 
 * 导出：
 * - getTermMap()           -> 获取术语映射表
 * - getWatchedFiles()      -> 获取被监控文件集合
 * - buildIndex(showMsg)    -> 构建/重建索引
 * - updateIndexForFile(p)  -> 更新单个文件的索引
 * - addWatchedFile(p)      -> 添加文件到监控集合
 * - clearIndex()           -> 清空索引
 */

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const { simpleGlobMatch } = require('./globUtils');
const { getTitlePattern, parseFieldLine, parseHoverComment } = require('./markdownUtils');
const { getConfig } = require('./config');
const { localize } = require('./localize');

// 术语名 → { filePath, anchor, fields, overrides }
let TermMap = new Map();
// 需要监控变更的术语档案文件集合
let watchedFiles = new Set();

function addTerm(name, info) {
    TermMap.set(name, info);
}

function getTermMap() {
    return TermMap;
}

function getWatchedFiles() {
    return watchedFiles;
}

function addWatchedFile(filePath) {
    watchedFiles.add(filePath);
}

function clearIndex() {
    TermMap.clear();
    watchedFiles.clear();
}

/**
 * 处理单个术语条目，将其存入全局 TermMap，并根据别名字段创建额外映射
 * @param {string} name      - 术语显示名（即标题文本）
 * @param {string} filePath  - 术语所在文件绝对路径
 * @param {number} lineNum   - 术语定义在文件中的行号（用于生成锚点）
 */
function processTerm(name, filePath, lineNum) {
    const config = getConfig();

    const termInfo = {
        filePath,
        lineNum,
    };

    // 主名称映射
    TermMap.set(name, termInfo);
}

/**
 * 解析单个 Markdown 文件，提取其中的术语信息并更新内存索引
 * @param {string} filePath - 文件绝对路径
 */
async function parseSingleFileAndUpdateIndex(filePath) {
    const config = getConfig();
    const encoding = config.encoding;
    let titleLevel = config.term.titleLevel;
    let aliasField = config.term.aliasField;
    let doc;

    try {
        doc = await vscode.workspace.openTextDocument(filePath);
    } catch (err) {
        vscode.window.showErrorMessage(localize("FailedToReadFile", {filePath}));
        logger.error("indexBuilder", "failed to read file", {filePath});
        return;
    }
    const sourceFileRel = vscode.workspace.asRelativePath(filePath);
    
    let lineNum = 0;
    let line = doc.lineAt(lineNum).text;
    // 获取是否有匹配该文件的 fileRule 配置（可覆盖全局标题级别等）
    while (line.startsWith('<!--')) {
        lineNum += 1;
        const override = parseHoverComment(line, true);
        if (override && override['titleLevel']) {
            titleLevel = override['titleLevel'];
        } else if (override && override['aliasField']) {
            aliasField = override['aliasField'];
        }
        line = doc.lineAt(lineNum).text;
    }
    
    const titlePattern = getTitlePattern(titleLevel);
    logger.debug("indexBuilder", "config", {
        encoding,
        titleLevel,
        aliasField
    })

    let currentName = null;
    let prevLineNum = 0;
    let overrides = null;

    while (lineNum < doc.lineCount) {
        const trimmed = doc.lineAt(lineNum).text.trim();
        lineNum += 1;

        // 匹配标题行（术语名）
        const titleMatch = trimmed.match(titlePattern);
        if (titleMatch) {
            // 保存上一个术语
            if (currentName) processTerm(currentName, filePath, prevLineNum);
            currentName = titleMatch[1].trim();
            prevLineNum = lineNum - 1;
            continue;
        }

        // 检查 @hover 注释行，提取覆盖配置
        const override = parseHoverComment(trimmed);
        if (override) {
            overrides = { ...overrides, ...override };
            continue;
        }
        
        // 整个术语块被标记为排除，跳过后续处理
        if (overrides?.exclude === true) {
            currentName = null;
            continue;
        }

        let aliases = null;
        // 检查字段行（- **字段名**: 值）
        const field = parseFieldLine(trimmed);
        if (field) {
            if (field.fieldName === aliasField) {
                aliases = field.fieldValue.split(/\s?[,;\uFF0C\u3001]\s?/);
            }
        }

        if (aliases && aliases.length > 0) {
            for (const alias of aliases) {
                // 别名映射到同一术语信息
                TermMap.set(alias, { filePath, lineNum: prevLineNum });
            }
        }
    }

    // 处理文件末尾的最后一个术语
    if (currentName) processTerm(currentName, filePath, prevLineNum); 

    logger.debug("indexBuilder", "index updated", {TermMap});
}

/**
 * 构建或重建术语索引
 * @param {boolean} showMessage - 是否显示完成提示
 * @returns {Promise<number>} TermMap 中的条目总数
 */
async function buildIndex(showMessage = false) {
    const config = getConfig();
    clearIndex();

    const patterns = config.term.hoverFiles || [];

    // 使用 VS Code 工作区文件搜索，支持通配符
    const promises = patterns.map(pattern => vscode.workspace.findFiles(pattern, null));
    const results = await Promise.all(promises);
    const uris = results.flat();

    for (const uri of uris) {
        const filePath = uri.fsPath;
        addWatchedFile(filePath);
        parseSingleFileAndUpdateIndex(filePath);
    }

    const num = uris.length;
    const size = TermMap.size;
    if (showMessage) {
        vscode.window.showInformationMessage(localize('termReloaded', {num, size}));
    }

    logger.debug("indexBuilder", "index built", {TermMap});
    return TermMap.size;
}

/**
 * 更新单个文件的索引（保存时调用）
 * @param {string} filePath - 文件绝对路径
 */
function updateIndexForFile(filePath) {
    if (watchedFiles.has(filePath)) {
        parseSingleFileAndUpdateIndex(filePath);
    }
}

module.exports = {
    getTermMap,
    getWatchedFiles,
    buildIndex,
    updateIndexForFile,
    addWatchedFile,
    clearIndex
};