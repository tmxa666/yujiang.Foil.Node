/**
 * @author mustapha.wang
 * @fileOverview
 * @see module:yjSMS
 */

/**
 * @module yjSMS
 * @description <pre>只能在node.js中使用。
 * 发送手机短信。
 * 注意：发送短信是调用移动公司的REST API，因此config中，需要配置biz_Connection.engine，如：
 * 文件：config.xxx.js
 * var config={
 *     ...
 *     biz_Connection:{
 *         engine:"remote.restify"
 *     },
 *     ...</pre>
 * @see yjSMS_mzkj
 * @example <pre>
 * var yjSMS=yjRequire("yujiang.Foil","yjSMS.js");
 * </pre>
 * @see nodejs::yjRequire
 */
module.exports = require("./yjSMS.mzkj.js");