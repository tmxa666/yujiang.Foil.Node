/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjMVC
 */
var yjGlobal = global.yjGlobal;
var methods = require("methods");
var path = require("path");
var yjMultiLang = require("./yjMultiLang.js");
var yjDiffieHellman = require("./yjDiffie-Hellman.js");
var yjCookie = require("./yjCookie.js");
var yjAuthority=require("./yjAuthority.js");
var yjMVC_cache=require("./yjMVC.cache.js");
var util=require("util");
var url = require("url");
var fs = require('fs');

/**
 * @module yjMVC
 * @description <pre>■只能在node.js环境下使用。</pre>
 * @example <pre>
 * var yjMVC=yjRequire("yujiang.Foil","yjMVC.js");
 * </pre>
 * @see nodejs::yjRequire
 */

/**
 * @description 渲染view
 * @param {request} req - 请求元件
 * @param {response} res - 响应元件
 * @param {string} view - view模板
 * @param {object} data - 数据
 * @returns {void}
 */     
function render(req, res, view, data) {
	if (req.session && req.session.yjUser && req.route){
		//获取用户对当前作业的权限（增删该查每个动作是否可执行）
		yjAuthority.getUserProcessAuthority({
			userAID:req.session.yjUser.AID,
			processURL:req.route.path,
			success:function(data){
				doRender(data);
			},
			error:function(err){
				proc_error(req,res,err);
			}
		});
	}
	else{
		doRender({});
	}

	function doRender(authority){
		try{
			//如果config没有配置好，yjMultiLang.getCurrentLCID可能会抛出异常
			var options={
				req : req,
				res : res,
				fileName : view,
				execName:path.basename(process.execPath),
				dir : path.dirname(view),
				global : yjGlobal,
				config : yjGlobal.config,
				session : req.session,
				cookie : yjCookie,
				authority:authority,
				data : data,
				publicKey : yjDiffieHellman.publicKey_pkcs8
			};
			//console.log(req.session);
			//如果有定义对语言的参数，才使用
			if (yjGlobal.config.locale){
				options.LCTag = yjMultiLang.getCurrentLCTag();
				options.LCID = yjMultiLang.getCurrentLCID();
				options.ml = function(DDKey, isToJson){
					return yjMultiLang.ml(DDKey,isToJson,options.LCID);
				};
			}
		}
		catch (err){
			proc_error(req,res,err);
			return;
		}
	
		res.render(view, {
			locals : options
		}, function(err, html) {
			if (err)
				proc_error(req, res, err);
			else {
				var content = html;
				//翻译多语言
				//content=yjMultiLang.replaceHtml(html);
				res.send(content);
				yjMVC_cache.write(req,html,
					function(data){
						
					},function(err){
						
					}
				);
			}
		});
	}
}

exports.render = render;



function proc_success(req, res, view, data) {
	if (view) {
		view=findCustomerPageView(req,view);
		render(req, res, view, data);
	} else {
        res.send(data);
	}
}
function findCustomerPageView(req,viewDir){
	var ops=yjGlobal.config.product.pageCustomizationSettings;
	if(ops&&ops.isAllowed&&ops.qureryParam&&ops.qureryParam.name){
		var queryParam=req.query[ops.qureryParam.name];
		var hasCustomerPage=false;
		var path=require("path");
		var arr=viewDir.split(path.sep);
			arr.splice(-1,0,queryParam);
		var customerPagePath=arr.join(path.sep);
		hasCustomerPage=fs.existsSync(customerPagePath);
	}
	if(hasCustomerPage){
		viewDir=customerPagePath;
	}	
	return viewDir;		
}
var proc_error=require("./yjError.js").sendError;
// var proc_error;

function rrnmv(method,req, res, next, model, view, isCheckAuthority) {
	loadData();	
	function loadData(){
		yjMVC_cache.read(req,res,
			function(data){
				//已经读到并发送
			},
			function(err){
				//没有读取到
				buildData();
			}
		);		
	}
	
	// catch有可能导致proc_error执行2次?
	function remoteCall(options) {
		var options0 = {
			data : req.body,
			params : req.params,
			query : req.query,
			success : function(data) {
				proc_success(req, res, view, data);
			},
			error : function(err,isLog) {
				proc_error(req, res, err,isLog);
			}
		};
		var merge = require("merge");
		var options2 = merge(options0, options);

		var yjBizService = require("./yjBizService.js");
		yjBizService[method](options2);
	}
	
	function buildData(){
		if (model) {
			if (model.match(/^(http)/)) {
				remoteCall({
					url : model
				});
			} else {
				var modelProc = require(model);
				if (typeof (modelProc) == "function") {
					var sender = {
						req : req,
						res : res,
						next : next,
						view : view,
						success : function(data) {
							//下面使用this.view，让modelProc函数在执行时，可以改变view(当发现view是空时，如yjTest.js)
							proc_success(req, res, sender.view, data);
						},
						error : function(err,isLog) {
							proc_error(req, res, err,isLog);
						},
						callback:function(err,data,isLogError){
							//提供两回调模式：callback与success+error模式
							//外界要重定向回调函数时，必须两种都定向(如yjUtils.hookCallback)，因此这两种原始回调不能互相调用，否则外界重定向的代码usercode会被执行两次。
							//callback2->usercode->callback->success2->usercode->success
							if (err){
								proc_error(req, res, err,isLogError);
							}
							else{
								proc_success(req, res, sender.view, data);
							}
						}
					};
					modelProc(sender);
				} else if (typeof modelProc == "object") {	
					if (JSON.stringify(modelProc)!="{}"){
						remoteCall(modelProc);
					}
					else{
						proc_success(req, res, view, null);
					}
				}
			}
		} else {
			proc_success(req, res, view, null);
		}
	}
}
/**
 * @description <pre>注册一个MVC路由，使用get方法调用REST服务。
 * 可以使用的method如下：
 * 'get',    'post',    'put',    'head',    'delete',    'options',    'trace',    'copy',
 * 'lock',    'mkcol',    'move',    'purge',    'propfind',    'proppatch',    'unlock',
 * 'report',    'mkactivity',    'checkout',    'merge',    'm-search',    'notify',
 * 'subscribe',    'unsubscribe',    'patch',    'search',    'connect'</pre>
 * @function get
 * @param {string} controller - 控制器（路由url）
 * @param {null|string|function} [model] - 模型
 * @param {null|string} [view] - view模板
 * @param {boolean} isCheckAuthority - 是否检查权限。如果未授权，就不能执行。
 * @returns {void}
 */

methods.forEach(function(method) {
	exports[method] = function(controller, model, view, isCheckAuthority) {
		if (isCheckAuthority==false){
			var yjLogin=require("./yjApp.middle.login.js");
			yjLogin.notNeedLogin_urls.push(controller);
		}
		yjGlobal.app[method](controller, function(req, res, next) {
			rrnmv(method,req, res, next, model, view, isCheckAuthority);
		});
	}
});

function mv(method,model, view, isCheckAuthority) {
	return function(req, res, next) {
		rrnmv(method,req, res, next, model, view, isCheckAuthority);
	}
}