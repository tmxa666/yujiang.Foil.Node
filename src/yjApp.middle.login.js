/**
 * @module yjApp_middle_login
 * @author mustapha.wang
 * @description
 * 中间件。检测是否用token登录过，并把token内容解析到req.session.yjUser上。
 * @example <pre>
 * var yjLogin=yjRequire("yujiang.Foil","yjApp.middle.login.js");
 * </pre>
 */

var g_notNeedLogin_urls=[];

/**
 * @description 不需要登录的url列表
 * @type {array}
 */
module.exports.notNeedLogin_urls=g_notNeedLogin_urls;

var url=require('url');
var yjError=require('./yjError.js');
var jwt = require('jsonwebtoken');
var util=require("util");
var yjCookie=require("./yjCookie.js");
var yjResourceErrors = require("./yjResource.errors.js");
var path=require("path");
var secret = 'techmation:taiwan1984ningbo2001shanghai2004xian2012';

/**
 * @description 生成一个access_token
 * @param {object} payload 用来生成token的内容
 * @param {object} [options] 其它参数
 * @param {string} [options.expiresIn='8h'] 过期时间，如:8h,60s
 */
module.exports.getToken=function(payload,options) {
	/**
	 * 8小时后token过期，jwt.verify时会检查到 8h
	 */
	// var ops=util._extend({expiresIn:'8h'},options);
	var ops=util._extend({expiresIn:'8h'},options);
	var token = jwt.sign(payload, secret, ops);
	return token;
}

/**
 * @description 生成一个refresh_token
 * @param {object} payload 用来生成token的内容
 * @param {object} [options] 其它参数
 * @param {string} [options.expiresIn='30d'] 过期时间，如:8h,60s
 */
module.exports.getRefreshToken=function(payload,options) {
    /**
     * 30天后token过期，jwt.verify时会检查到 30d
     */
    var ops=util._extend({expiresIn:'30d'},options);
    var token = jwt.sign(payload, secret, ops);
    return token;
}

/**
 * @description 
 * <pre>生成一个临时token，有效期60秒。
 * 当在webserver中主动去调用BizServer时（如timer中），没有domain也没有浏览器传递来的token，因此需要生成一个临时的。
 * 但是，如果webserver和bizserver的密钥不一样，bizserver会不认这个token。
 * 这时候，需要调用bizserver的/biz/account/login获取token，然后在调用bizserver时，把这个token放在这几个地方都可以：
 * .req.query.access_token
 * .req.body.access_token
 * .req.headers['x-access-token']</pre>
 * @return {string} 返回的token
 */
module.exports.getTempToken=function() {
	//临时的token，60秒过期
	var ops={expiresIn:'30d'};
	var token = jwt.sign({isTemp:true}, secret, ops);
	return token;
}
/**
 * @description 判断请求是否需要登录。
 * @param {object} req HTTPRequest
 * @return {boolean} 可以登录返回true，否则返回false
 */
module.exports.isNotNeedLogin=function(req) {
	var route=url.parse(req.url,true);
	var routePath = route.pathname.toLowerCase();
    //console.log('routePath:'+routePath);
    //console.log('indexOf:'+g_notNeedLogin_urls.indexOf(routePath));
	//注意改善效率：用数组indexOf效率很差
    return ((yjGlobal.config.security && yjGlobal.config.security.login_url && 
		     yjGlobal.config.security.login_url.toLowerCase()==routePath) || 			 
		    (g_notNeedLogin_urls.indexOf(routePath) >= 0));
}

/**
 * @description 从req元件中提取token
 * @param {object} req HTTPRequest
 * @return {string} 返回的token
 */
module.exports.extractToken=function(req){
    // console.log(req.headers);
    var token = (req.body && req.body.access_token) || 
                (req.query && req.query.access_token) || 
                (req.headers && req.headers['x-access-token']) || 
                (req.cookies && req.cookies[yjCookie.IDs.token]);
    return token;
}

module.exports.verifyToken=function(token,callback) {
    jwt.verify(token, secret, callback);
}

module.exports.handleTokenError=function(req,res,err,isRefreshToken){
    if (err.constructor.name=='TokenExpiredError'){
		err.code="tm.err.foil.accessTokenExpired";
    }
	if (req.headers && (req.headers['yujiang-from-app']==='true'||
	                    req.headers['yujiang-from-app']===true)){
        //来自app，无法重定向，返回错误信息
        // console.log(req.url);
        // console.log(req.query);
        // console.log(req.body);
        yjError.sendSuccess(req,res,{status:0,errmessage:"token过期",code:err.code});
        return;
    }
    if  (req.xhr || !yjGlobal.config.security.login_url || 
		(req.headers && (req.headers['yujiang-from-server']==='true' ||
		                 req.headers['yujiang-from-server']===true))){
		//来自jquery.ajax，或者来自webserver服务器(在BizServer里)，无法重定向，返回错误信息
	    //ajax会再来刷新token
        yjError.sendError(req,res,err,true);
    }else{
        //来自浏览器地址栏，重定向到登录页面      
        //
        var urlObject = url.parse(yjGlobal.config.security.login_url, true);
        //console.log(req.url);             
        urlObject.query["rawUrl"] = req.url;
        var newurl = url.format(urlObject);
        //console.log(err.constructor.name);
        if (isRefreshToken==false && (err.constructor.name=='TokenExpiredError')){
            //让客户端用refresh-token刷新access-token
            res.render(path.join(__dirname,'yjRefreshToken.ejs'), {
                locals : {
                    cookie:{
                        IDs:yjCookie.IDs
                    },
                    raw_url:req.url,
                    login_url:newurl
                }
            }, function(err, html) {
                if (err)
                    yjError.sendError(req, res, err);
                else {
                    yjError.sendSuccess(req,res,html);
                }
            });
        }
        else {
            res.redirect(newurl);
        }
    }
}
module.exports.handleBeyondLoginAuthority=function(req,res,err,isRefreshToken){
        var urlObject = url.parse(yjGlobal.config.security.login_url, true);
        urlObject.query["rawUrl"] = req.url;
        var newurl = url.format(urlObject);
        
        //让客户端用refresh-token刷新access-token
        res.render(path.join(__dirname,'yjClearCookies.ejs'), {
            locals : {
                cookie:{
                    IDs:yjCookie.IDs
                },
                raw_url:req.url,
                login_url:newurl
            }
        }, function(err, html) {

            if (err){
                yjError.sendError(req, res, err);
            }
            else {
                yjError.sendSuccess(req,res,html);
            }
        });
  
}

if (yjGlobal.config.security && yjGlobal.config.security.isNeedSession==true) {
	function tokenHandler(req, res, next) {
		// console.log('method.1:'+req.method);
		// console.log('url.1:'+req.url);
		// console.log(req.session);
		// console.log(req.cookies);
		// console.log(req.headers);

	    //先得到token，如果token合法，如果是登录界面，表示已经登录过了，就跳转到首页
		var token =	module.exports.extractToken(req);
		//console.log('url2:'+req.url);
		//console.log('token:'+token);
		//console.log('token length:'+token.length);
		//注意：可能读出的是字串'undefined'
		//

		if (!token || token=="undefined"){
			handleError(yjResourceErrors.newError('tm.err.foil.tokenNotProvided'));
		}
		else {
			// 验证token，如果密钥不对，篡改内容，过期都会失败
			// 不需要登录的页面也需要拿到token中的账号去访问资源
			jwt.verify(token, secret, function(err, decoded) {
				if (err) {
				    //console.log(err);
					//console.log(err.name);
					//console.log(err.number);
					handleError(err);
				} else {
					if(!decoded.isTemp){
						// token 不是临时token 检查token是否需要拦截
						// singleLoginRestriction  true 表示启用单点登录限制  
						if(decoded.singleLoginRestriction){
							if(!yjGlobal.accessTokenWhiteList[token]){
								// AccessToken 不在白名单里 拦截访问
								// console.log("AccessToken 不在白名单里 拦截访问11111");
							  	var err0=yjResourceErrors.newError('tm.err.foil.tokenInvalid');
								handleError(err0);		
								return;
							}
						}
					}

					// console.log(yjGlobal.accessTokenWhiteList);
					// console.log("每次都要验证 access_token");
					// console.log(decoded);
					// console.log(decoded);
					//为了兼容旧的express-session模块，把token解析结果放到req.session上，但是注意req.sessionID已经没有了。
					if (!req.session){
						req.session={};
					}
					req.session.yjUser=decoded;
	 				var ancestorOrgOID=decoded.ancestorOrgOID
	 				var keyTemp="org_"+ancestorOrgOID;
	 				// 同时在线限定
 					var route1=url.parse(req.url,true);
 					if(route1.path!="/app/account/logout"){
 						if(ancestorOrgOID&&yjGlobal.onLineInfo){
		 					var onLineInfo=yjGlobal.onLineInfo;
		 					var authorized;
		 					if(onLineInfo[keyTemp]){
								if(!onLineInfo[keyTemp]){
									authorized=true;
								}else{
									if( onLineInfo[keyTemp][decoded.AID] ||onLineInfo[keyTemp].onLineCount<onLineInfo[keyTemp].authorityCount){
										authorized=true;
									}else{
										authorized=false;
									}
								}
								if(!authorized){

									var err0=yjResourceErrors.newError('tm.err.foil.beyondLoginAuthority');
									module.exports.handleBeyondLoginAuthority(req,res,err0,false);		
									return;
								}
		 					}
		 				}
 					}

	
					if (yjGlobal.config.security && yjGlobal.config.security.login_url){
						var route=url.parse(req.url,true);
						var routePath = route.pathname.toLowerCase();
						//如果是登录页面，表示已经登录了，跳转到首页，比在前台跳转好，前台跳转是显示出来了登录界面后再跳转
						//console.log('routePath:'+routePath);
						//console.log('login_url:'+yjGlobal.config.security.login_url);
						if (yjGlobal.config.security.login_url.toLowerCase()==routePath){
							var newUrl=route.query["rawUrl"];
							if (!newUrl){
								if (yjGlobal.config.homePage_url){
									newUrl=yjGlobal.config.homePage_url;
								}
								else{
									newUrl="/";
								}
							}
							res.redirect(newUrl);
						}
						else{							
							next();
						}
					}
					else{
						next();
					}		        					
				}
			});
		}
		
		function handleError(err){
		    if (module.exports.isNotNeedLogin(req)) {
		    	next();
		    	return;
			}
		    module.exports.handleTokenError(req,res,err,false);
		}
	}
	yjGlobal.app.use(tokenHandler);
}