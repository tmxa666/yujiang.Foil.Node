/**
 * @module yjApp_middle_domain
 * @author mustapha.wang
 * @description
 * 设置一个中间件，让任何地方都可以通过process.domain.yjRequest访问,多语言需要从req读取LCID，
 * 如果domain或uncaughtException不拦截错误，遇到这些错误，程序就崩溃退出了
 */	
var domain = require("domain");
var yjError= require("./yjError.js");
function domainHandler(req, res, next) {
	if (req.isMock==true){
		//如果biz/web部署在同一个进程，使用node-mocks-http元件，实际没有通过socket通讯，
		//那么从webserver向bizserver的调用就不要进入domain
		next();
		return;
	}
	var d = domain.create();
	res.on("timeout",function(){
		var msg="Node.Foil domain catched 'timeout'."+req.url;
		console.error(msg);
	});
	d.add(req);
	d.add(res);
	d.yjRequest = req;
	d.yjResponse = res;
	d.on("error",function(err){
		//WriteStream.write错误会被拦截到，如果文件不存在
	    console.error("Node.Foil domain error:"+d.yjRequest.url);
		console.error("Node Foil domain error:"+err.stack);	
		//console.log(err.domainEmitter._writableState);
		//console.log(d.yjResponse.socket);
		//console.log(d.yjResponse);
		if (d.yjResponse.finished!=true){
			//这里不能发送，可能多次向客户端发送
			yjError.sendError(d.yjRequest,d.yjResponse,err);
		}
	});
	d.run(next);
}
global.yjGlobal.app.use(domainHandler);