/**
 * @fileOverview
 * 处理实时资料推送。
 * @author mustapha.wang
 * @see module:yjPusher_timer
 */
var yjBizService = require('./yjBizService.js');
var yjPusher 	 = require("./yjPusher.js");
var yjLogin		 = require("./yjApp.middle.login.js");
var yjDateTime   = require('./client/js/yjDateTime.js');
var util		 = require('util');
var events		 = require("events");
var ms           = require("ms");

var cacheRooms={};

/**
 * @description <pre>处理后台推送。 
 * <ul>
 * <li>在客户端进入房间时推送初始资料，如今日用电功率曲线的初始资料，或者今日用电功率Label的schema(名称，布局样式)</li>
 * <li>实时资料用timer定时推送，抓取的实时资料，1点或多点</li>
 * </ul></pre>
 * @exports yjPusher_timer
 * @example <pre>
 * var yjPusher_timer=yjRequire("yujiang.Foil","yjPusher.timer.js");
 * </pre>
 * @see nodejs::yjRequire
 */
module.exports = {
	/**
	 * @description
	 * <pre>建立推送资料的房间。每个房间一个timer定时推送。
     * 推送的初始资料格式为：
     * {
     *      roomID:x,                   //房间号
     *      type:'initData',            //数据类型
     *      data:[[x1,y1],[x2,y2]...]   //数据
     * }
     * 推送的实时资料格式为：
     * {
     *      roomID:x,
     *      type:'realTimeData',
     *      data:[[x1,y1],[x2,y2]...],
     *      lastTimestamp:x             //本次最末的显示时间戳
     * }</pre>
	 * @param {object} op
	 * @param {string} op.roomID 房间号
	 * @param {array} op.biz.initData.params 抓取初始资料的bizserver端的路由，要求是GET方法。
	 * @param {object} op.biz.initData.query <pre>抓取初始资料的bizserver端的query参数，
     * 传递到bizserver的query参数是op.biz.initData.query与以下参数的合并结果：
     * {
     *      access_token:string,     //访问bizserver的临时token
     *      timezone:int,            //单位毫秒
     *      dataPointInterval:object //就是op.dataPointInterval
     * }
     * 要求从bizserver返回的初始资料格式为：数据点数组：
     * {
     *      data:[[x1,y1],[x2,y2]...]  //数组，如：[[2342422,3.4],[32342335,5.6]],data[i][0]是浏览器本地时间戳，整数
     * }</pre>
	 * @param {function} op.biz.initData.onBeforeLoad 抓取初始资料前事件，function(roomInfo,nowTimestamp)
	 * @param {function} op.biz.initData.onAfterLoad 抓取初始资料后事件，function(roomInfo,data)
	 * @param {function} op.biz.initData.onBeforePush 推送初始资料前事件，function(roomInfo,socket,content)
	 * @param {array} op.biz.realTimeData.params 抓取实时资料的bizserver端的路由。
	 * @param {object} op.biz.realTimeData.query <pre>抓取实时资料的bizserver端的query参数
     * 传递到bizserver的query参数是op.biz.realTimeData.query与以下参数的合并结果：
     * {
     *      access_token:string,     //访问bizserver的临时token
     *      timezone:int,            //单位毫秒
     *      dataPointInterval:object //就是op.dataPointInterval
     * }
     * 要求从bizserver返回的初始资料格式为：
     * {
     *      data:[[x1,y1],[x2,y2]...]
     * }</pre>
	 * @param {function} op.biz.realTimeData.onBeforeLoad 抓取实时资料前事件，function(roomInfo,nowTimestamp)
     * @param {function} op.biz.realTimeData.onAfterLoad <pre>抓取实时资料后事件。
     * function(roomInfo,data)
     * .如果返回true，代表用户自己处理了抓取的资料，不推送；
     * .预设。如果返回false，抓到的资料如果不为空，就会推送。</pre>
     * @param {function} op.biz.realTimeData.onBeforePush 推送实时资料前事件，function(roomInfo,socket,content)
	 * @param {string} [op.timeInterval='1m'] timer的触发时间间隔。参考ms模块的约定格式：https://www.npmjs.com/package/ms
	 * @param {int} op.dataPointInterval.value 数据点的时间间隔数值
	 * @param {string} op.dataPointInterval.unit 数据点的时间间隔单位，如：'Y','M','D','h','m','s','ms'
	 * @param {int} op.timezone 浏览器客户端传递来的时区，单位：毫秒，即：new Date().getTimezoneOffset()*60*1000;
     * @param {bool} [op.isPushEmptyRealTimeData=false] 是否推送空的实时资料。虽然资料为空，但是有最新的时间lastTimestamp，客户端接收到后可以左移x轴。
	 * 
	 * @example
	 * 参考yujiang.Foil.Node.WebServer/demo/push3/showPush3
	 * <pre>
     * </pre>
	 */
	buildRoom:function(op){
		var roomInfo=cacheRooms[op.roomID];
		if(roomInfo){
			/**
			 * 房间已经建立并初始化过了
			 */
			return;
		}
		op._timeInterval=ms(op.timeInterval || '1m');
		op._timezone=op.timezone;
		//console.log('timezone:'+op._timezone);

		roomInfo={
			isOutOfDate:true,
			data:[],
			isLoadingData:false,
			options:op,
			pushInitData:function(socket,data,payload){
			    var display_lastTimestamp=yjDateTime.adjustPriorQuantumTimestamp(this.lastTimestamp,
                    this.options.dataPointInterval.unit,
                    this.options._timezone);
				var content={
					roomID:this.options.roomID,
					type:'initData',
					data:data,
					lastTimestamp:display_lastTimestamp
				}
				if (payload){
                    content=util._extend(content,payload);
                }
				if (this.options.biz.initData.onBeforePush){
					this.options.biz.initData.onBeforePush(this,socket,content);
				}
				//console.log(this.options.roomID);
				yjPusher[socket?'pushOne':'push'](socket?socket:this.options.roomID, content);
			},
			pushRealTimeData:function(socket,data,payload){
			    var display_lastTimestamp=yjDateTime.adjustPriorQuantumTimestamp(this.lastTimestamp,
                    this.options.dataPointInterval.unit,
                    this.options._timezone);
				var content={
					roomID:this.options.roomID,
					type:'realTimeData',
					data:data,
					lastTimestamp:display_lastTimestamp
				}
				if (payload){
				    content=util._extend(content,payload);
				}
				if (this.options.biz.realTimeData.onBeforePush){
					this.options.biz.realTimeData.onBeforePush(this,socket,content);
				}
				yjPusher[socket?'pushOne':'push'](socket?socket:this.options.roomID, content);
			},
			getNowTimestamp:function(){
				var now=new Date();
				return now.getTime();
			},
			quantumCurrentTimestamp:function(nowTimestamp){
				return yjDateTime.quantumTimestampToZone(nowTimestamp,
					this.options.dataPointInterval.value,this.options.dataPointInterval.unit,
					this.options._timezone);
			}
		};
		cacheRooms[op.roomID]=roomInfo;
		/**
		 * 收听客户端进入房间的通知事件，进入房间后就推送初始资料
		 */
		yjPusher.addRoomNotifier(roomInfo.options.roomID,function(socket){
			if(roomInfo.isOutOfDate==false){
				/**
				 * 资料没有过期，直接推送
				 */
				roomInfo.pushInitData(socket,roomInfo.initData);
				return;
			}
			/**
			 * 资料过期了，收听资料抓回来的通知。
			 * 如果正在抓取初始资料时，又有人进入房间，就不发起抓资料动作，只接受资料抓回的通知。
			 */
			var eventData=new events.EventEmitter();
			eventData.once('ExeOnce', function (data) {
				roomInfo.pushInitData(socket,data);
			});
			/**
			 * 如果不是正在抓资料，就去抓，抓完发出通知
			 */
			loadInitData(roomInfo,function(result){
				eventData.emit('ExeOnce',result);
			});	
		});
	        
		function loadInitData(roomInfo,success2,error2){
			if(roomInfo.isLoadingData==true){
				return;
			}
			var nowTimestamp=roomInfo.getNowTimestamp();
			//console.log('nowTimestamp:'+nowTimestamp);
			if (roomInfo.options.biz.initData.onBeforeLoad){
				roomInfo.options.biz.initData.onBeforeLoad(roomInfo,nowTimestamp);
			}
			var token=yjLogin.getTempToken();
			var query=util._extend({
					access_token:token,
					timezone:roomInfo.options._timezone,
					dataPointInterval:roomInfo.options.dataPointInterval
				},roomInfo.options.biz.initData.query
			);
			//console.log('query:'+query);
			roomInfo.lastTimestamp=roomInfo.quantumCurrentTimestamp(nowTimestamp);
			roomInfo.isLoadingData=true;
			yjBizService.get({
				params : roomInfo.options.biz.initData.params,
				query : query,
				success : function(data) {				    
					roomInfo.isLoadingData=false;
					roomInfo.isOutOfDate=false;
					if (roomInfo.options.biz.initData.onAfterLoad){
						roomInfo.options.biz.initData.onAfterLoad(roomInfo,data);
					}
					roomInfo.initData=data;
					if (success2){
						success2(data);
					}
				},
				error :function(err){
					roomInfo.isLoadingData=false;
					console.log(err);
					if (error2){
						error2(err);
					}
				} 
			});
		}

		function loadRealTimeData(roomInfo){
			if(roomInfo.isLoadingData==true){
				return;
			}
			var nowTimestamp=roomInfo.getNowTimestamp();
			var currentTimestamp=roomInfo.quantumCurrentTimestamp(nowTimestamp);
			//console.log('currentTimestamp:'+new Date(currentTimestamp));
			if (currentTimestamp<=roomInfo.lastTimestamp){
				/**
				 * 当前时间小于或等于上次抓取时间，时间还没到，不必去抓取，很可能抓不到资料
				 */
				return;
			}
			if (roomInfo.options.biz.realTimeData.onBeforeLoad){
				roomInfo.options.biz.realTimeData.onBeforeLoad(roomInfo,nowTimestamp);
			}
			var token=yjLogin.getTempToken();
			var query=util._extend({
					/**
					 * 用临时token访问bizserver
					 * @ignore
					 */
					access_token:token,
					timezone:roomInfo.options._timezone,
					dataPointInterval:roomInfo.options.dataPointInterval
				},
				roomInfo.options.biz.realTimeData.query
			);
			//console.log('query:'+query);
			roomInfo.lastTimestamp=currentTimestamp;
			roomInfo.isLoadingData=true;
			yjBizService.get({
				params :  roomInfo.options.biz.realTimeData.params,
				query : query,
				success : function(data) {
					//console.log(data);
					var isHandled=false;
					if (roomInfo.options.biz.realTimeData.onAfterLoad){						
						isHandled=roomInfo.options.biz.realTimeData.onAfterLoad(roomInfo,data);
					}
					if (isHandled!=true){
						/**
						 * 如果没有抓到资料，不必推送
						 */					    
						if (data.length>0 ||
						    roomInfo.options.isPushEmptyRealTimeData==true ||
			                roomInfo.options.isPushEmptyRealTimeData=='true'){
							roomInfo.pushRealTimeData(null,data);
						}
					}
					roomInfo.isLoadingData=false;
				},
				error:function(err){
					roomInfo.isLoadingData=false;
					console.log(err);
				}
			});
		}
		/**
		 * bizserver端初始资料是每10分钟一个点，实时资料也是每10分钟一个点，timer间隔再小都没有用。
		 * 如果资料间隔是10分钟一个点，推送检查周期最好是多少？太长漏掉后，下次要很久才能补回来，太短无用，如timer间隔也是10分钟，那如果漏掉，要下一个10分钟才能补回来。
		 * 因此，我们把timer间隔设为1分钟。
		 * 因为timer的精度不高，可能timer触发时，抓不到点或抓到1个，2个点。
		 * webserver可以用自己的时钟来判断从上次调用bizserver是否过了10分钟，过了才调用bizserver，但bizserver可能认为没有过10分钟，所以也忽略了，所以webserver要知道是否被忽略。
		 */
		setInterval(function(){
			/**
			 * 只针对这个房间定时扫描，每个房间的扫描周期不一样
			 * 每个房间一个timer
			 */
			//console.log(new Date());
			var conCount=yjPusher.getClientCount(roomInfo.options.roomID);
			//console.log('client count:'+conCount);
			if (conCount==0){
				/**
				 * 房间没人了，后面不会再更新资料，设置初始资料为过期
				 */
				roomInfo.isOutOfDate=true;
			}else{
				/**
				 * 注意：可能触发去抓实时资料时，还没有初始资料（isOutOfDate==false），必须保证先推送初始资料，再推送实时资料，否则客户端浏览器会出错。
				 * 如果这时isOutOfDate为true，可能有如下原因：
				 * （1）正在抓取初始资料，抓取初始资料的动作还没有回来（isLoadingData==true）。继续等。
				 * （2）上次抓取初始资料失败了(isLoadingData==false)。重新抓取。
				 */
				if (roomInfo.isOutOfDate==true){
					(function(roomInfo2){
						loadInitData(roomInfo2,function(result){
							roomInfo2.pushInitData(null,result);
						});
					})(roomInfo);
				}
				else{
					/**
					 * 没有在抓取资料时才去抓取，否则来不及处理会积压任务而拖垮服务器.
					 * lastTimestamp是bizserver返回的资料最后的结束时间，不能在这里(webserver)去判断从lastTimestamp到现在有没有超过10分钟（没超过10分钟就不去抓资料），两个服务器的时钟可能不一致
					 */
					loadRealTimeData(roomInfo);
				}
			}
		}, op._timeInterval);
	}
}