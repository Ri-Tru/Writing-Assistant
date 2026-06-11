/**
 * 命令注册模块
 * V0.1 2026-4-30
 * 
 * 负责注册扩展的所有自定义命令和事件监听器，包括：
 * - 查看完整设定（侧边预览 Markdown 档案文件）
 * - 编辑术语设定（打开档案文件并定位到指定术语）
 * - 手动重载索引
 * - 监听档案文件保存后自动更新索引
 * 
 * 依赖：
 * - config.js          -> 获取用户配置（previewMode, openLocation）
 * - indexBuilder.js    -> 提供 buildIndex、updateIndexForFile、getWatchedFiles
 * - wordCount.js       -> 提供 updateWordCount 刷新状态栏字数
 * 
 * 导出：
 * - registerCommands(context)  -> 异步函数，注册所有命令和监听器并推入 context.subscriptions
 */

const vscode = require('vscode');
const { reloadConfig } = require('./config');
const { buildIndex, updateIndexForFile, getWatchedFiles } = require('./indexBuilder');
const { updateWordCount } = require('./wordCount');

/**
 * 注册所有命令和文件保存监听器
 * @param {vscode.ExtensionContext} context - 扩展上下文，用于管理订阅
 */
async function registerCommands(context) {

    // ------------------------------------------------------------
    // 1. 命令：查看完整设定（以侧边 Markdown 预览方式打开档案文件）
    // ------------------------------------------------------------
    const showDetailCmd = vscode.commands.registerCommand('writing-assistant.showDetail', (args) => {
        if (!args || !args.filePath || !args.anchor) return;
        
        // 构造带锚点的文件 URI，预览将直接跳转到指定标题
        const uri = vscode.Uri.file(args.filePath).with({ fragment: args.anchor });
        const config = require('./config').getConfig();

        if (config.previewMode === 'mpe') {
            // 优先使用 Markdown Preview Enhanced 打开侧边预览
            vscode.commands.executeCommand('markdown-preview-enhanced.openPreviewToTheSide', uri)
                .then(undefined, () =>
                    // 若 MPE 未安装或命令失败，回退到内置预览
                    vscode.commands.executeCommand('markdown.showPreviewToSide', uri)
                );
        } else {
            // 默认使用 VS Code 内置 Markdown 预览
            vscode.commands.executeCommand('markdown.showPreviewToSide', uri);
        }
    });

    // ------------------------------------------------------------
    // 2. 命令：编辑术语设定（打开档案文件，定位并高亮指定术语文本）
    // ------------------------------------------------------------
    const editTermCmd = vscode.commands.registerCommand('writing-assistant.editTerm', async (args) => {
        if (!args || !args.filePath || !args.anchor) return;

        const uri = vscode.Uri.file(args.filePath);

        // 以只读方式打开文档（不立即显示）
        const document = await vscode.workspace.openTextDocument(uri);

        // 通过文本内容查找术语锚点（args.anchor 为术语名）
        const fullText = document.getText();
        // 锚点格式为标题文本，去掉前导#);
        const startOffset = fullText.indexOf(args.anchor);  
        if (startOffset === -1) {
            vscode.window.showWarningMessage('未找到指定术语文本');
            return;
        }
        const endOffset = startOffset + args.anchor.length;

        // 将偏移量转换为行列位置，构造 Range
        const startPos = document.positionAt(startOffset);
        const endPos = document.positionAt(endOffset);
        const range = new vscode.Range(startPos, endPos);

        // 根据用户配置决定打开位置（侧边栏或当前编辑组）
        const config = require('./config').getConfig();
        const location = config.openLocation;

        let editor = await vscode.window.showTextDocument(document, {
                selection: range,
                viewColumn: location === 'beside' 
                    ? vscode.ViewColumn.Beside
                    : vscode.ViewColumn.Active,
                preserveFocus: false,
                preview: false          // 以永久标签页显示
            });

        // 将高亮区域滚动到视图中央，便于查看上下文
        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
    });

    // ------------------------------------------------------------
    // 3. 命令：手动重载术语索引
    // ------------------------------------------------------------
    const reloadCmd = vscode.commands.registerCommand('writing-assistant.reload', async () => {
        // 重新加载配置（从 settings.json 读取最新值）
        reloadConfig();
        // 强制重新构建索引
        const size = await buildIndex(true);
        vscode.window.showInformationMessage(`已重新加载 ${size} 条术语`);
        // 刷新状态栏字数统计
        updateWordCount();
    });

    // ------------------------------------------------------------
    // 4. 监听器：档案文件保存时自动更新对应索引
    // ------------------------------------------------------------
    const saveListener = vscode.workspace.onDidSaveTextDocument((doc) => {
        const filePath = doc.uri.fsPath;
        // 仅当保存的文件属于已监控的术语档案文件时，才更新索引
        if (getWatchedFiles().has(filePath)) {
            updateIndexForFile(filePath);
        }
    });

    // 将所有命令和监听器加入上下文订阅，以便在扩展停用时自动清理
    context.subscriptions.push(showDetailCmd, editTermCmd, reloadCmd, saveListener);
}

module.exports = { registerCommands };