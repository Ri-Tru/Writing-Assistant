/**
 * 日志管理器
 * 
 * - 日志分级输出
 * - 日志附加数据
 * - 日志控制开关
 * - 日志文件写入
 * 
 * 依赖：
 * - vscode           
 * 
 * 导出：
 * - debug(module, msg, data)
 * - info(module, msg, data)
 * - warn(module, msg, data)
 * - error(module, msg, data)
 */

// ========== 配置 ==========
// 生产环境设为 'Info'，开发调试时可改为 'Debug'
const LOG_LEVEL = process.env.LOG_LEVEL || 'Info';
const LEVELS = { Debug: 0, Info: 1, Warn: 2, Error: 3 };

/**
 * ──────────────────────────────────────────────
 * !!! 使用注意事项（关于 data 参数）
 * ──────────────────────────────────────────────
 * 
 * 1. 支持的数据类型：
 *    - 字符串、数字、布尔值、null、undefined
 *    - 普通对象（{ key: value }）和数组
 *    - 嵌套对象/数组（会被 JSON.stringify 序列化）
 * 
 * 2. 有限支持的数据类型：
 *    - Date 对象 → 转为 ISO 字符串（如 "2026-06-17T12:00:00.000Z"）
 *    - RegExp 对象 → 输出为 {}（丢失正则信息）
 *    - Error 对象 → 输出为 {}（丢失 message 和 stack）
 *    - 建议在传入前手动提取关键字段：
 *      ```javascript
 *      logger.error('Module', 'Failed', {
 *          file: filePath,
 *          message: err.message,
 *          stack: err.stack
 *      });
 *      ```
 * 
 * 3. 不支持的数据类型（会导致 JSON.stringify 报错）：
 *    - BigInt（会抛出 TypeError）
 *    - 函数（Function）（被忽略）
 *    - Symbol（被忽略）
 *    - 循环引用的对象（会抛出 TypeError）
 * 
 * 4. 性能建议：
 *    - 不要传入超大对象（如整个 Map 或长数组），只记录关键数据
 *    - 高频事件（如悬停）中的 debug 日志建议配合节流或采样使用
 * 
 * @param {number} level      - 日志级别 
 * @param {string} module     - 调用模块
 * @param {string} message    - 日志信息
 * @param {object} data       - 输出数据
 * @returns 
 */
function log(level, module, message, data) {
    // 日志级别判断
    if (LEVELS[level] < LEVELS[LOG_LEVEL]) return;

    // 格式化日志数据
    let log = `[${level}] [${module}] ${message}`;
    if (data) {
        // 把对象转成 key=value 格式，便于搜索
        const pairs = Object.entries(data)
            .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
            .join(' ');
        log += ` | ${pairs}`;
    }

    // 日志输出到控制台
    console[level.toLowerCase()]("[Writing Assistant] " + log);
}

// ========== 导出 ==========
module.exports = {
    debug: (module, msg, data) => log('Debug', module, msg, data),
    info:  (module, msg, data) => log('Info',  module, msg, data),
    warn:  (module, msg, data) => log('Warn',  module, msg, data),
    error: (module, msg, data) => log('Error', module, msg, data),
};