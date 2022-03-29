/**
 * @fileOverview
 * @author mustapha.wang,2018/7/24
 * @see module:yjPusher_ws
 */

var g_notifiers = [];
var g_roomNotifiers = [];
var g_msgNotifiers  = [];
var g_socketServers = [];

var uuid=require("uuid/v1");
var ws = require('ws');
var async=require("async");
/**
 * @description
 * <pre>处理后台推送，使用ws模组，是标准的web socket，手机端可以使用。
 * 注意：
 * .当服务器是http时，客户端的websocket连接使用ws://
 * .当服务器是https时，客户端的websocket连接使用wss://
 * </pre>
 * @exports yjPusher_ws
 * @example <pre>
 * var yjPusher=yjRequire("yujiang.Foil","yjPusher.ws.js");
 * yjPusher.push("room_docCamera",JSON.stringify({
 *       type:'videoframe',
 *       room:"room_docCamera",
 *       data : {id:1,name:'shanghai'}
 * }));
 * </pre>
 * @example <pre>
 * var yjPusher=yjRequire("yujiang.Foil",'yjPusher.ws.js');
 * yjPusher.addRoomNotifier('room_chat',function(socket,data){
 *     var clients=yjPusher.getClients('room_chat');
 *     var list=[];
 *     clients.forEach(function(socket,index){
 *         //console.log(socket);
 *         list.push({
 *             uuid:socket.tmUUID,
 *             ip:socket._socket.remoteAddress,
 *             port:socket._socket.remotePort
 *         });
 *     });
 *     //推送好友列表
 *     yjPusher.push('room_chat',JSON.stringify({
 *         room:'room_chat',
 *         cmd:"friends",
 *         friends:list})
 *     ,function(err){
 *         
 *     });
 * });
 * 
 * yjPusher.addMsgNotifier('room_chat',function(socket,data,action){
 *    data.msg=socket.tmUUID+':'+data.msg;
 *    if (action=="subscribe"){
 *      //socket刚进入房间,可以推送初始资料
 *      yjPusher.push(data.room,JSON.stringify(data),function(err){
 *        
 *      });
 *    };
 *    if (action=="unsubscribe"){
 *      //socket刚离开房间
 *      console.log("unsubscribe");
 *    }
 *    if (action=="close"){
 *      //socket刚离开房间
 *      console.log("close");
 *    }
 * });</pre>
 * @see nodejs::yjRequire
 */
module.exports = {
	/**
	 * 初始化
	 */
	init : function() {		
		if (yjGlobal.server){
		    var op={
                server:yjGlobal.server
            }
		    if (yjGlobal.config.security && yjGlobal.config.security.websocket){
		        op=Object.assign(yjGlobal.config.security.websocket.ws,op);
		    }
		    var wsServer=new ws.Server(op);
		    wsServer.tmType="http";
			g_socketServers.push(wsServer);
		}
		if (yjGlobal.server_https){
		    var ops={
                server:yjGlobal.server_https
            }
            if (yjGlobal.config.security && yjGlobal.config.security.websocket){
                ops=Object.assign(yjGlobal.config.security.websocket.ws,ops);
            }
		    var wsServer_https=new ws.Server(ops);
		    wsServer_https.tmType="https";
			g_socketServers.push(wsServer_https);
		}

		function notify(roomID,socket,data,action) {
		    //指定的房间监听者
			g_notifiers.forEach(function(notifier) {
				notifier(roomID,socket,data,action);
			});
		}

		function roomNotify(roomID,socket,data,action) {
		    //指定的房间监听者
			var roomNotifiers = g_roomNotifiers[roomID];
			if (roomNotifiers) {
				roomNotifiers.forEach(function(notifier) {
				    notifier(socket,data,action);
				});
			}
		}
		
		function msgNotify(roomID,socket,msg){
		    //指定的房间监听者
		    var msgNotifiers = g_msgNotifiers[roomID];
            if (msgNotifiers) {
                msgNotifiers.forEach(function(notifier) {
                    notifier(socket,msg);
                });
            }
		}

		for(var i=0;i<g_socketServers.length;i++){
			(function(socketServer){
				socketServer.on('connection', function(socket,req) {
							    //console.log(req);
				    //为socket建立一个新的uuid，用来识别
				    socket.tmTime=new Date();
					socket.tmUUID=uuid();
					socket.tmHeaders=req?req.headers:null;
                    //console.log("connected:" + socket.tmUUID+', pid:'+process.pid);
					socket.on('close', function(code,reason) {
						// console.log('close:' + socket.tmUUID+', pid:'+process.pid);
						for(var roomID in socketServer.tmRooms){
						    var room=socketServer.tmRooms[roomID];
						    if (room[socket.tmUUID]){
								//先从房间删除，再通知
								delete room[socket.tmUUID];
								var data={};
								//把当初subscribe的参数带上，如果没有unsubscribe，就还在
								if (socket.tmParams) data=socket.tmParams[roomID];
								roomNotify(roomID,socket,data,"close");
								notify(roomID,socket,data,"close");						        
						    }
						}
					});
					socket.on("message", function(msg) {
                        var data=JSON.parse(msg);
					    switch (data.cmd){
					    case "subscribe":
    						if (!socket.tmParams){
    							socket.tmParams={};
    						}
    						socket.tmParams[data.room]=data;
    						if (!socketServer.tmRooms){
    						    socketServer.tmRooms={};
    						}
    						var room=socketServer.tmRooms[data.room];
    						if (!room){
    						    room={};
    						    socketServer.tmRooms[data.room]=room;
    						}
    						if (!room[socket.tmUUID]){
    							room[socket.tmUUID]=socket;
    							// 新连进来，马上通知推送一次
								roomNotify(data.room,socket,data,"subscribe");
								notify(data.room,socket,data,"subscribe");
    							//console.log("join:"+socket.tmUUID+', pid:'+process.pid);
    						}
    						break;
					    case "unsubscribe":
    						// console.log(data);
    						// console.log("leave:"+socket.tmUUID+', pid:'+process.pid);
							var room=socketServer.tmRooms[data.room];
							//先删除再通知，用户可能在通知事件中去查看现在房间人数
							if (room) delete room[socket.tmUUID];
    						if (socket.tmParams){
    							delete socket.tmParams[data.room];
    						}
							try{
								roomNotify(data.room,socket,data,"unsubscribe");
								notify(data.room,socket,data,"unsubscribe");
							}
							catch(e){

							}
    						break;
					    default:
							msgNotify(data.room,socket,data);
							notify(data.room,socket,data,"msg");
					        break;
					    }
					});
				});
			})(g_socketServers[i]);
		}
	},
	/**
	 * 返回socket server数组，如果同时支持http和https，就是返回两个。
	 * @field
	 * @type {array}
	 */
	getSocketServers : function() {
		return g_socketServers;
	},
	/**
     * 监听订阅者行为和消息，调用notifer回调函数通知。
     * @param {string} roomID - 房间ID
     * @param {function(room,socket,data,action)} notifier <pre>通知回调函数，订阅者行为改变时触发。
	 * • room:房间
	 * • socket:订阅者的socket连接
	 * • data:进入/离开房间时携带的信息
	 * • action:行为，有4种："subscribe","unsubscribe","close","msg"
	 * </pre>
     * @return {void}
     */
	addNotifier : function(notifier) {
		g_notifiers.push(notifier);
	},
	removeNotifier:function(notifier){
        for(var i=0;i<g_notifiers.length;i++){
            if (g_notifiers[i]==notifier){
                g_notifiers.splice(i);
                break;
            }
        }
    },
    /**
     * 监听某个房间的订阅者行为，调用notifer回调函数通知。
     * @param {string} roomID - 房间ID
     * @param {function(socket,data,action)} notifier <pre>通知回调函数，订阅者行为改变时触发。
	 * • socket:订阅者的socket连接
	 * • data:进入/离开房间时携带的信息
	 * • action:行为，有3种："subscribe","unsubscribe","close"
	 * </pre>
     * @return {void}
     */
	addRoomNotifier : function(roomID, notifier) {
		var roomNotifiers = g_roomNotifiers[roomID];
		if (!roomNotifiers) {
			roomNotifiers = new Array();
			g_roomNotifiers[roomID] = roomNotifiers;
		}
		roomNotifiers.push(notifier);
	},
	/**
	 * 移除房间进入通知。
     * @param {string} roomID - 房间ID
     * @param {function(socket,data)} notifier - 通知回调函数
     * @return {void}
	 */
	removeRoomNotifier:function(roomID,notifier){
        var roomNotifiers = g_roomNotifiers[roomID];
        if (roomNotifiers) {
            for(var i=0;i<roomNotifiers.length;i++){
                if (roomNotifiers[i]==notifier){
                    roomNotifiers.splice(i);
                    break;
                }
            }
        }
    },
	/**
     * 监听某个房间的消息，如果有任何消息，调用notifier回调函数。
     * @param {string} roomID - 房间ID
     * @param {function(socket,msg)} notifier - 有新的消息时触发。• socket:发出消息的socket连接 • msg:消息内容
     * @return {void}
     */
	addMsgNotifier:function(roomID,notifier){
	    var msgNotifiers = g_msgNotifiers[roomID];
        if (!msgNotifiers) {
            msgNotifiers = new Array();
            g_msgNotifiers[roomID] = msgNotifiers;
        }
        msgNotifiers.push(notifier);
	},
	/**
     * 移除消息通知。
     * @param {string} roomID - 房间ID
     * @param {function(socket,data)} notifier - 通知回调函数
     * @return {void}
     */
	removeMsgNotifier:function(roomID,notifier){
	    var msgNotifiers = g_msgNotifiers[roomID];
        if (msgNotifiers) {
            for(var i=0;i<msgNotifiers.length;i++){
                if (msgNotifiers[i]==notifier){
                    msgNotifiers.splice(i);
                    break;
                }
            }
        }
	},
	/**
	 * 向某个房间推送信息。
	 * @param {string} roomID - 推送的房间ID
     * @param {string} data - 推送的资料
     * @param {callback} callback -完成推送后的回调函数
     * @return {void}
	 */
	push : function(roomID, data, callback) {
        var clients=module.exports.getClients(roomID);
        if (!callback){
            clients.forEach(function(client,index){
                client.send(data);
            });
            return;
        }
        async.each(clients,function(client,cb){
            if (client.readyState === ws.OPEN){
                var t=setTimeout(function(){
                    cb(null);
                    t=null;
                },1000);
                //查看：https://nodejs.org/dist/latest-v10.x/docs/api/stream.html#stream_writable_write_chunk_encoding_callback
                //send函数发生错误时，不一定会调用callback
                //因此，只能用定时器，确保cb的调用
                client.send(data,function(e){
                    if (!t) return;
                    clearTimeout(t);
                    if (e) console.error(e);
                    else cb(null);
                });
            }
            else cb(null);
        },function(e){
            callback(e);
        });
	},
	/**
	 * 向某个房间推送信息。
	 * @param {string} roomID - 推送的房间ID
     * @param {function} getData(socket) - 为每个socket返回要推送的资料，其中，socket.tmParams是客户端subscribe时传入的参数，key是房间号
     * @param {callback} callback -完成推送后的回调函数
     * @return {void}
	 */
	pushMore : function(roomID, getData,callback) {
		var clients=module.exports.getClients(roomID);
		if (!callback){
		    clients.forEach(function(client,index){
		        var data=getData(client);
                client.send(data);
            });
            return;
		}
		async.each(clients,function(client,cb){
			if (client.readyState === ws.OPEN){
			    var data=getData(client);
			    //确保callback会触发
			    var t=setTimeout(function(){
                    cb(null);
                    t=null;
                },1000);
			    client.send(data,function(e){
			        if (!t) return;
                    clearTimeout(t);
			        if (e) console.error(e);
                    cb(null);
			    });
			}
			else cb(null);
		},function(e){
            callback(e);
        });
	},
    /**
     * 向某个客户端推送信息。
     * @param {object} socket - 接收者的socket连接,socket.tmParams是客户端subscribe时传入的参数，key是房间号。
     * @param {string} data - 推送的信息
     * @param {callback} callback -完成推送后的回调函数
     * @return {void}
     */
	pushOne : function(socket, data,callback) {
	    if (socket.readyState === ws.OPEN){
	        if (!callback){
	            socket.send(data);
	        }
	        else{
	            //确保callback会触发
    	        var t=setTimeout(function(){
    	            callback(null);
                    t=null;
                },1000);
	        
    	        socket.send(data,function(e){
    	            if (!t) return;
                    clearTimeout(t);
                    if (e) console.error(e);
                    callback(e);
    	        });
	        }
	    }
	    else if (callback) callback(null);
	},
	/**
	 * 获得房间的订阅者
	 * @param {string} roomID - 房间ID
	 * @return {array} - 订阅者socket列表
	 */
	getClients : function(roomID) {
		var list = [];
		for(var i=0;i<g_socketServers.length;i++){
		    if (g_socketServers[i].tmRooms){
    			var room = g_socketServers[i].tmRooms[roomID];
    			if (room) {
    				for (var tmUUID in room) {
    					list.push(room[tmUUID]);
    				}
    			}
		    }
		}
		return list;
	},
    /**
     * 获得某个房间内订阅者的数量。
     * @param {string} roomID - 房间ID
     * @return {int} - 订阅者的数量
     */
	getClientCount : function(roomID) {
		var count = 0;
		for(var i=0;i<g_socketServers.length;i++){
		    if (g_socketServers[i].tmRooms){
    			var room = g_socketServers[i].tmRooms[roomID];
    			if(room){
    				for (var tmUUID in room) {
    					count++;
    				}
    			}
		    }
		}
		return count;
	}
}