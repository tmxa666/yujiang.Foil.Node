/**
 * @author mustapha.wang
 * @fileOverview
 * 处理实时资料推送。
 * @see module:yjPusher_timer_scope
 */
var yjBizService  = require('./yjBizService.js');
var yjPusherTimer = require("./yjPusher.timer.js");
var yjLogin		  = require("./yjApp.middle.login.js");
var yjDateTime    = require("./client/js/yjDateTime.js");
var util		  = require('util');
var events		  = require("events");
var ms            = require("ms");

var EventData=new events.EventEmitter();
var cacheRooms={};

/**
 * @description <pre>处理后台推送，有固定显示区间。
 * 在客户端进入房间时推送初始资料，实时资料用timer定时推送。<br>
 * 每个浏览器的客户端看到的显示区间和时间都是本地时间，当前时间也是本地时间。即，如果显示今天的每小时用电功率：<br><ul>
 * <li>中国是东八区(GMT+8:00)：看到的是[2017-06-07 00:00:00,2017-06-08 00:00:00)，现在时间09:23:45</li>
 * <li>Yangon东六半区(GMT+6:30)：看到的也是[2017-06-07 00:00:00,2017-06-08 00:00:00)，现在时间也是09:23:45</li></ul></pre>
 * @exports yjPusher_timer_scope
 * @example <pre>
 * var yjPusher_timer_scope=yjRequire("yujiang.Foil","yjPusher.timer.scope.js");
 * </pre>
 * @see nodejs::yjRequire
 * @see module:yjPusher_timer
 */
module.exports = {
	/**
	 * @description
	 * <pre>构建推送的房间。从yjPusher.timer.js继承。用当前时间计算出op.scope定义的显示区间。
	 * 推送的初始资料格式为：
     * {
     *      roomID:x,
     *      type:'initData',
     *      data:[[x1,y1],[x2,y2]...],
     *      scope:{
     *          beginTimestamp:x,   //开始时间戳
     *          endTimestamp:x,     //结束时间戳
     *          pointCount:x        //显示点数
     *      },
     *      isFirst:x               //是否是第一次推送。如果当前时间超过显示区间，会重新推送初始资料。
     * }
     * 推送的实时资料格式为：
     * {
     *      roomID:x,
     *      type:'realTimeData',
     *      data:[[x1,y1],[x2,y2]...],
     *      isOverScope:x,          //数据是否已经超过区间
     *      scope:{                 //如果当前时间已经超过旧的显示区间(isOverScope=true)，就把新的显示区间推送出去。否者不会有scope。
     *          beginTimestamp:x,   //开始显示时间戳
     *          endTimestamp:x,     //结束显示时间戳
     *          pointCount:x        //显示点数
     *      },
     *      lastTimestamp:x         //本次最末的显示时间戳
     * }</pre>
	 * @param {object} op 从yjPusher.timer.js继承
	 * @param {int} op.scope.value 区间数值
	 * @param {string} op.scope.unit 区间单位。如：'Y','M','D','h','m','s','ms'
	 * @param {bool} [op.isRepushInitData=true] <pre>在当前时间超过显示区间后，是否重新推送初始资料。
	 * .为true时，重新推送初始资料，客户端有换片的效果；
	 * .为false时不重新推送初始资料，按实时资料推送，客户端可以做平滑左移效果。</pre>
	 * @param {object} op.biz.initData.query <pre>抓取初始资料的bizserver端的query参数,
     * 传递到bizserver的query参数是op.biz.initData.query与以下参数的合并结果：
     * {
     *      access_token:string,     //访问bizserver的临时token
     *      timezone:int,            //单位毫秒
     *      dataPointInterval:object,//就是op.dataPointInterval
     *      fromTimestamp:int,       //开始时间，抓取的资料应该大于等于这个时间
     *      toTimestamp:int          //结束时间，抓取的资料应该小于这个时间
     * }</pre>
     * @param {object} op.biz.realTimeData.query <pre>抓取实时资料的bizserver端的query参数
     * 传递到bizserver的query参数是op.biz.realTimeData.query与以下参数的合并结果：
     * {
     *      access_token:string,     //访问bizserver的临时token
     *      timezone:int,            //单位毫秒
     *      dataPointInterval:object,//就是op.dataPointInterval
     *      fromTimestamp:int,       //开始时间，抓取的资料应该大于等于这个时间
     *      toTimestamp:int          //结束时间，抓取的资料应该小于这个时间     
     * }</pre>
   	 * @example
	 * 参考yujiang.Foil.Node.WebServer/demo/push3/showPush3
	 * <pre>
     * var yjPusherTimerScope = yjRequire("yujiang.Foil","yjPusher.timer.scope.js");
     * module.exports = function(sender) {
     *     var staticIndicatorAID=sender.req.query.staticIndicatorAID;
     *     var deviceDataMetaAID=sender.req.query.deviceDataMetaAID;
     *     var timezone=parseInt(sender.req.query.timezone);
     *     yjPusherTimerScope.buildRoom({
     *         roomID:sender.req.query.roomID,
     *         biz:{
     *             initData:{
     *                 params:["building","chart","getRealTimePowerChartInfo"],
     *                 query:{
     *                     staticIndicatorAID:staticIndicatorAID,
     *                     deviceDataMetaAID:deviceDataMetaAID
     *                 }
     *             },
     *             realTimeData:{
     *                 params:[ "building","chart","updateRealTimePowerChart"],
     *                 query:{
     *                     staticIndicatorAID:staticIndicatorAID,
     *                     deviceDataMetaAID:deviceDataMetaAID
     *                 }
     *             }
     *         },
     *         dataPointInterval:{
     *             value:1,
     *             unit:'h'
     *         },
     *         timeInterval:'1m',
     *         scope:{
     *             value:1,
     *             unit:'D'
     *         },
     *         timezone:timezone,
     *         //时间超过区间后，不按初始资料推送，使x轴能平滑左移
     *         isRepushInitData:false,
     *         //没有抓到资料也推送，使x轴左移
     *         isPushEmptyRealTimeData:true
     *     });
     *     sender.success('ok');
     * }
     * </pre>
	 */
	buildRoom:function(op){
	    function checkOptions(){
	        var units=['Y','M','D','h','m','s','ms'];
	        var index_scope=units.indexOf(op.scope.unit);
	        if (index_scope<0){
	            throw new Error('unit must be one of ["Y","M","D","h","m","s","ms"],unknown scope.unit:'+op.scope.unit);
	        }
	        var index_dataPointInterval=units.indexOf(op.dataPointInterval.unit);
	        if (index_dataPointInterval<0){
                throw new Error('unit must be one of ["Y","M","D","h","m","s","ms"],unknown scope.unit:'+op.dataPointInterval.unit);
            }
	        if (index_scope>index_dataPointInterval){
	            throw new Error('scope.unit must bigger than dataPointInterval.unit!');
	        }
	        /**
	         * 月，时，分，秒，毫秒最好能整除
	         */
	    }
	    checkOptions();
	    
		function makeScopeZone(roomInfo,nowTimestamp){
		    /**
		     * 先用1个量子单位获得查询结束时间，再用查询结束时间推到整个scope区间
		     * @ignore
		     */
			var beginTimestamp=yjDateTime.quantumTimestampToZone(nowTimestamp,
				1,roomInfo.options.scope.unit,roomInfo.options._timezone);
			var endTimestamp=yjDateTime.getNextQuantumTimestamp(beginTimestamp,
				1,roomInfo.options.scope.unit,roomInfo.options._timezone);
			//console.log('endTimestamp:'+yjDateTime.format(new Date(endTimestamp),'YYYY-MM-DD HH:mm:ss'));
			
			beginTimestamp=yjDateTime.getPriorQuantumTimestamp(endTimestamp,
                roomInfo.options.scope.value,roomInfo.options.scope.unit,roomInfo.options._timezone);		
			//console.log('beginTimestamp:'+yjDateTime.format(new Date(beginTimestamp),'YYYY-MM-DD HH:mm:ss'));
			
			/**
			 * beginTimestamp是区间的左边闭点，需要跳到下一个量子区间，然后回调1个显示单位
			 * 假设dataPointInterval是2D，如：2017-06-23，下一个区间2017-06-25，回调一天，x显示在2017-06-24(表示从23日0分0秒开始到24日59分59秒结束的点)
			 * @ignore
			 */
			var display_beginTimestamp=yjDateTime.getNextQuantumTimestamp(beginTimestamp,
                roomInfo.options.dataPointInterval.value,roomInfo.options.dataPointInterval.unit,
                roomInfo.options._timezone);
			display_beginTimestamp=yjDateTime.adjustPriorQuantumTimestamp(display_beginTimestamp,
                roomInfo.options.dataPointInterval.unit,
                roomInfo.options._timezone);
			//console.log('display_beginTimestamp:'+yjDateTime.format(new Date(display_beginTimestamp),'YYYY-MM-DD HH:mm:ss'));
			
			/**
			 * endTimtamp是区间的右边开点,只需要往前调整一个显示单位，如6月17日调整为6月16日。
			 * @ignore
			 */
			var display_endTimestamp=yjDateTime.adjustPriorQuantumTimestamp(endTimestamp,
                roomInfo.options.dataPointInterval.unit,
                roomInfo.options._timezone);
			//console.log('display_endTimestamp:'+yjDateTime.format(new Date(display_endTimestamp),'YYYY-MM-DD HH:mm:ss'));
			
			/**
			 * 获取x轴的显示点数目，当浏览器中的x轴用categories来显示label时会用到。
			 * @ignore
			 */
			var pointCount=0;
			if (roomInfo.options.scope.unit=='Y' && roomInfo.options.dataPointInterval.unit=='M'){
			    pointCount=Math.round(roomInfo.options.scope.value*12/roomInfo.options.dataPointInterval.value);
			}
			else if (roomInfo.options.scope.unit==roomInfo.options.dataPointInterval.unit){
                pointCount=Math.round(roomInfo.options.scope.value/roomInfo.options.dataPointInterval.value);
            }
			else{
			    var gap=display_endTimestamp-display_beginTimestamp;			
			    switch(roomInfo.options.dataPointInterval.unit){
                    case 'D':                     
                        pointCount=Math.round(gap/1000/60/60/24/roomInfo.options.dataPointInterval.value)+1;
                        break;
                    case 'h':
                        pointCount=Math.round(gap/1000/60/60/roomInfo.options.dataPointInterval.value)+1;
                        break;
                    case 'm':
                        pointCount=Math.round(gap/1000/60/roomInfo.options.dataPointInterval.value)+1;
                        break;
                    case 's':
                        pointCount=Math.round(gap/1000/roomInfo.options.dataPointInterval.value)+1;
                        break;
                    case 'ms':
                        pointCount=Math.round(gap/roomInfo.options.dataPointInterval.value)+1;
                        break;
                }			
			}
			roomInfo.scope={
				search:{
					beginTimestamp:beginTimestamp,
					endTimestamp:endTimestamp
				},
				/**
				 * 显示的区间都从1开始，到24,60结束
				 * @ignore
				 */
				display:{
					beginTimestamp:display_beginTimestamp,
					endTimestamp:display_endTimestamp,
					pointCount:pointCount
				}
			};
		}
		
		var old_initData_onBeforeLoad=op.biz.initData.onBeforeLoad;
		op.biz.initData.onBeforeLoad=function(roomInfo,nowTimestamp){
			//console.log('nowTimestamp:'+new Date(nowTimestamp));
			var currentTimestamp=roomInfo.quantumCurrentTimestamp(nowTimestamp);
			/**
			 * 根据浏览器的时区改变查询区间，保证浏览器本地时间区间是00:00-24:00
			 * 比如中国区，utc的00:00-24:00区间向左偏移了8小时，成为-8:00-16:00。
			 * 中国区的浏览区，要求x轴显示本地时间的00:00-24:00
			 * 如果服务器的初始资料查询区间是utc的00:00-24:00，即A-B,对应本地的utc查询区间是：(A+timezone)-(B+timezone),即A1-B1
			 * .当服务器的现在utc时间T在（A1-B1）左边，则查询区间为：(A1-1天)-(B1-1天)
			 * .当服务器的现在utc时间T在（A1-B1）中间，则查询区间为：A1-B1
			 * .当服务器的现在utc时间T在（A1-B1）右边，则查询区间为：(A1+1天)-(B1+1天)
			 */
			//console.log(now);
			/**
			 * 转成浏览器local时间
			 */
			makeScopeZone(roomInfo,nowTimestamp);
			
			if (currentTimestamp<roomInfo.scope.search.beginTimestamp){
				/**
				 * 当前时间在区间左边，区间移到前一天
				 */
			    console.log('currentTimestamp:'+new Date(currentTimestamp));
			    console.log('beginTimestamp:'+new Date(roomInfo.scope.search.beginTimestamp));
				throw new Error('currentTimestamp<beginTimestamp');
			}
			else if (currentTimestamp>=roomInfo.scope.search.endTimestamp){
				/**
				 * 当前时间在区间右边，区间移到后一天
				 */
				throw new Error('currentTimestamp>=endTimestamp');
			}
			//console.log('beginTimestamp:'+new Date(roomInfo.scope.search.beginTimestamp));
			//console.log('endTimestamp:'+new Date(roomInfo.scope.search.endTimestamp));
			//console.log('currentTimestamp:'+new Date(currentTimestamp));
			roomInfo.options.biz.initData.query.fromTimestamp=roomInfo.scope.search.beginTimestamp;
			roomInfo.options.biz.initData.query.toTimestamp=currentTimestamp;
			if (old_initData_onBeforeLoad){
			    old_initData_onBeforeLoad(roomInfo,nowTimestamp);
			}
		}
		
		var old_initData_onAfterLoad=op.biz.initData.onAfterLoad;
		op.biz.initData.onAfterLoad=function(roomInfo,data){
		    if (old_initData_onAfterLoad){
		        old_initData_onAfterLoad(roomInfo,data);
		    }
		}
		
		var old_initData_onBeforePush=op.biz.initData.onBeforePush;
		op.biz.initData.onBeforePush=function(roomInfo,socket,content){
		    if (content.isFirst==undefined){
		        content.isFirst=true;
		    }
			content.scope=roomInfo.scope.display;
			if (old_initData_onBeforePush){
			    old_initData_onBeforePush(roomInfo,socket,content);
			}
		}
		
		var old_realTimeData_onBeforeLoad=op.biz.realTimeData.onBeforeLoad;
		op.biz.realTimeData.onBeforeLoad=function(roomInfo,nowTimestamp){
			var currentTimestamp=roomInfo.quantumCurrentTimestamp(nowTimestamp);
			//console.log(’roomInfo.lastTimestamp:'+new Date(roomInfo.lastTimestamp));
			roomInfo.options.biz.realTimeData.query.fromTimestamp=roomInfo.lastTimestamp;
			roomInfo.options.biz.realTimeData.query.toTimestamp=currentTimestamp;
			if (old_realTimeData_onBeforeLoad){
			    old_realTimeData_onBeforeLoad(roomInfo,nowTimestamp);
			}
		}
		
		var old_realTimeData_onBeforePush=op.biz.realTimeData.onBeforePush;
		op.biz.realTimeData.onBeforePush=function(roomInfo,socket,content){
            content.isOverScope=roomInfo.isRealTimeOverScope;
            if (roomInfo.isRealTimeOverScope==true){
                content.scope=roomInfo.scope.display;
            }
            if (old_realTimeData_onBeforePush){
                old_realTimeData_onBeforePush(roomInfo,socket,content);
            }
        }
		
		var old_realTimeData_onAfterLoad=op.biz.realTimeData.onAfterLoad;
		op.biz.realTimeData.onAfterLoad=function(roomInfo,data){
		    if (old_realTimeData_onAfterLoad){
		        var result=old_realTimeData_onAfterLoad(roomInfo,data);
		        if (result==true){
		            return true;
		        }
		    }
			/**
			 * 把新资料加入到初始资料中，web端不知道biz推送1个或是几个点，按多个处理
			 */
			for (var i=0;i<data.length;i++){
				roomInfo.initData.push(data[i]);
			}
			/**
			 * 检查新的最后一个点的时间是否超过目前时间区间。注意：要求biz返回的资料按时间排序
			 * 当前时间区间是:roomInfo.scope.beginTimestamp<=xx<roomInfo.scope.endTimestamp
			 * 注意是半开半闭区间，左边闭右边开。
			 * 如果新的最后一点超过了当前时间区间，重新通知浏览器初始化
			 * 注意：没有等于，即最后的(D+1)00:00那个点会继续显示，否则最后一点无机会显示。
			 */
			roomInfo.isRealTimeOverScope=false;
			if (roomInfo.lastTimestamp>roomInfo.scope.search.endTimestamp){
			    roomInfo.isRealTimeOverScope=true;
				/**
				 * 重新设置时间区间，如果停留的太久，可能超过2天？
				 */
				//console.log(new Date(roomInfo.lastTimestamp));
				//console.log(new Date(roomInfo.scope.search.endTimestamp));
				makeScopeZone(roomInfo,roomInfo.lastTimestamp);
				//console.log('scope.beginTimestamp:'+new Date(roomInfo.scope.search.beginTimestamp));
				//console.log('scope.endTimestamp:'+new Date(roomInfo.scope.search.endTimestamp));
				/**
				 * 删除掉超过新的时间区间的点。
				 * data[i][0]是x值，因为x值是颗粒化的：
				 * .D 00:00是代表[(D-1):23:50-D:00:00)的数据，即上一天的最后一个点
				 * .D 00:10是代表[00:00-10:00)的数据，即本天第一个点
				 * .(D+1) 00:00是[D:23:50-(D+1):00:00)的数据，即本天最后一个点
				 * 所以是小于等于beginTimestamp，或者大于endTimestamp时才删除
				 */
				for (var i=roomInfo.initData.length-1;i>=0;i--){
					if (roomInfo.initData[i][0]<=roomInfo.scope.search.beginTimestamp || 
						roomInfo.initData[i][0]>roomInfo.scope.search.endTimestamp){
						roomInfo.initData.splice(i,1);
					};
				}

				if (roomInfo.options.isRepushInitData!=false && roomInfo.options.isRepushInitData!='false'){
					/**
					 * 重新推送初始资料
					 */
					roomInfo.pushInitData(null,roomInfo.initData,{
					    isFirst:false
					});
					return true;
				}				
			}		
			return false;
		}
		yjPusherTimer.buildRoom(op);
	}
}