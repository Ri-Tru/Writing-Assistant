/**
 * 命令注册模块
 * 
 * 负责注册扩展的所有自定义命令和事件监听器，包括：
 * - 查看完整设定（侧边预览 Markdown 档案文件）
 * - 编辑术语设定（打开档案文件并定位到指定术语）
 * - 手动重载索引
 * - 监听档案文件保存后自动更新索引
 * 
 * 依赖：
 * - vscode
 * - config.js          -> 获取用户配置
 * - termMgmt.js        -> 提供  showDetail, editTerm, searchTerm
 * - indexBuilder.js    -> 提供 buildIndex
 * - wordCount.js       -> 提供 updateWordCount 刷新状态栏字数
 * 
 * 导出：
 * - registerCommands(context)  -> 异步函数，注册所有命令和监听器并推入 context.subscriptions
 */

const vscode = require('vscode');
const { reloadConfig } = require('./config');
const { showDetail, editTerm, searchTerm } = require('./termMgmt');
const { buildIndex } = require('./indexBuilder');
const { updateWordCount } = require('./wordCount');

/**
 * 注册所有命令
 * @param {vscode.ExtensionContext} context - 扩展上下文，用于管理订阅
 */
async function registerCommands(context) {

    // ------------------------------------------------------------
    // 1. 命令：查看完整设定（以侧边 Markdown 预览方式打开档案文件）
    // ------------------------------------------------------------
    const showDetailCmd = vscode.commands.registerCommand('writing-assistant.showDetail', (args) => 
        showDetail(args)    
    );

    // ------------------------------------------------------------
    // 2. 命令：编辑术语设定（打开档案文件，定位并高亮指定术语文本）
    // ------------------------------------------------------------
    const editTermCmd = vscode.commands.registerCommand('writing-assistant.editTerm', async (args) => 
        await editTerm(args)
    );

    // ------------------------------------------------------------
    // 3. 命令：手动重载术语索引
    // ------------------------------------------------------------
    const reloadCmd = vscode.commands.registerCommand('writing-assistant.reload', async () => {
        // 重新加载配置（从 settings.json 读取最新值）
        reloadConfig();
        // 强制重新构建索引
        await buildIndex(true);
        // 刷新状态栏字数统计
        updateWordCount();
    });

    // ------------------------------------------------------------
    // 4. 命令：搜索术语
    // ------------------------------------------------------------
    const searchCmd = vscode.commands.registerCommand('writing-assistant.searchTerm', async () => {
        await searchTerm();
    });

    // 将所有命令加入上下文订阅，以便在扩展停用时自动清理
    context.subscriptions.push(
        showDetailCmd,
        editTermCmd,
        reloadCmd,
        searchCmd
    );
}

module.exports = { registerCommands };