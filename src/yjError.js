/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjError
 */

/**
 * 处理错误信息。
 * @module yjError
 * @example <pre>
 * var yjError=yjRequire("yujiang.Foil","yjError.js");
 * </pre>
 * @see nodejs::yjRequire
 */

/**
 * 记录错误到日志。
 * @param {Error} err 错误元件
 */
exports.logError=function(err){
	var yjLog=require("./yjLog.js");
	//sql 错误 为什么这里执行两次？？？
	// web+biz 同根部署时，sql错误会打印两次日志，一次是biz端错误信息 一次是web端错误信息
	console.log(err);
	yjLog.error(err);
}
/**
 * 发送错误信息。
 * @param {HTTPRequest} req http请求元件。
 * @param {HTTPResponse} res http响应元件。
 * @param {Error} err 错误元件
 * @param {bool} [isLog=true] 是否记录错误
 */
exports.sendError=function(req, res, err, isLog) {
	try{
		if (isLog!=false){
			err.url=req.url;
			exports.logError(err);
		}		
		// 在这里翻译可能会翻译2次,BizServer一次,webServer一次
		// 这里不适合翻译，因为有的字串是用模板拼出来的，应该先翻译模板，比如：Password is not correct for userAID %s.
	}
	catch(err2){
	    err=err2;
	}
  	if(err.code=="tm.err.foil.tokenInvalid"&& err.url.startsWith("/app")){
     	var loginUrl=yjGlobal.config.security.login_url;
      	res.redirect("/app/account/logout");
   	}else{
     	res.status(500).send(JSON.stringify({
          	code:err.code?err.code:err.name,
          	message:err.message
      	}));
   }
}
/**
 * 发送成功数据。
 * @param {HTTPRequest} req http请求元件。
 * @param {HTTResponse} res http响应元件。
 * @param {any} data 数据
 */
exports.sendSuccess=function(req, res, data) {
	try{
		res.send(data);
	}
	catch(err){
		
	}
}
/**
 * 处理REST调用失败。发给调用者或者记录日志。
 * @param {Error} err 错误元件。
 */
exports.handleError=function(err){
	if (process.domain){
		err.url=process.domain.yjRequest.url;
		exports.sendError(process.domain.yjRequest,process.domain.yjResponse,err);
	}
	else{
		exports.logError(err);
	}
}
/**
 * 处理REST调用成功后的事情。发给调用者。
 * @param {any} data 数据。
 */
exports.handleSuccess=function(data){
	if (process.domain){
		exports.sendSuccess(process.domain.yjRequest,process.domain.yjResponse,data);
	}
	else{
		console.warn("Node.Foil handleSuccess,no res to notify.");
	}
}
/**
 * 安全调用成功函数，会检查是否传入func，有传才会调用；并且拦截错误。
 * @param {function} func 函数。
 * @param {any} data 数据。
 */
exports.safeSuccess=function(func,data){

    if( typeof func == "function"){
    	try{
    		(func)(data);
    	}
        catch(err){
        	exports.handleError(err);
        }
    }
    else{
    	exports.handleSuccess(data);
    }
}
/**
 * 安全调用失败函数，会检查是否传入func，有传才会调用；并且拦截错误。
 * @param {function} func 函数。
 * @param {Error} err 数据。
 */
exports.safeError=function(func,err){
	if (typeof func == "function"){
		try{
			(func)(err);
		}
        catch(err){
        	exports.handleError(err);
        }
    }
    else{

    	exports.handleError(err);
    }
}

exports.safeCallback=function(func,err,data){
	if (err){
		exports.safeError(func,err);
	}
	else{
		exports.safeSuccess(function(data){
			func(null,data);
		},data);
	}
}

/**
 * 安全处理REST调用结果。
 * @param {object} sender 调用者。
 * @param {Error} err 错误元件。
 * @param {any} data 数据。
 */
exports.handleResult=function(sender,err,data){
	if (sender.callback){
		exports.safeCallback(sender.callback,err,data);
	}
	else{
		if (err) {
			exports.safeError(sender.error,err);
		} else {
			exports.safeSuccess(sender.success,data);
		}
	}
}