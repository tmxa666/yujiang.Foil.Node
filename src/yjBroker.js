/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjBroker
 */

/**
 * @description
 * <pre>中介对象。
 * 把对WebServer的REST调用，不通过WebServer的Model处理，直接传递到BizServer去处理。
 * 因为大部分逻辑都在BizServer中，有时候WebServer的Model不需要特别处理，因此没有必要再写一个Model。</pre>
 * NodeFoil.WebServer提供了2个中介服务：<ul>
 * <li>get /app/system/broker/getFromBiz</li>
 * <li>post /app/system/broker/post2Biz</li></ul>
 * <pre>
 * 假设BizServer有一个服务（返回销售前额10名的产品）:get /biz/sale/getTop10
 * 在browser中可以这样直接调用：
 * $.ajax({
 *     method:"get",
 *     url:"/app/system/broker/getFromBiz",
 *     async:true,
 *     data:{
 *         data:{a:"a",b:"b"},
 *         bizURLParams:["sale","getTop10"]
 *     },			
 *     success:function(data, textStatus){												
 *     },
 *     error:function(XMLHttpRequest, textStatus, errorThrown){				
 *         yjMessager.showDialog("Fail",textStatus+"\r\n"+XMLHttpRequest.responseText);
 *     }
 * });</pre>
 * @example <pre>
 * var yjBroker=yjRequire("yujiang.Foil","yjBroker.js");
 * </pre>
 * @see nodejs::yjRequire
 * @exports yjBroker
 * @param {object} sender model的调用者
 * @param {object} options 参数
 * @param {any} options.params url后缀path参数
 * @param {string} options.method 方法名称，如:get,post
 * @example <pre>module.exports = function(sender){
 *     var broker = global.yjRequire("yujiang.Foil", "yjBroker.js");
 *     var params=sender.req.query.bizURLParams;
 *     if (sender.req.query.data){
 *         sender.req.query=sender.req.query.data;
 *     }
 *     broker(sender, {
 *         method : "get",
 *         params : params
 *     });
 * }</pre>
 */
module.exports = function(sender, options) {
	var yjBizService = require("./yjBizService.js");
	var options2 = {
		data : sender.req.body,
		params : options.params,
		query : sender.req.query,
		success : sender.success,
		error : sender.error
	};
	if ((options.method == "post") | (options.method == "put")) {
		if (!options2.data) {
			options2.data = {};
		}
	}
	yjBizService[options.method](options2);
}