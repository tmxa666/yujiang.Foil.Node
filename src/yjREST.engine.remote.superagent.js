/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjREST_engine_remote_superagent
*/

/**
 * superagent引擎
 * @module yjREST_engine_remote_superagent
 * @see module:yjREST
 * @example <pre>
 * var yjREST_super=yjRequire("yujiang.Foil","yjREST.engine.remote.superagent.js");
 * </pre>
 * @see nodejs::yjRequire
 */
var methods = require("methods");
var yjError=require("./yjError.js");
var restUtil=require("./yjREST.util.js");
methods.forEach(function(method) {
	exports[method] = function(options) {	
		var url = restUtil.generateURL(options);
		var superagent = require("superagent");
			if(method=="delete"){
				method="del";
			}
		var call = superagent[method](url);

		if (options.headers){
			call.set(options.headers);
		}
		if (options.cert){
			call.cert(options.cert);
		}
		if (options.key){
			call.key(options.key);
		}
		var yjDH=require("./yjDiffie-Hellman.js");
		//避免访问https时的错误： self signed certificate
        //call.key(yjDH.privateKey_pkcs1);
        //call.cert(yjDH.certificate);
        //call.set("rejectUnauthorized","false");//没有这个参数       
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
		if ((method=="post")||(method=="put")){
			call.send(options.data);
		}
		call.end(function(err, res) {
			if (err){
			    //err.message只能得到：Internal Server Error
				if (res && res.error){
				    //res.error.text才是真正错误信息
					err.message=res.error.text;
					try{
					    //yjError.js送到客户端的错误信息是{code:xxx,message:xxx}
					    var err2=JSON.parse(res.error.text);
					    err.code=err2.code;
					    err.message=err2.message;
					}
					catch(e){
					}
				}
				yjError.handleResult(options,err);
			}
			else{
			    //如果options.isTextPlain==true，返回的可能是“text/xml”格式，直接使用res.text原始数据。
				if (res.ok){
					if(options.requireRes){
						yjError.handleResult(options,null, res);
					}else{
						yjError.handleResult(options,null, options.isTextPlain==true?res.text:res.body);	
					}
				}
				else{
					yjError.handleResult(options,new Error(res.text));
				}
			}			
		});
	}
});