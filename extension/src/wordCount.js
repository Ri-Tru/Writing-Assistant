/**
 * 字数统计模块
 * V0.1 2026-4-30
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
 * 计算文档的字数（中文字符计数，移除空白）
 * @param {vscode.TextDocument} doc       - 当前文档
 * @param {vscode.Selection} selection    - 当前选区
 * @param {Object} config                 - 全局配置
 * @returns {{ fullChars:number, selectedChars:number, isSelected:boolean }}
 */
function computeWordCount(doc, selection, config) {
    const wc = config.wordCount;

    // 全文处理
    const fullText = doc.getText();
    let fullLines = fullText.split(/\r?\n/);
    if (wc.excludeHeaders) {
        fullLines = fullLines.filter(line => !line.trim().startsWith('#'));
    }
    if (wc.excludeBlankLines) {
        fullLines = fullLines.filter(line => line.trim().length > 0);
    }
    const fullChars = fullLines.join('').replace(/\s+/g, '').length;

    // 选中区域处理
    const selectedText = doc.getText(selection);
    const isSelected = selectedText.length > 0;
    let selectedChars = 0;
    if (isSelected) {
        let selectedLines = selectedText.split(/\r?\n/);
        if (wc.excludeHeaders) {
            selectedLines = selectedLines.filter(line => !line.trim().startsWith('#'));
        }
        if (wc.excludeBlankLines) {
            selectedLines = selectedLines.filter(line => line.trim().length > 0);
        }
        selectedChars = selectedLines.join('').replace(/\s+/g, '').length;
    }

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
 * 初始化字数统计功能：创建状态栏项并注册相关事件监听器
 * @param {vscode.ExtensionContext} context
 */
function initWordCount(context) {
    // 创建状态栏项，对齐右侧，优先级 100
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    context.subscriptions.push(statusBarItem);

    // 监听活动编辑器切换
    const activeEditorListener = vscode.window.onDidChangeActiveTextEditor(() => updateWordCount());

    // 监听文本内容变更（仅当前活动编辑器变更时触发）
    const changeTextListener = vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.document === vscode.window.activeTextEditor?.document) {
            updateWordCount();
        }
    });

    // 监听选区变更，但只在 .txt 文件时才更新（减少不必要的计算）
    const selectionListener = vscode.window.onDidChangeTextEditorSelection(() => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.fileName.endsWith('.txt')) {
            updateWordCount();
        }
    });

    context.subscriptions.push(activeEditorListener, changeTextListener, selectionListener);

    // 立即执行一次更新，显示当前编辑器字数
    updateWordCount();
}

module.exports = { initWordCount, updateWordCount };