/**
 * @author mustapha.wang
 * @fileOverview
 * 支持多进程启动应用。
 * @see module:yjStart
 */
/**
 * @exports yjStart
 * @description <pre>nodejs是单线程，如果考虑cpu的内核数，使用多个进程做负载均衡，应该可以提高整体效率。
 * 本框架使用cluster来按cpu内核数启动多进程。
 * 按来源的ip路由到固定的进程中，因此pusher等不用担心多进程状态不一致的问题。</pre>
 * @param {string} configFile 配置文件
 * @param {boolean} [cluster.open=false] 决定是否启用cluster多进程模式
 * @param {int} [cluster.workerCount=0] 指示启动的进程个数，如果给0，就按cpu内核个数
 * @param {boolean} [monitor.open=false] 是否启用监控服务。启用后，需要安装appmetrics和appmetrics-dash模组。
 * @param {int} [monitor.port=3333] 监控服务器的端口号。如:http://localhost:3333/appmetrics-dash/
 * 
 * @example
 * start.js
 * <pre>
 * var yjStart=require("../yujiang.Foil.Node/src/yjStart.js");
 * var path=require("path");
 * yjStart({
 *    configFile:path.join(__dirname,"./config.biz+web.wxh.js"),
 *    cluster:{
 *       open:true,
 *       workerCount:0
 *   },
 *   monitor:{
        open:true,     
        port:3333
    }
 * })</pre>
 */
module.exports=function(options){
    var cluster=undefined;
    if (options.cluster && options.cluster.open==true){
        cluster = require('cluster');
    }
    
    if (options.monitor && options.monitor.open==true) {
        if (cluster){
            console.log('warning:appmetrics can`t run under cluster mode!');
        }
        else{
            var dash = require('appmetrics-dash').monitor({
                port:options.monitor.port || 3333
            });
        }
    }
    
	var init=require("./yjApp.init.js");
	function startWorker(){	
		init.setConfigFile(options.configFile);
		require("./yjApp.js");
	}
	
	if (cluster){
		if (cluster.isMaster) {
			var g_servers={};
			var g_workerCount=options.cluster.g_workerCount;
			//如果没有指定，有多少个cpu核心就创建多少个worker进程
			if (!options.cluster.g_workerCount || options.cluster.g_workerCount<=0){
				g_workerCount = require('os').cpus().length;
			}
			console.log('master pid:'+process.pid + ', start forking '+g_workerCount+' worker(s)...');
			var g_workers = {list:[],byIP:{}};
			function doForkWorker(){
				var worker=cluster.fork();
				//把worker的id告诉子进程，使其显示监听消息时可以显示这个id
				worker.send({msg:'worker-id',id:worker.id});
				worker.on('message',function(message){					
					//console.log(message);
					if (message.msg=='worker-listen'){
						//子进程开始监听了，可以开始派任务了，加入到列表中
						if (!worker.tmIPCounts){
							worker.tmIPCounts={};
						}
						worker.tmIPCounts[message.type]=0;
						var pWorkers=g_workers[message.type];
						if (!pWorkers){
							pWorkers={isListened:false,list:[],byIP:{}};
							g_workers[message.type]=pWorkers;
						}
						pWorkers.list.push(worker);
						if (pWorkers.isListened==false && pWorkers.list.length==g_workerCount){
							//子进程全部启动完后开始监听
							pWorkers.isListened=true;
							var server=g_servers[message.type];
							server.listen(server.tmPort,function(){
						    	console.log('master pid:'+process.pid+', listening on '+message.type+' '+ server.address().address + ":" + server.address().port);
						    });
						}
					}				
				});
			}
			
			cluster.on('listening', function(worker, address) {
				//这个事件不知道worker的协议类型是http还是https，用message通知
				//console.log(worker);
			});
			cluster.on('exit', function(worker, code, signal){
				//子进程退出了
			    console.log('master pid:'+process.pid+', worker exit.pid:'+worker.process.pid+', code:'+code+', signal:'+signal);
			    for(var type in g_workers){
			    	var pWorkers=g_workers[type];
			    	for(var i=pWorkers.list.length-1;i>=0;i--){
				    	if (pWorkers.list[i]==worker){
				    		pWorkers.list.splice(i,1);
				    	}
				    }
				    for(var ip in pWorkers.byIP){
				    	if (pWorkers.byIP[ip]==worker){
				    		pWorkers.byIP[ip]=null;
				    	}
				    }
			    }
			    
			    //重新再启动一个进程
			    doForkWorker();
			});
		    
		    function getWorker(ip,type){
		    	if (ip=='::1'){
		    		ip='::ffff:127.0.0.1';
		    	}
		    	//解决对服务器状态有依赖的情况，如推送长连接
		    	//如果客户ip已经分配到某个进程中，就使用原来的进程，否者找一个负担小的（分配的ip数量少的）。
		    	var pWorkers=g_workers[type];
		    	var worker=pWorkers.byIP[ip];
		    	if (!worker){
		    		if (pWorkers.list.length>0){
		    			worker=pWorkers.list[0];
		    			//console.log('pid:'+worker.process.pid+','+worker.tmIPCount);
		    			for (var i=1;i<pWorkers.list.length;i++){
			    			if (pWorkers.list[i].tmIPCounts[type]<worker.tmIPCounts[type]){
			    				worker=pWorkers.list[i];
			    			}
			    			//console.log('pid:'+pWorkers.list[i].process.pid+','+pWorkers.list[i].tmIPCount);
			    		}
		    			if (worker){
		    				worker.tmIPCounts[type]=worker.tmIPCounts[type]+1;
		    				pWorkers.byIP[ip]=worker;
		    			}
		    		}		 
		    	}
		    	return worker;
		    }
		    
		    init.setConfigFile(options.configFile);
		    var config=init.init();
		    
		    function doCreateServer(type,port){
		    	var net=require('net');
	  			var server =net.createServer({pauseOnConnect: true});
				server.tmPort=port;
				g_servers[type]=server;
				server.on('connection',function(connection) {
					//有新的连接进来，按IP引导到哪个worker去执行
					//console.log(connection.remoteAddress);
					connection.pause();
			        var worker = getWorker(connection.remoteAddress,type);
			        if (!worker) {
			        	connection.resume();
			        	console.log('master pid:'+process.pid+', no worker to use.connection remote address:'+connection.remoteAddress);
			        	return;
			        }
			        
			        //console.log('[master] new connection,pid:'+worker.process.pid+','+connection.remoteAddress);
			        worker.send({
			        	msg:'sticky-session:connection',
			        	type:type
			        }, connection);
			    });
		    }
		    if (config.potocols.indexOf('http')>=0){
		    	doCreateServer('http',config.port);
		    }
			
		    if (config.potocols.indexOf('https')>=0){
		    	doCreateServer('https',config.port_https);
		    }
			
			for (var i = 0; i < g_workerCount; i++) {
				doForkWorker();
			}
		} else if (cluster.isWorker) {			
			process.on('message', function(message, connection) {
		        if (message.msg == 'sticky-session:connection') {
		        	if (message.type=='http'){
			        	yjGlobal.server.emit('connection', connection);
			        	connection.resume();
		        	}
		        	else if (message.type=='https'){
		        		yjGlobal.server_https.emit('connection', connection);
			        	connection.resume();
		        	}
		        	else{
		        		console.log('unknown type of "sticky-session:connection":'+message.type);
		        	}
		        }
		        else if (message.msg=='worker-id'){
		        	process.tmWorkerID=message.id;
		        }
		    });
			startWorker();
		}
	}
	else{
		startWorker();
	}
}