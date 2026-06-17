/**
 * 语言适配模块
 * 
 * 负责将需要显示的字符串进行语言适配，
 * 根据用户的系统语言环境返回对应的翻译文本。
 * 
 * 依赖：
 * - vscode             -> 包含l10n模块
 * 
 * 导出：
 * - localize(str)      -> 根据当前语言环境返回翻译文本，支持占位符替换
 */

const vscode = require('vscode');

/**
 * 翻译函数
 * @param {string} key - 语言包中的键名
 * @param {...any} args - 占位符参数
 * @returns {string} 翻译后的字符串
 */
function localize(key, ...args) {
    // vscode.l10n.t 会自动根据当前语言加载对应的翻译
    return vscode.l10n.t(key, ...args);
}

module.exports = { localize };