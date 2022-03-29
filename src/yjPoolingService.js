/**
 * @fileOverview
 * @author mico.wang
 * @see module:yjPoolingService
 */

/**
 * @module yjPoolingService
 * @description <pre>通过REST接口，使用以下任意一种方法来调用Pooling Server。
 *   'get',    'post',    'put',    'head',    'delete',    'options',    'trace',    'copy',
 *   'lock',    'mkcol',    'move',    'purge',    'propfind',    'proppatch',    'unlock',
 *   'report',    'mkactivity',    'checkout',    'merge',    'm-search',    'notify',
 *   'subscribe',    'unsubscribe',    'patch',    'search',    'connect'</pre>
 * @example <pre>
 * var yjPoolingService=yjRequire("yujiang.Foil","yjPoolingService.js");
 * </pre>
 * @see nodejs::yjRequire
 */

/**
 * @function
 * @name get
 * @description <pre>使用REST get方法调用Pooling Server。
 * options结构如下：
 * {
 *     url:"",                     //
 *     params:[],                  //放在url的path上的参数值
 *     query:{},                   //放在url的querystring上参数值
 *     data:{},                    //放在request的body上的参数值。注意：有的服务器环境比较严格，如果是get、delete、head，就不要传递data参数（即放在request的body上的参数）。
 *     success:function(data){},   //成功后触发
 *     error:function(err){}       //失败后触发
 * }</pre>
 * @param {object} options - 参数
 * @return {undefined}
 * @see yjBizService.get
 * @see yjREST.get
 */
var yjBizService_util=require("./yjBizService.util.js");
if (global.yjGlobal.config.pooling_Connection) {
	var methods = require("methods");
	methods.forEach(function(method) {
		exports[method] = function(options) {
			if (!options.url) {
				options.url = yjGlobal.config.pooling_Connection.connection.url;
			}
			if (!options.engine) {
				options.engine = yjGlobal.config.pooling_Connection.engine;
			}
			yjBizService_util.callService(method,options);
		}
	});
}