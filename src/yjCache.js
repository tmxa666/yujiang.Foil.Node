/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjCache
 */
/**
 * @module yjCache
 * @description 只能在node.js中使用。<br/>由config.cache配置使用哪个引擎：native,redis；预设是native，如：<pre>
 * 文件：config.xxx.js
 * var config={
 *     ...
 *     cache:{
 *	       engine:"native",			
 *	       connection:{
 *	           dir:"d:/temp"
 *	       },
 *	       isCacheView:false
 *	    },
 *      ...</pre>
 * @see module:yjCache_native
 * @example <pre>
 * var yjCache=yjRequire("yujiang.Foil","yjCache.js");
 * </pre>
 * @see nodejs::yjRequire
 */

module.exports=require("./yjCache."+global.yjGlobal.config.cache.engine+".js");