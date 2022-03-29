/**
 * @fileOverview
 * @author mustapha.wang,2016/6/28
 * @description
 * 当把webserver和bizserver部署在同一个进程时，此模块模拟http，从express内部路由调用bizserver。
 * @deprecated
 * @see module:yjREST_engine_native
 */

/**
 * native引擎。WebServer和BizServer同一个进程部署时，内部模拟http调用。
 * @module yjREST_engine_native
 * @see module:yjREST
 * @example <pre>
 * var yjREST_native=yjRequire("yujiang.Foil","yjREST.engine.native.js");
 * </pre>
 * @see nodejs::yjRequire
 */
//throw new Error('native已经废止，请使用remote.superagent!');
var methods = require("methods");
var yjError = require("./yjError.js");
var restUtil= require("./yjREST.util.js");
var events  = require("events");
methods.forEach(function(method) {
	exports[method] = function(options) {
		/*	{ isNew: 'true',
			  userOID: '1',
			  project:
			   { OID: '-1',
			     OIDParent: '43',
			     AID: 'AID2323',
			     name: '',
			     description: '',
			     sortNumber: '1' },
			  _: '1464146962869' }
			  如果让restUtils.generateURL处理query（第二个参数为true），上面的资料会序列化为:
			  isNew=true&userOID=1&project[OID]=-1&project[OIDParent]=43&project[AID]=AID2323&project[name]=&project[description]=&project[sortNumber]=1
			 导致客户端mock response无法解析。
	    */
		//console.log(options);
		var surl = restUtil.generateURL(options,false);
		//console.log(surl);
		var url=require("url");
		var ourl=url.parse(surl);
		//console.log(ourl);
		
		var httpMocks = require('node-mocks-http');
		var req  = httpMocks.createRequest({
			url:ourl.pathname,
			method:method,
			query:options.query,
			body:options.data,
			headers:options.headers
		});
		//标记这个request是mock出来的，让yjApp执行时不要重新进入domain
		req.isMock=true;
		req.on("error",function(e){
			console.log("yjREST.engine.native:"+e.message);
		});	
		var EventEmitter = events.EventEmitter;
		var res=httpMocks.createResponse({
			eventEmitter: EventEmitter//,
			//req:req
			//writableStream: Stream.PassThrough
		});
		//to-do:还需要处理写流
		res.on("end",function(){
			//console.log("end..........");
			var data=res._getData();
			//console.log("data:"+JSON.stringify(data));
			//console.log(res.statusCode);
			//点击登录按钮时，为何得到302错误？？
			if (res.statusCode==-1||res.statusCode==200){
				yjError.handleResult(options,null,data);
			}
			else{				
				yjError.handleResult(options,new Error(data));
			}
		});
		
		var app=global.yjGlobal.app;
		//不要给done参数，只会在找不到路由时才触发；不设置done参数后，res的end事件会监测到错误
		//如何绕开domain？通过req.isDomain
		//不要直接使用process.domain.yjRequest，因为webserver可能独立主动使用yjBizService,不一定总是由browser-webserver按顺序发起，比如后台定时推送。
		//console.log(req);
		app.handle(req,res);
	}
});