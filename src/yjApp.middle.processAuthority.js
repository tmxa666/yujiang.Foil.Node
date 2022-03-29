/**
 * @module yjApp_middle_processAuthority
 * @author mustapha.wang
 * @description
 * 中间件。拦截控制作业是否能执行的权限。
 */
var util=require("util");
var yjAuthority=require("./yjAuthority.js");
var url=require('url');
var yjLogin=require("./yjApp.middle.login.js");
var path=require("path");
var yjError=require('./yjError.js');
var yjMVC=require("./yjMVC.js");
var yjResourceErrors=require("./yjResource.errors.js");
function handleAuthorityError(req,res,errMsg){
	if(errMsg=="tokenInvalid."){
 			if (req.session){
				req.session.yjUser=null;
			}
			var yjCookie=yjRequire("yujiang.Foil","yjCookie.js");
			res.cookie(yjCookie.IDs.token,null, {
				maxAge : 0
			});
			// 没有配置登录页面时 到根目录
			var desUrl=yjGlobal.config.security.login_url?yjGlobal.config.security.login_url:"/";
			res.redirect(desUrl);
			return
	}
	if (req.headers && (req.headers['yujiang-from-app']==='true'||
	                    req.headers['yujiang-from-app']===true)){
		return res.json({
			success : false,
			message:errMsg
		});
	}
	if (req.xhr ||
	   (req.headers && (req.headers['yujiang-from-server']==='true'||
	                    req.headers['yujiang-from-server']===true))){
		//来自aja或webserver
		return res.json({
			success : false,
			message:errMsg
		});
	}
	yjMVC.render(req,res,
		path.join(__dirname,'yjNotAuthorized.ejs'), 
		{
			msg:errMsg
		}
	);
}
function authorityHandler(req, res, next) {	
	//不需要登录的作业不检查作业权限
	// console.log(req);
	if (yjLogin.isNotNeedLogin(req)){
		next();
		return;
	}
	//如果有登录，一定提供了正确的token，token被解析到req.session.yiUser
	//如果是临时的token，isTemp=true，就不检查了
	if (req.session.yjUser.isTemp==true){
		next();
		return;
	}
	var route=url.parse(req.url,true);
	var routePath = route.pathname.toLowerCase();


	yjAuthority.isUserCanRunProcess({
		userAID:req.session.yjUser.AID,
		processURL:routePath,
		success:function(isAuthorized){
			if (isAuthorized==true){
				next();
			}
			else{
				var userAID=req.session.yjUser.AID;
				var err=yjResourceErrors.newError('tm.err.foil.userNotAuthorized',userAID,routePath);
				var msg=err.message;
				handleAuthorityError(req,res,msg);
			}
		},
		error:function(err){
			handleAuthorityError(req,res,err.message);
			// return res.json({
			// 	success : false,
			// 	message:err.message
			// });
		}
	});
}
yjGlobal.app.use(authorityHandler);