/**
 * 扩展入口模块
 * 
 * 这是 Writing Assistant 扩展的激活和停用入口。
 * 在 activate 阶段依次完成：配置加载、术语索引构建、悬停提供器注册、
 * 命令注册和字数统计初始化。
 * 
 * 依赖：
 * - vscode
 * - config.js          -> loadConfig
 * - localize.js        -> localize
 * - logger.js          -> error,warn,info,debug
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
const logger = require('./logger');
const { localize } = require('./localize');
const { loadConfig } = require('./config');
const { buildIndex } = require('./indexBuilder');
const { registerHoverProvider } = require('./hoverProvider');
const { initWordCount } = require('./wordCount');
const { registerCommands } = require('./commands');
const { registerListeners } = require('./listeners');

/**
 * 扩展激活时执行
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
    // 要求当前已打开工作区文件夹
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showWarningMessage(localize('pleaseOpenFolder'));
        logger.warn("extension", "Activation skipped: no workspace folder opened");
        return;
    }

    // 加载配置
    loadConfig();

    // 构建术语索引（扫描档案文件）
    await buildIndex();

    // 注册命令和文件保存监听器
    await registerCommands(context);
    await registerListeners(context);

    // 初始化字数统计（状态栏显示与实时更新）
    initWordCount(context);

    logger.info("extension","extension activated");
}

/**
 * 扩展停用时执行（目前为空）
 */
function deactivate() {}

module.exports = { activate, deactivate };