/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjDefaultService
 */

/**
 * 注册一些基本的服务。框架自己调用。用户不需要调用。
 * @private
 * @module yjDefaultService
 * @example <pre>
 * var yjDefaultService=yjRequire("yujiang.Foil","yjDefaultService.js");
 * </pre>
 * @see nodejs::yjRequire
*/

if (global.yjGlobal.config.homePage_url && global.yjGlobal.config.homePage_url!="/") {
	global.yjGlobal.app.get("/", function(req, res, next) {
		res.redirect(global.yjGlobal.config.homePage_url);
	});
}
else{
	yjGlobal.app.get("/", function(req, res, next) {
		var html="<ul><li>Node.js version : "+process.version+"</li>"+
				 "<li>Foil.Node version : v"+yjGlobal.version+"</li>"+
				 "<li>"+yjGlobal.config.product.name+" version : v"+yjGlobal.config.product.version+"</li></ul>"+
				 "&copy;"+yjGlobal.copyright+","+yjGlobal.designer.name;
		res.send(html);
	});
}

/**
 * @global
 * @namespace 系统监控
 */

 /**
 * @function
 * @memberof 系统监控
 * @name "get::/system.versions"
 * @description 获取系统的版本号
 * @return {object} 返回版本号
 */
yjGlobal.app.get("/system.versions", function(req, res, next) {
	var versions={
		"Node.js":process.version,
		"Foil.Node":"v"+yjGlobal.version
	}
	versions[yjGlobal.config.product.name]="v"+yjGlobal.config.product.version;
	res.send(versions);
});

/**
 * @function
 * @memberof 系统监控
 * @name "get::/system.monitor.api"
 * @description 获取系统的全部路由列表
 * @return {object} 返回路由列表
 */
var yjRoute = require("./yjRoute");
yjGlobal.app.get("/system.monitor.api", function(req, res, next) {
	var routes = yjRoute.getRoutes()
    ;
	res.send(routes);
});

/**
 * @function
 * @description 获取web socket(socket.io模组)的注册情况
 * @memberof 系统监控
 * @name "get:://system.monitor.socket"
 * @return {object} 返回web socket的注册情况
 */
var yjPusher=require("./yjPusher.js");
yjGlobal.app.get("/system.monitor.socket", function(req, res, next) {
	var data={};
	var servers=yjPusher.getSocketServers();
	for(var i=0;i<servers.length;i++){
		data[servers[i].tmType]=servers[i].sockets.adapter.rooms;
	}
	res.send(data);
});
/**
 * @function
 * @description 获取web socket(ws模组)的注册情况
 * @memberof 系统监控
 * @name "get:://system.monitor.socket.ws"
 * @return {object} 返回web socket的注册情况
 */
var yjPusherWS=require("./yjPusher.ws.js");
yjGlobal.app.get("/system.monitor.socket.ws", function(req, res, next) {
    var data={};
    var servers=yjPusherWS.getSocketServers();
    for(var i=0;i<servers.length;i++){        
        var dataServer={};
        data[servers[i].tmType]=dataServer;       
        var rooms=servers[i].tmRooms;
        for(var roomName in rooms){
            var room=rooms[roomName];
            var dataRoom=dataServer[roomName];
            if (!dataRoom){
                var dataSockets=[];
                dataRoom={
                    count:0,
                    sockets:dataSockets
                };                
                dataServer[roomName]=dataRoom;
            }
            else{
                var dataSockets=dataRoom.sockets;
            }
            var count=0;
            for (var socketUUID in room){
                count++;
                var socket=room[socketUUID];           
                dataSockets.push({
                    tmUUID:socket.tmUUID,
                    tmTime:socket.tmTime,
                    readyState:socket.readyState,
                    tmHeaders:socket.tmHeaders
                });
            }
            dataRoom.count=count;
        }
    }
    res.send(data);
});

var yjCache=require("./yjCache.js");
//文件上传服务
var yjError=require("./yjError");
/**
 * @global
 * @namespace 文件上传下载
 */
/**
 * @function
 * @memberof 文件上传下载
 * @description 上传文件
 * @name "post:://system.files.upload"
 * @return {object} 返回上传结果：<pre>
 *		{
 *			"fields":{},
 *			"files":{
 *				"school":[{
 *					"status":"success",
 *					"fileRawName":"85effd27f1700c06.jpg",
 * 					"key":"upload_a4f56d626f244be4ad90871cba05cd99.jpg"
 *				}]
 *			}
 *		}</pre>
 */
yjGlobal.app.post("/system.files.upload", function(req, res, next) {
	yjCache.upload(req,
		function(data){
			yjError.sendSuccess(req,res,data);
		},
		function(err,isLog){
			yjError.sendError(req,res,err,isLog);
		}
	);
});

/**
 * @function
 * @memberof 文件上传下载
 * @description 下载文件，采用params.key参数而不用query.key，这样图片右键另存时会显示文件名
 * @name "get:://system.files.download/:key
 * @params：key：fileID 如果要删除的文件位于默认目录的子目录下 例如：uploaded/test/a.txt 参数key: /test%2Fa.txt
 *  例如2： uploaded/test/test2/a.txt 参数key: /test%2Ftest2%2Fa.txt
 * 
 */
yjGlobal.app.get("/system.files.download/:key", function(req, res, next) {
	yjCache.download(req,res,
		function(data){},
		function(err,isLog){
			yjError.sendError(req, res, err,isLog);
		});
});

/**
 * @function
 * @memberof 文件上传下载
 * @description 删除文件
 * @name "delete:://system.files"
 * @params：key：fileID  如果要删除的文件位于默认目录的子目录下 例如1：uploaded/test/a.txt 参数key: /test%2Fa.txt
 *  例如2：  uploaded/test/test2/a.txt 参数key: /test%2Ftest2%2Fa.txt
 */
yjGlobal.app["delete"]("/system.files/:key", function(req, res, next) {
	yjCache["delete"](req,
		function(data){
			yjError.sendSuccess(req,res,data);
		},
		function(err,isLog){
			yjError.sendError(req,res,err,isLog);
		}
	);
});


/**
 * @function
 * @memberof 在默认目录下自定义一级目录 文件上传下载
 * @description 下载文件，采用params.key参数而不用query.key，这样图片右键另存时会显示文件名
 * @name "get:://system.files.download/:key/:dir
 * @params：key：fileID dir:子目录名称(默认目录的直接下级目录名称)
 * 例如：uploaded/test/a.txt  get:://system.files.download/a.txt/test
 */
yjGlobal.app.get("/system.files.download/:key/:dir", function(req, res, next) {
	yjCache.download(req,res,
		function(data){},
		function(err,isLog){
			yjError.sendError(req, res, err,isLog);
		});
});

/**
 * @function
 * @memberof 在默认目录下自定义一级目录 文件上传下载 
 * @description 删除文件
 * @name "delete:://system.files/:key/:dir"
 * @params：key：fileID,dir:子目录名称(默认目录的直接下级目录名称)
 *  例如：uploaded/test/a.txt  get:://system.files/a.txt/test
 */
yjGlobal.app["delete"]("/system.files/:key/:dir", function(req, res, next) {
	yjCache["delete"](req,
		function(data){
			yjError.sendSuccess(req,res,data);
		},
		function(err,isLog){
			yjError.sendError(req,res,err,isLog);
		}
	);
});
/**
 * @global
 * @namespace 手机短信
 */
/**
 * @function
 * @description 发送手机短信
 * @memberof 手机短信
 * @name "post:://system.sendSMS"
 * @param {string} req.body.msg 短信内容
 * @param {string} [req.body.signature=【弘讯软件】] 签名信息，会加到短信前面
 * @param {array} req.body.phones 要发送的手机号码
 */
yjGlobal.app.post("/system.sendSMS", function(req, res, next) {
	var yjSMS=require('./yjSMS.js');
	var options={
		msg:req.body.msg,
		signature:req.body.signature,
		phones:req.body.phones,
		success:function(data){
			yjError.sendSuccess(req,res,data);
		},
		error:function(err,isLog){
			yjError.sendError(req,res,err,isLog);
		}
	}
	yjSMS.send(options);
});


yjGlobal.app.get("/system.getLoginUsers", function(req, res, next) {
	var html=JSON.stringify(yjGlobal.onLineInfo)
	
	res.send(html);
});