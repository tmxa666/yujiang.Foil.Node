/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjPusher
 */

var g_roomNotifiers = [];
var g_msgNotifiers  = [];
var g_socketServers = [];

/**
 * @description 处理后台推送，使用socket.io模组。注意：不是标准的web socket，手机端可能无法使用。
 * @exports yjPusher
 * @example <pre>
 * var yjPusher=yjRequire("yujiang.Foil","yjPusher.js");
 * yjPusher.push("room_docCamera",{
 *       type:'videoframe',
 *       room:"room_docCamera",
 *       data : {id:1,name:'shanghai'}
 * });
 * </pre>
 * @see nodejs::yjRequire
 */
module.exports = {
	/**
	 * 初始化
	 */
	init : function() {
		var sio = require('socket.io');
		if (yjGlobal.server){
		    var socketServer=sio.listen(yjGlobal.server);
		    socketServer.tmType="http";
			g_socketServers.push(socketServer);
		}
		if (yjGlobal.server_https){
		    var socketServer_https=sio.listen(yjGlobal.server_https);
		    socketServer_https.tmType="https";
			g_socketServers.push(socketServer_https);
		}

		function roomNotify(roomID, socket,data) {
			var roomNotifiers = g_roomNotifiers[roomID];
			if (roomNotifiers) {
				roomNotifiers.forEach(function(notifier) {
				    notifier(socket,data);
				});
			}
		}

		function msgNotify(roomID,socket,msg){
            var msgNotifiers = g_msgNotifiers[roomID];
            if (msgNotifiers) {
                msgNotifiers.forEach(function(notifier) {
                    notifier(socket,msg);
                });
            }
        }
		
		for(var i=0;i<g_socketServers.length;i++){
			(function(socketServer){
				socketServer.sockets.on('connection', function(socket) {				    
					// 响应连接
					//console.log("connected:" + socket.id+', pid:'+process.pid);
				    socket.tmTime=new Date();
					socket.on('disconnect', function() {
						//console.log('disconnect:' + socket.id+', pid:'+process.pid);
					});
					socket.on("subscribe", function(data) {
					    //console.log('subscribe:' + socket.id+', pid:'+process.pid+', room:'+data.room);
						if (!socket.tmParams){
							socket.tmParams={};
						}
						socket.tmParams[data.room]=data;
						var room=socketServer.sockets.adapter.rooms[data.room];
						if (!room?true:(room["sockets"]?!room.sockets[socket.id]:!room[socket.id])){
							socket.join(data.room);
							// 新连进来，马上通知推送一次
							roomNotify(data.room, socket,data);
							//console.log("join:"+socket.id+', pid:'+process.pid);
						}
					});
					socket.on('unsubscribe', function(data) {
						// console.log(data);
						//console.log("leave:"+socket.id+', pid:'+process.pid);
						socket.leave(data.room);
						if (socket.tmParams){
							socket.tmParams[data.room]=null;
						}
					});
					socket.on('msg',function(data){
					    msgNotify(data.room,socket,data);
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
     * 监听某个房间的订阅者进入情况，如果有新的订阅者进入，调用notifier回调函数。
     * @param {string} roomID - 房间ID
     * @param {function(socket,data)} notifier - 通知回调函数，有新的订阅者进入时触发。• socket:新的订阅者的socket连接• data:进入房间时携带的信息
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
     * 监听某个房间的消息('msg'事件)，如果有任何消息，调用notifier回调函数。
     * 框架只处理'subscribe','unsubscribe','msg'3个事件
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
     * @param {object} data - 推送的资料
     * @return {void}
	 */
	push : function(roomID, data) {
		for(var i=0;i<g_socketServers.length;i++){
			g_socketServers[i].sockets.in(roomID).emit("push",data);
		}
	},
	/**
	 * 向某个房间推送信息。
	 * @param {string} roomID - 推送的房间ID
     * @param {function} getData(socket) - 为每个socket返回要推送的资料，其中，socket.tmParams是客户端subscribe时传入的参数，key是房间号
     * @return {void}
	 */
	pushMore : function(roomID, getData) {
		var clients=module.exports.getClients(roomID);
		for(var i=0;i<clients.length;i++){
			var socket=clients[i];
			var data=getData(socket);
			socket.emit("push",data);
		}   
	},
    /**
     * 向某个客户端推送信息。
     * @param {object} socket - 接收者的socket连接,socket.tmParams是客户端subscribe时传入的参数，key是房间号。
     * @param {object} data - 推送的信息
     * @return {void}
     */
	pushOne : function(socket, data) {
		socket.emit("push", data);
	},
	/**
	 * 获得房间的订阅者
	 * @param {string} roomID - 房间ID
	 * @return {array} - 订阅者列表
	 */
	getClients : function(roomID) {
		// http://ask.ttwait.com/que/23858604
		var list = [];
		for(var i=0;i<g_socketServers.length;i++){
			var room = g_socketServers[i].sockets.adapter.rooms[roomID];
			if (room) {
				if(room["sockets"]){
					room=room.sockets;
				}
				for (var id in room) {
					var socket = g_socketServers[i].sockets.adapter.nsp.connected[id];
					list.push(socket);
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
			var room = g_socketServers[i].sockets.adapter.rooms[roomID];
			if(room){
				if(room["sockets"]){
					count=room.length;
				}else{
					for (var id in room) {
						count++;
					}
				}
			}
		}
		return count;
	}
}

//http://chat.socket.io
//解决 socket.io v1.0.6 v1.3.7 v1.7.2 socketServer.sockets.adapter.rooms[data.room] 返回数据类型不同造成的 兼容性问题