/**
 * @author mustapha.wang
 * @fileOverview
 * <pre>只能在node.js中使用。
 * 通过REST协议调用REST Server提供的服务。</pre>
 * @see module:yjREST
 */

/**
 * @module yjREST
 * @description 通过REST协议调用REST Server提供的服务。<br/>
 * 与yjBizService不同的是：<ol>
 * <li>yjBizService的引擎由config.biz_Connection.engine决定，可以使用native，而yjREST的预设引擎是remote.restler，一般不需要特殊指定。</li>
 * <li>yjBizservice的根url由config.biz_Connection.connection.url决定。</li></ol>
 * <pre>使用以下任意一种方法来调用REST Server。
 *   'get',    'post',    'put',    'head',    'delete',    'options',    'trace',    'copy',
 *   'lock',    'mkcol',    'move',    'purge',    'propfind',    'proppatch',    'unlock',
 *   'report',    'mkactivity',    'checkout',    'merge',    'm-search',    'notify',
 *   'subscribe',    'unsubscribe',    'patch',    'search',    'connect'</pre>
 * @example <pre>
 * var yjREST=yjRequire("yujiang.Foil","yjREST.js");
 * </pre>
 * @see nodejs::yjRequire
 */

/**
 * @function
 * @name get
 * @description <pre>使用REST get方法调用REST Server。
 * options结构如下：
 * {
 *     url:"",                     //如：/biz
 *     params:[],                  //放在url的path上的参数值，如：["account","login"]
 *     query:{},                   //放在request的query属性上的值，即url的querystring上参数值
 *     data:{},                    //放在request的body属性上的参数值。注意：有的服务器环境比较严格，如果是get、delete、head，就不要传递data参数（即放在request的body上的参数）。
 *     headers:{},                 //放在request的headers属性上的值
 *     success:function(data){},   //成功后触发
 *     error:function(err){}       //失败后触发
 * }</pre>
 * @param {object} options - 参数
 * @return {undefined}
 */
/**
 * @function
 * @name post
 * @description <pre>使用REST post方法调用REST Server。
 * @param {object} options - 参数
 * @return {undefined}
 * @see nodejs:yjREST.get
 */
var methods = require("methods");
var yjError=require("./yjError.js");
methods.forEach(function(method) {
	exports[method] = function(options) {
		var engine=options.engine;
		if (!engine){
			engine="remote.restify";
		}
		var fileName="./yjREST.engine."+engine+".js";
		try{
			var caller = require(fileName);
		}
		catch(err){
			yjError.handleResult(options,new Error("load REST engine failed:"+fileName+"\r\n"+err.message));
			return;
		}
		
		caller[method](options);
	}
});