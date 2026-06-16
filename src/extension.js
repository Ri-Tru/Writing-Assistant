/**
 * 扩展入口模块
 * V0.1 2026-4-30
 * 
 * 这是 Writing Assistant 扩展的激活和停用入口。
 * 在 activate 阶段依次完成：配置加载、术语索引构建、悬停提供器注册、
 * 命令注册和字数统计初始化。
 * 
 * 依赖：
 * - config.js          -> loadConfig
 * - indexBuilder.js    -> buildIndex
 * - hoverProvider.js   -> registerHoverProvider
 * - wordCount.js       -> initWordCount
 * - commands.js        -> registerCommands
 * 
 * 导出：
 * - activate(context)  -> 扩展激活时调用
 * - deactivate()       -> 扩展停用时调用
 */

const vscode = require('vscode');
const { loadConfig } = require('./config');
const { buildIndex } = require('./indexBuilder');
const { registerHoverProvider } = require('./hoverProvider');
const { initWordCount } = require('./wordCount');
const { registerCommands } = require('./commands');

/**
 * 扩展激活时执行
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
    console.log('[Writing Assistant] 扩展激活');

    // 要求当前已打开工作区文件夹
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showWarningMessage('请先打开一个项目文件夹');
        return;
    }

    // 1. 加载配置
    loadConfig();

    // 2. 构建术语索引（扫描档案文件）
    await buildIndex();

    // 3. 注册悬停提供器（鼠标悬浮显示术语详情）
    context.subscriptions.push(registerHoverProvider());

    // 4. 注册命令和文件保存监听器
    registerCommands(context);

    // 5. 初始化字数统计（状态栏显示与实时更新）
    initWordCount(context);
}

/**
 * 扩展停用时执行（目前为空）
 */
function deactivate() {}

module.exports = { activate, deactivate };