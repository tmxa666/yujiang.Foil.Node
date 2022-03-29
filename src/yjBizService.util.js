/**
 * @fileOverview
 * @author mustapha.wang,2019/9/23
 * @see module:yjBizService_util
 */

/**
 * @module yjBizService_util
 * @description 只能在node.js中使用。<br/>
 * @example <pre>
 * var yjBizService_util=yjRequire("yujiang.Foil","yjBizService.util.js");
 * </pre>
 * @see nodejs::yjRequire
 */

module.exports ={
	callService:function(method,options) {
		//需要把browser的全部header传递到bizserver去吗？包括：
		//user-agent,cookie,host,accept-encoding,accept-language,referer,accept,content-type,...
		//如果传了，在webserver后台的自己的header就写不进去，比如user-agent，browser是浏览器的版本信息，在webserver可能是superagent模组
		if (!options.headers){
			//需要把token放入header中传递给bizserver。
		    //如果bizserver的config.security.isNeedSession设为true，需要检查token。
		    //token是到bizserver的login时提供的，无论app或browser都一样，因此webserver传递到bizserver的token是可以用的。
		    //除非webserver自己生成了临时的token，使用的密钥与bizserver不一样。
			options.headers={};
		}
		//标记是来自我们的Server，如果token验证失败，不需要重定向
		options.headers['yujiang-from-server']=true;			
		var token=options.headers['x-access-token'];
		if (!token){
    		if (process.domain && process.domain.yjRequest){
    			//把token放入header中传递给bizserver
    			var yjLogin=require("./yjApp.middle.login.js");
    			token=yjLogin.extractToken(process.domain.yjRequest);
    			if (token){
    				options.headers['x-access-token']=token;
    			}
    		}
		}
		//把浏览器的语言，传递到bizserver，bizerver需要翻译
		if (process.domain && process.domain.yjRequest){
			var yjCookie=require("./yjCookie.js");
			var locale=process.domain.yjRequest.cookies[yjCookie.IDs.locale];
			//locale格式：{"LCTag":"zh-CN","LCID":"2052"}
			if (locale){
		        options.headers['tm-locale']=locale;
			}
			else{
				locale=process.domain.yjRequest.headers["accept-language"];
				//local格式：zh-CN,zh;q=0.9
				if (locale){
					options.headers['accept-language']=locale;
				}
			}
		}
		var caller=require("./yjREST.js");
		caller[method](options);
	}
}