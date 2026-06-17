/**
 * 字数统计模块
 * 
 * 在状态栏右侧显示当前 txt 文件的字数统计。
 * 支持全文和选区字数的实时更新，并可配置排除标题行、空行等。
 * 通过监听活动编辑器切换、文本变更和选区变更事件来驱动更新。
 * 
 * 依赖：
 * - vscode           -> 状态栏、事件监听
 * - config.js        -> getConfig 获取 wordCount 相关配置
 * 
 * 导出：
 * - initWordCount(context)   -> 初始化状态栏与监听器
 * - updateWordCount()        -> 手动触发一次字数更新
 */

const vscode = require('vscode');
const { getConfig } = require('./config');

let statusBarItem = null;
let wordCountTimeout = null;

/**
 * 文本处理、字数统计
 * @param {string} text     - 待统计文本
 * @returns {number}        - 统计字数
 */
function countText(text, config) {
    const wc = config.wordCount;

    let lines = text.split(/\r?\n/);
    if (wc.excludeHeaders) {
        lines = lines.filter(line => !line.trim().startsWith('#'));
    }
    if (wc.excludeBlankLines) {
        lines = lines.filter(line => line.trim().length > 0);
    }
    text = lines.join('');
    text = text.replace(/\b[a-zA-Z]+\b/g, 'a');   // 英文单词处理
    text = text.replace(/\s+/g, '');             // 去除空格
    return text.length;
}

/**
 * 计算文档的字数（中文字符计数，移除空白）
 * @param {vscode.TextDocument} doc       - 当前文档
 * @param {vscode.Selection} selection    - 当前选区
 * @param {Object} config                 - 全局配置
 * @returns {{ fullChars:number, selectedChars:number, isSelected:boolean }}
 */
function computeWordCount(doc, selection, config) {
    // 全文处理
    const fullText = doc.getText();
    const fullChars = countText(fullText, config);

    // 选中区域处理
    const selectedText = doc.getText(selection);
    const isSelected = selectedText.length > 0;
    const selectedChars = countText(selectedText, config);

    return { fullChars, selectedChars, isSelected };
}

/**
 * 更新状态栏字数显示
 */
function updateWordCount() {
    if (!statusBarItem) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const doc = editor.document;
    // 当前仅对 .txt 文件启用字数统计
    if (!doc.fileName.endsWith('.txt')) {
        statusBarItem.hide();
        return;
    }

    const config = getConfig();
    if (!config.wordCount.enabled) {
        statusBarItem.hide();
        return;
    }

    // 使用防抖（16ms）避免高频更新
    if (wordCountTimeout) clearTimeout(wordCountTimeout);
    wordCountTimeout = setTimeout(() => {
        const { fullChars, selectedChars, isSelected } = computeWordCount(doc, editor.selection, config);

        // 有选区时显示 “选中/全文”，否则只显示全文
        const showText = isSelected
            ? `$(pencil) ${selectedChars}/${fullChars}`
            : `$(pencil) ${fullChars}`;

        statusBarItem.text = showText;
        statusBarItem.show();
        wordCountTimeout = null;
    }, 16);
}

/**
 * 初始化字数统计功能：创建状态栏项
 * @param {vscode.ExtensionContext} context
 */
function initWordCount(context) {
    // 创建状态栏项，对齐右侧，优先级 100
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    context.subscriptions.push(statusBarItem);
    
    // 立即执行一次更新，显示当前编辑器字数
    updateWordCount();
}

module.exports = { initWordCount, updateWordCount };