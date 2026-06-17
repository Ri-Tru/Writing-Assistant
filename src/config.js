/**
 * 配置管理模块
 * 
 * 负责从 VS Code 工作区设置（writingAssistant）中读取用户配置，
 * 合并默认值，并提供全局配置的加载、获取和重载功能。
 * 
 * 依赖：
 * - vscode           -> workspace.getConfiguration
 * 
 * 导出：
 * - loadConfig()     -> 加载并返回合并后的配置对象
 * - getConfig()      -> 获取当前缓存的配置，若无则调用 loadConfig
 * - reloadConfig()   -> 强制重新加载配置
 */

const vscode = require('vscode');

// 缓存当前生效的配置对象
let currentConfig = null;

/**
 * 从 VS Code 设置中读取并合并配置
 * @returns {Object} 合并后的配置对象
 */
function loadConfig() {
    const settings = vscode.workspace.getConfiguration('writingAssistant');

    currentConfig = {
        // 通用设置
        encoding: vscode.workspace.getConfiguration('files').get('encoding', 'utf-8'),
        previewMode: settings.get('previewMode', "builtin"),
        openLocation: settings.get('openLocation', "beside"),
        // 术语管理设置
        term: {
            termFiles: settings.get('term.termFiles'),
            hoverFiles: settings.get('term.hoverFiles'),
            titleLevel: settings.get('term.titleLevel'),
            hoverField: settings.get('term.hoverField'),
            aliasField: settings.get('term.aliasField'),
            showFields: settings.get('term.showFields'),
            scanRange: settings.get('term.scanRange')
        },
        // 字数统计设置
        wordCount: {
            enabled: settings.get('wordCount.enabled'),
            excludeHeaders: settings.get('wordCount.excludeHeaders'),
            excludeBlankLines: settings.get('wordCount.excludeBlankLines')
        }
    };

    return currentConfig;
}

/**
 * 获取当前配置（带缓存）
 * @returns {Object}
 */
function getConfig() {
    if (!currentConfig) {
        return loadConfig();
    }
    return currentConfig;
}

/**
 * 强制重新加载配置
 * @returns {Object} 新加载的配置对象
 */
function reloadConfig() {
    return loadConfig();
}

module.exports = { loadConfig, getConfig, reloadConfig };