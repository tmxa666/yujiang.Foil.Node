/**
 * @author mustapha.wang
 * @fileOverview
 * @see module:yjREST_util
*/
var yjError=require("./yjError.js");
/**
 * @exports yjREST_util
 * @example <pre>
 * var yjREST_util=yjRequire("yujiang.Foil","yjREST.util.js");
 * </pre>
 * @see nodejs::yjRequire
 */
module.exports={
	/**
	 * @description <pre>生成url。
	 * options结构如下：
     * {
     *     url:"",
     *     params:[],
     *     query:{}, 
     *     success:function(data){},
     *     error:function(err){}
     * }</pre>
     * @param {object} options - 参数
     * @param {boolean} [isIncludeQuery=true] 是否包含Query部分
     * @return {undefined}
	 */
	generateURL:function(options,isIncludeQuery){
		var url=options.url;
		if (!url) {
			yjError.handleResult(options,new Error("options.url is empty!"));
		}
		if (options.params) {
			if (url[url.length - 1] != "/"){
				url = url + "/";
			}
			
			for ( var i = 0; i < options.params.length; i++)
				url = url + encodeURIComponent(options.params[i]) + "/";
			delete options.params;
		}
		if (url[url.length - 1] == "/"){
			url=url.substr(0,url.length - 1);
		}
		if (isIncludeQuery!=false && options.query){
			//注意：nodejs自带的querystring.stringify不能序列化嵌套的object类型的值，需要用qs(自己安装)，如：
			//userAID=Admin&project.OID=1&project.AID=AID
			var qs=require("qs");
			url=url+"?"+qs.stringify(options.query);
			delete options.query;
		}
		return url;
	}
}