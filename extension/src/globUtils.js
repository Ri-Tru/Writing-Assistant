/**
 * 极简 Glob 匹配工具
 * V0.1 2026-4-30
 * 
 * 支持通配符 *（匹配任意不含路径分隔符的字符）和 **（匹配任意路径片段）。
 * 用于将文件规则中的 pattern 与工作区相对路径进行匹配。
 * 
 * 导出：
 * - simpleGlobMatch(filePath, pattern)  -> 返回 boolean
 */

/**
 * 测试文件路径是否符合给定的 Glob 模式
 * @param {string} filePath  - 文件路径（将统一转换为正斜杠）
 * @param {string} pattern   - Glob 模式，支持 * 和 **
 * @returns {boolean}
 */
function simpleGlobMatch(filePath, pattern) {
    // 统一将路径分隔符转换为正斜杠
    const normalizedPath = filePath.replace(/\\/g, '/');
    const normalizedPattern = pattern.replace(/\\/g, '/');

    // 将模式转为正则表达式
    let regexStr = normalizedPattern
        .replace(/\./g, '\\.')      // 转义点号
        .replace(/\*\*/g, '_____')  // 临时替换 **
        .replace(/\*/g, '[^/]*')    // * 匹配非分隔符字符
        .replace(/_____/g, '.*');   // ** 匹配任意字符（包括路径分隔符）

    const regex = new RegExp(`^${regexStr}$`);
    return regex.test(normalizedPath);
}

module.exports = { simpleGlobMatch };