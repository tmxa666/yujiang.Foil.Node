/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjREST_engine_remote_restify
*/

/**
 * restify引擎
 * @module yjREST_engine_remote_restify
 * @see module:yjREST
 * @example <pre>
 * var yjREST_restify=yjRequire("yujiang.Foil","yjREST.engine.remote.restify.js");
 * </pre>
 * @see nodejs::yjRequire
 */
var methods = require("methods");
var yjError=require("./yjError.js");
var restUtil=require("./yjREST.util.js");
methods.forEach(function(method) {
	exports[method] = function(options) {
		var url = restUtil.generateURL(options);
		var urlParser=require("url");
		var urlObject=urlParser.parse(url);
		var urlRoot=urlParser.format({
			protocol:urlObject.protocol,
			auth:urlObject.auth,
			host:urlObject.host
		});
		//console.log(urlRoot);
		var urlPath=url.substr(urlRoot.length,url.length-urlRoot.length);
		//console.log(urlPath);
		var restify = require('restify-clients');
		//rejectUnauthorized:false可以避免使用https时“self signed certificate”错误。
		var client = restify[options.isTextPlain==true?"createStringClient":"createJsonClient"]({
			  url: urlRoot,
			  version: '*',
			  headers:options.headers,
			  rejectUnauthorized:false
		});
		function done(err, req, res, data){
			client.close();
			if (err){
			    //restify按{code:xx,message:xxx}在解析错误，但是code没有code，赋值给了restCode，再给了name属性，为[code]+"Error"
			    //http://192.168.11.5:8080/browse/FOILNODE-321
			    if (err.restCode){
			        err.code=err.restCode;
			    }
			}
			yjError.handleResult(options,err,data);
		}
		
		if ((method=="get")||(method=="delete")||(method=="head")){
			//options.data不会丢，它会被序列化在urlPath上
			client[method](urlPath, done);
		}
		else{
			if (options.data){
				client[method](urlPath, options.data, done);
			}
			else{
				client[method](urlPath, {}, done);
			}			
		}		
	}
});