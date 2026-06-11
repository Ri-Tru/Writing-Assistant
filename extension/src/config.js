/**
 * 配置管理模块
 * V0.1 2026-4-30
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
            hoverFiles: settings.get('term.hoverFiles', ["术语档案.md"]),
            titleLevel: settings.get('term.titleLevel', 2),
            hoverField: settings.get('term.hoverField', "摘要"),
            aliasField: settings.get('term.aliasField', "别称"),
            showFields: settings.get('term.showFields', []),
            fileRules: settings.get('term.fileRules', []),
            scanRange: settings.get('term.scanRange', 5)
        },
        // 字数统计设置
        wordCount: {
            enabled: settings.get('wordCount.enabled', true),
            excludeHeaders: settings.get('wordCount.excludeHeaders', true),
            excludeBlankLines: settings.get('wordCount.excludeBlankLines', true)
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