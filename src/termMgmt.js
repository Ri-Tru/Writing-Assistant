/**
 * 术语管理模块
 * 
 * 负责实现术语管理的业务逻辑
 * 包括：术语查找，术语悬停，术语搜索
 * 
 * 依赖：
 * - vscode
 * - fs
 * - localize.js        -> 多语言适配
 * - logger.js          -> 日志管理
 * - config.js          -> 获取用户配置（previewMode, openLocation）
 * 
 * 导出：
 * - showDetail()       -> 查看设定命令逻辑实现
 * 
 */

const vscode = require('vscode');
const fs = require('fs');
const { getConfig } = require('./config');
const { localize } = require('./localize');
const logger = require('./logger');

/**
 * 查看设定业务逻辑
 * @param {object} args
 */
function showDetail(args) {
    if (!args || !args.filePath || !args.anchor) {
            logger.warn("termMgmt", "showDetail called with invalid args", {args});
            return;
    }
            
    // 构造带锚点的文件 URI，预览将直接跳转到指定标题
    const uri = vscode.Uri.file(args.filePath).with({ fragment: args.anchor });
    const config = require('./config').getConfig();
    
    logger.debug("termMgmt", "markdown preview", {previewMode: config.previewMode});
            
    if (config.previewMode === 'mpe') {
    // 优先使用 Markdown Preview Enhanced 打开侧边预览
    vscode.commands.executeCommand('markdown-preview-enhanced.openPreviewToTheSide', uri)
        .then(undefined, () => {
            // 若 MPE 未安装或命令失败，回退到内置预览
            vscode.commands.executeCommand('markdown.showPreviewToSide', uri);
            vscode.window.showWarningMessage(localize("MPENotInstalled"));
            logger.warn("termMgmt", "MPE not installed");
        })
    } else {
        // 默认使用 VS Code 内置 Markdown 预览
        vscode.commands.executeCommand('markdown.showPreviewToSide', uri);
    }
}

/**
 * 编辑术语业务逻辑
 * @param {object} args
 */
async function editTerm(args) {
    if (!args || !args.filePath || !args.anchor) {
        logger.warn("termMgmt", "editTerm called with invalid args", {args});
        return;
    }

    const uri = vscode.Uri.file(args.filePath);

    // 以只读方式打开文档（不立即显示）
    const document = await vscode.workspace.openTextDocument(uri);

    // 通过文本内容查找术语锚点（args.anchor 为术语名）
    const fullText = document.getText();
    // 锚点格式为标题文本，去掉前导#);
    const startOffset = fullText.indexOf(args.anchor);  
    // 若未查找到，直接返回。理论上该命令通过悬停卡片调用，不会出现找不到的情况。
    if (startOffset === -1) {
        logger.warn("termMgmt", "editTerm called with non-existed term", {term: args.anchor});
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
}

/**
 * 搜索术语并跳转
 */
async function searchTerm() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        logger.error("termMgmt", "search when editor not focused");
        return;
    }
    const selection = editor.selection;
    const term = editor.document.getText(selection).trim();
    
    // 待搜索内容（选中区域）为空是预期中的行为，无需报错
    if (!term) return;
    
    const config = getConfig();

    const patterns = config.term.termFiles || [];

    // 使用 VS Code 工作区文件搜索，支持通配符
    const promises = patterns.map(pattern => vscode.workspace.findFiles(pattern, null));
    const results = await Promise.all(promises);
    const uris = results.flat();

    if (uris.length === 0) {
        vscode.window.showInformationMessage(localize('noTermFilesConfigured'));
        return;
    }

    termPattern = new RegExp(`#+\\s+${term}`);
    for (const uri of uris) {
        // 读取文件内容并查找术语
        const document = await vscode.workspace.openTextDocument(uri)
        const fullText = document.getText();
        const match = fullText.match(termPattern); 

        // 如果未找到术语，继续下一个文件
        if (!match) continue;

        // 如果找到匹配的术语，使用 vscode.window.showTextDocument 打开文件并定位到对应行
        const args = {
            filePath: uri.fsPath,
            anchor: term
        }
        logger.debug("termMgmt", "jump to file", {args});
        vscode.commands.executeCommand('writing-assistant.showDetail', args);
        
        return; // 找到第一个匹配项后退出
    }

    vscode.window.showErrorMessage(localize('termNotFound', {term}));
}

module.exports = {
    showDetail,
    editTerm,
    searchTerm
}