/**
 * 监听器注册模块
 * 
 * 负责注册扩展的所有监听器，包括：
 * - 文件保存监听器
 * - 文本选区变化监听器
 * - 术语悬停监听器
 * 
 * 依赖：
 * - vscode
 * - indexBuilder.js        -> 提供 getWatchedFiles, updateIndexForFile
 * - hoverProvider.js       -> 提供 termHover
 * - wordCount.js           -> 提供 updateWordCount
 * 
 * 导出：
 * - registerListeners()    -> 异步函数，注册所有监听器并推入 context.subscriptions
 */

const vscode = require('vscode');
const { getWatchedFiles, updateIndexForFile } = require('./indexBuilder');
const { termHover } = require('./hoverProvider');
const { updateWordCount } = require('./wordCount');

/**
 * 注册所有监听器
 * @param {vscode.ExtensionContext} context - 扩展上下文，用于管理订阅
 */
async function registerListeners(context) {
    // ------------------------------------------------------------
    // 1. 监听器：档案文件保存时自动更新对应索引
    // ------------------------------------------------------------
    const saveListener = vscode.workspace.onDidSaveTextDocument((doc) => {
        const filePath = doc.uri.fsPath;
        // 仅当保存的文件属于已监控的术语档案文件时，才更新索引
        if (getWatchedFiles().has(filePath)) {
            updateIndexForFile(filePath);
        }
    });

    // ------------------------------------------------------------
    // 2. 监听器：术语悬停提供器
    // ------------------------------------------------------------
    const hoverListener = vscode.languages.registerHoverProvider(
        ['markdown', 'plaintext'],  // 支持 Markdown 和纯文本文件
        {
            async provideHover(document, position, token) {
                return await termHover(document, position, token);
            }
        });        
  
    // ------------------------------------------------------------
    // 3. 监听器：监听活动编辑器切换
    // ------------------------------------------------------------
    const activeEditorListener = vscode.window.onDidChangeActiveTextEditor(() => 
        updateWordCount()
    );

    // ------------------------------------------------------------
    // 4. 监听器：监听文本内容变更（仅当前活动编辑器变更时触发）
    // ------------------------------------------------------------
    const changeTextListener = vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.document === vscode.window.activeTextEditor?.document) {
            updateWordCount();
        }
    });

    // ------------------------------------------------------------
    // 5. 监听器：监听选区变更，但只在 .txt 文件时才更新（减少不必要的计算）
    // ------------------------------------------------------------
    const selectionListener = vscode.window.onDidChangeTextEditorSelection(() => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.fileName.endsWith('.txt')) {
            updateWordCount();
        }
    });

    // 将所有监听器加入上下文订阅，以便在扩展停用时自动清理
    context.subscriptions.push(
        saveListener,
        hoverListener,
        activeEditorListener,
        changeTextListener,
        selectionListener
    );
}

module.exports = { registerListeners };