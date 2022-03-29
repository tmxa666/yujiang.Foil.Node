/**
 * @fileOverview
 * @see module:yjApp
 * @author mustapha.wang
 */
/**
 * @module yjApp
 * @description nodeFoil框架运行入口点。
 * @example <ul>
 * <li>命令行:node yjApp.js config.wxh.js</li>
 * <li>命令行:node start.wxh.js<br/></li></ul>
 * start.wxh.js内容：<pre>
 * var init=require("../yujiang.Foil.Node/src/yjApp.init.js");
 * var path=require("path");
 * init.setConfigFile(path.join(__dirname,"./config.wxh.js"));
 * require("../yujiang.Foil.Node/src/yjApp.js");
 * </pre>
 */

/**
 * @global
 * @function nodejs::yjStatic
 * @description 注册一个静态文件目录。这个目录下的文件，如:js，css，png...可以在网页中下载。
 * @param {string} dir 目录
 */

console.log("☺node.js version : "+process.version);
console.log("©"+yjGlobal.copyright+","+yjGlobal.designer.name);
var path = require('path');
var util = require("util");
var yjApp_init=require("./yjApp.init.js");
var async=require("async");
var qs=require("qs");
var url = require('url');
var events = require('events');

//设置监听后事件，让mocha等单元测试程序有正确时间点
var g_afterListen=null;
module.exports=function(afterListen){
	g_afterListen=afterListen;
}

function run(options) {
	var yjLog = require("./yjLog.js");

	console.log("Node.Foil® version : v"+yjGlobal.version);
	if (options.product){
		console.log(options.product.name+"® version : v"+options.product.version);
	}

	if (configFile){
		console.log("config file : "+configFile);
	}
	else{
		console.log("config file : (none)");
	}

	var express = require('express');
	var app = express();
	// 设置全局变量
	global.yjGlobal.app = app;

	// 配置端口参数
	app.set('port', options.port);
	app.set('port_https', options.port_https);
	if (options.isNeedView==true) {
		//在百度BAE中，预设路径是home/base/app，必须设置为“/"，否则layout()在引用时会加上预设路径
		app.set('views','/');
		//app.set('views',layoutDir);
		//app.set('views',["/",layoutDir]); //express 4.x
		app.set('view engine', 'ejs');
		var engine = require('ejs-locals');
		app.engine('ejs', engine);
	}
    /*app.use(function(req,res,next){
		//console.log(req.body);
		console.log(process.pid+":"+req.url);
		next();
	});*/
	app.set('query parser', function (str) {
	    //expree对url上params解析是用qs模组，qs对数组长度限制是20，超过20就解析为key-value的object
	    return qs.parse(str, {arrayLimit: 1000});
	});
    if (options.security && options.security.isAllowCrossDomain==true){
        //必须放在最前面，因为如果request解析出错时，也能带上header，如post时资料量太大错误
        require("./yjApp.middle.crossDomain.js");
    }
	var bodyParser = require('body-parser');
	//为了解析application/json
	var jsonOp=null;
	if (options.security && options.security.bodyParser){
	    jsonOp=options.security.bodyParser.urlencoded;
	}
	app.use(bodyParser.json(jsonOp));
	//为了解析application/x-www-form-urlencoded
	var urlOp={extended: true};
	if (options.security && options.security.bodyParser){
	    urlOp=Object.assign(options.security.bodyParser.urlencoded,urlOp);
	}
	app.use(bodyParser.urlencoded(urlOp));
	//var multer  = require('multer');
	//为了解析multipart/form-data
	//app.use(multer({ dest: 'uploads/'}));
	//为了解析text/xml和application/xml和application/rss+xml
	require('body-parser-xml')(bodyParser);
	app.use(bodyParser.xml({
	    limit: '1MB',
	    xmlParseOptions: {
	        normalize: true,
	        normalizeTags: true,
	        explicitArray: false
	    }
	}));

	var cookieParser = require("cookie-parser");
	app.use(cookieParser('yujiang'));

	if (options.product && options.product.favIcon) {
		var favicon = require('serve-favicon');
		app.use(favicon(options.product.favIcon));
	}
	// 设置开发模式
	app.set('env', options.product.env);
	var yjError=require("./yjError.js");
	require("./yjApp.middle.error.js");

	require("./yjApp.middle.domain.js");

	//启用html的gzip压缩
	var compression = require('compression');
	app.use(compression());

	global.yjStatic=function(dir){
		app.use(express.static(dir));
	}
	// 设置静态资源文件的路径
	if (options.staticDirs) {
		for ( var i = 0; i < options.staticDirs.length; i++) {
			app.use(express.static(options.staticDirs[i],{index:'index.html'}));
		}
	}
	if (options.isNeedView==true){
	    require("./yjApp.middle.theme.js");
	}
	require("./yjApp.middle.locale.js");
	var yjLogin=require("./yjApp.middle.login.js");
	if (options.security &&
	    options.security.isNeedSession==true &&
	    options.security.isCheckProcessAuthority==true){
	    require("./yjApp.middle.processAuthority.js");
	}

	require("./yjApp.middle.logReqFootprint.js");
	// 载入自启动程序（按目录排序）
	var yjDirectory = require("./yjDirectory.js");
	if (options.autoRunDirs) {
		for ( var i = 0; i < options.autoRunDirs.length; i++) {
			yjDirectory.scanFiles(options.autoRunDirs[i], {
				isSort : true,
				foundFile : function(file) {
					var ext = path.extname(file);
					if (ext && ext.toLowerCase() == ".js")
						require(file);
				}
			});
		}
	}

	// 扫描路由，建立路由表，并执行自动执行*.{autorun}.js文件
	var yjRoute = require("./yjRoute.js");
	if (options.routeDirs) {
		for ( var i = 0; i < options.routeDirs.length; i++) {
			yjRoute.scanRoute(options.routeDirs[i]);
		}
	}
	console.log('layer : '+JSON.stringify(yjGlobal.layer));
	// 加载预设的一些路由
	require("./yjDefaultService.js");
	//https://github.com/elad/node-cluster-socket.io
	var cluster=undefined;
	if (options.cluster && options.cluster.open==true){
	    cluster=require('cluster');
	}

	function doLogMessage(msg){
		var head="";
		if (cluster && !cluster.isMaster){
			head='worker'+(process.tmWorkerID?process.tmWorkerID.toString():'')+' pid:'+process.pid+', '+head;
		}
		console.log((head?head+' ':'')+msg);
	}
	// doLogMessage('init tasks......start');
	//执行初始化任务，不用waterfall，防止上一部传递了参数到下一步，下一步的不知道如何调用callback
	async.series(
		yjApp_init.tasks,
		function(err,data){
			if (err){
				throw err;
			}
			else{
				// doLogMessage('init tasks......end');
				//全部转小写，比较时不区分大小写
				if (yjGlobal.config.security &&
					yjGlobal.config.security.notNeedLogin_urls) {
					for ( var i = 0; i < yjGlobal.config.security.notNeedLogin_urls.length; i++)
						yjLogin.notNeedLogin_urls.push(yjGlobal.config.security.notNeedLogin_urls[i]);
				}
				for(var i=0;i<yjLogin.notNeedLogin_urls.length;i++){
					yjLogin.notNeedLogin_urls[i]=yjLogin.notNeedLogin_urls[i].toLowerCase();
				}
				// 开始监听
				var async=require('async');
				async.series([function(cb){
					// 创建服务器,服务器自动推送时需要
					if (yjGlobal.config.potocols.indexOf('http')>=0){
						var http = require('http');
						var server = http.createServer(app);
						 // server.on('request', app);
						global.yjGlobal.server = server;
						var port=app.get('port');
						//如果外部使用pm2模块来启动多进程，会有冲突，如:pm2 start start.biz+web.wxh.js -i 5
						if (cluster && !cluster.isMaster){
							port=0;
						}
						server.listen(port, function() {
							doLogMessage('REST server listening on http '+server.address().address + ":" + server.address().port);
							if (cluster && !cluster.isMaster){
								//告诉master，开始监听了
								process.send({msg:'worker-listen',type:'http'});
							}
							cb(null);
						});
					}
					else{
						cb(null);
					}
				},function(cb){
					if (yjGlobal.config.potocols.indexOf('https')>=0){
						var https = require('https');
						//zcl 添加通过config里面的CA 认证配置启动服务
						//如果配置了CA证书路径，则通过CA证书启动https服务
						//否则通过自签名启动https服务
						var server_https;
						if(yjGlobal.config.security.ca&&yjGlobal.config.security.ca.keyPath
							&&yjGlobal.config.security.ca.certPath){
							var fs=require('fs');
							server_https=https.createServer({
								key:fs.readFileSync(yjGlobal.config.security.ca.keyPath),
								cert:fs.readFileSync(yjGlobal.config.security.ca.certPath)
							},app);
						}else{
							doLogMessage('https init yjDiffie tasks...');

							var yjDH=require("./yjDiffie-Hellman.js");
							server_https=https.createServer({
								key:yjDH.privateKey_pkcs1,
								cert:yjDH.certificate
							},app);
						}

						global.yjGlobal.server_https=server_https;
						var port=app.get('port_https');
						if (cluster && !cluster.isMaster){
							port=0;
						}
						server_https.listen(port,function() {
							doLogMessage('REST server listening on https ' + server_https.address().address + ":" + server_https.address().port);
							if (cluster && !cluster.isMaster){
								//告诉master，开始监听了
								process.send({msg:'worker-listen',type:'https'});
							}
							cb(null);
						});
					}
					else{
						cb(null);
					}
				}],function(err,results){
					doAfterListen();
				});
				function doAfterListen(){
					if (g_afterListen){
						g_afterListen();
					}
					// 初始化后台推送 global.yjGlobal.server.listeners
					var yjPusher = require("./yjPusher.js");
					yjPusher.init();
					var yjPusher_ws = require("./yjPusher.ws.js");
                    yjPusher_ws.init();


                    if (yjGlobal.config.potocols.indexOf('http')>=0){
                   		updateSocket(global.yjGlobal.server);
                    }
                    if (yjGlobal.config.potocols.indexOf('https')>=0){
                    	updateSocket(global.yjGlobal.server_https);
                    }
                    function updateSocket(server){
                        var listeners=server.listeners('upgrade');
                        if (listeners.length!=2){
                            console.error("server upgrade event listeners is not two.");
                        }
                    	var socketioUpgradeListener=listeners[0];
                   		var apolloUpgradeListener=listeners[1];
                    	server.removeAllListeners('upgrade');
	                    server.on('upgrade',function(req, socket, head){
	                        //console.log(req);
                            var  pathname = url.parse(req.url).pathname;
                            if (pathname.indexOf("socket.io")>-1){
                                //来自socket.io模组
                                socketioUpgradeListener(req, socket, head);
                            }
                            else {
                                //来自ws模组
                            	apolloUpgradeListener(req, socket, head);
                        	}
	                    });
                    }
                    // 创建 MQTTClient
                    if(yjGlobal.config.mqttBroker){
                    	var yjMQTTClient=require("./yjMQTTClient.js");
                    	yjMQTTClient.init();
                    }
				}
			}
	});
}

var configFile=yjApp_init.getConfigFile();
if (!configFile){
	if (process.argv.length < 3){
		//throw new Error("Node.Foil need a third parameter as config file in command line.");
	}
	else{
		configFile=process.argv[2];
		if (configFile.charAt(0) == '"'
			&& configFile.charAt(configFile.length - 1) == '"')
			configFile = configFile.substr(1, configFile.length - 2);
		if (configFile.indexOf(":") < 0)
			configFile = path.join(process.cwd(), configFile);

		yjApp_init.setConfigFile(configFile);
	}
}


var config = yjApp_init.init();
var appStart = new events.EventEmitter();
if (global.yjGlobal.config.db_Connection){
	var yjDBService_util = require("./yjDBService.util.js");
	var yjCheckDBReady = yjDBService_util.loadByEngine(path.join(__dirname,"./yjCheckDBServiceReady."));
	yjCheckDBReady(function(status){
		// 检查函数 只有在status true 时才返回
		if(status){
			appStart.emit("DBConnected")
		}
	})
}else{
	process.title=config.product.name;
	run(config);
}
appStart.once("DBConnected",function(){
	process.title=config.product.name;
	run(config);
})

