/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjBizService
 */

/**
 * @module yjBizService
 * @description 只能在node.js中使用。<br/>
 * <pre>通过REST接口，使用以下任意一种方法来调用BizServer。
 *   'get',    'post',    'put',    'head',    'delete',    'options',    'trace',    'copy',
 *   'lock',    'mkcol',    'move',    'purge',    'propfind',    'proppatch',    'unlock',
 *   'report',    'mkactivity',    'checkout',    'merge',    'm-search',    'notify',
 *   'subscribe',    'unsubscribe',    'patch',    'search',    'connect'</pre>
 * 与yjREST不同的是：<ol>
 * <li>yjBizService的引擎由config.biz_Connection.engine决定，可以使用native，yjREST的预设引擎是remote.restify，一般不需要特殊指定。如：<pre>
 * 文件：config.xxx.js
 * var config={
 *     ...
 *     biz_Connections:{
 *         engine:"native",
 *         connection:{
 *             url : "http://localhost:3000/Biz"
 *         }
 *     },
 *     ...</pre></li>  
 * <li>yjBizservice的根url由config.biz_Connection.connection.url决定。</li></ol>
 * @example <pre>
 * var yjBizService=yjRequire("yujiang.Foil","yjBizService.js");
 * </pre>
 * @see nodejs::yjRequire
 */

/**
 * @function get
 * @description <pre>使用REST get方法调用BizServer。
 * options结构如下：
 * {
 *     engine:"",                  //发起REST调用的引擎模组，如：remote.restify,remot.superagent。预设值：remote.restify
 *     url:"",                     //预设值：config中的biz_Connection.connection.url，如：http://localhost:3000/biz
 *     params:[],                  //拼接url的path值，如['order','saveOrder']，最后得到的路径是：http://localhost:300/biz/order/saveOrder
 *     headers:[],                 //http的headers
 *     query:{},                   //放在url的querystring上参数值
 *     data:{},                    //放在request的body上的参数值。注意：有的服务器环境比较严格，如果是get、delete、head，就不要传递data参数（即放在request的body上的参数）。
 *     success:function(data){},   //成功后触发
 *     error:function(err){}       //失败后触发
 * }</pre>
 * @param {object} options - 参数
 * @return {void}
 * @see yjREST.get
 */
/**
 * @function
 * @name post
 * @description <pre>webserver中使用REST方法调用BizServer。
 * @param {object} options - 参数
 * @return {void}
 * @see yjBizServer.get
 */
//注意：BizServer端也可能引用了这个文件，但是没有使用其中的方法。
var methods = require("methods");
var yjBizService_util=require("./yjBizService.util.js");


if (global.yjGlobal.config.biz_Connection) {	
	methods.forEach(function(method) {
		exports[method] = function(options) {
			if (!options.url) {
				options.url = yjGlobal.config.biz_Connection.connection.url;
			}
			if (!options.engine) {
				options.engine = yjGlobal.config.biz_Connection.engine;
			}
			yjBizService_util.callService(method,options);
		}
	});
}