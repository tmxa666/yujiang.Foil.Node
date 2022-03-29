/**
 * @author zhaotao
 * 调用联通接口操作联通卡状态
 * var yjSIM = yjRequire("yujiang.Foil","yjSIM.Unicom.js");
 */
var yjREST = yjRequire("yujiang.Foil","yjREST.engine.remote.superagent.js");
var yjDateTime = global.yjRequire("yujiang.Foil").yjDateTime;
var yjLog = global.yjRequire("yujiang.Foil").yjLog;
var sm3 = require('sm3');
var simInfo = {
	"8986061914000":{
		app_id:"s1hD2xJP7O",
		app_secret:"tYgRxGfPWzy9f2pna3JE92xPaYeM6d",
		openId:"27132ou5wUtkBD7"
	},
	"8986091971000":{
		app_id:"jpdfsAV43e",
		app_secret:"EXG0HVYfgFK9yWQtfgdI3oBAMVbWEh",
		openId:"27133ouf8FxXveg"
	}
}
module.exports={
	/**
	 * 更改SIM卡状态
	 * @param {object} options
	 * @param {string} iccid 卡iccid
	 * @param {string} status 卡状态 '2'：激活；'3':停用
	 * @param {callback_success} options.success - 成功后的回调函数。
     * @param {callback_error} options.error - 失败后的回调函数。
	 */
	changeSIMState:function(options){
		var iccid = options.iccid;
		var status = options.status;
		var app_id = "s1hD2xJP7O";
		var app_secret = "tYgRxGfPWzy9f2pna3JE92xPaYeM6d";
		var openId = "27132ou5wUtkBD7";
		var info = simInfo[iccid.substring(0,13)];
		if (info) {
			app_id = info.app_id;
			app_secret = info.app_secret;
			openId = info.openId;
		}
        var date = new Date();
        var currentTime = yjDateTime.format(date,"YYYY-MM-DD HH:mm:ss SSS");

	    var trans_id='';
		for(var i=0;i<6;i++){
	        trans_id+= Math.floor(Math.random()*10);  
	    }
	    trans_id = yjDateTime.format(date,"YYYYMMDDHHmmssSSS") + trans_id;
	    var sign="app_id"+app_id+"timestamp"+currentTime+"trans_id"+trans_id+app_secret;
        var signData = sm3(sign);
       
        yjREST.post({
	        url:"https://gwapi.10646.cn/api/wsEditTerminal/V1/1Main/vV1.1",
	        data:{
	            app_id:app_id,
	            timestamp:currentTime,
	            trans_id:trans_id,
	            token:signData,
	            data:{
	                messageId:'1',
	                openId:openId,
	                version:'1.0',
	                asynchronous:"1",
	                iccid:iccid,
	                targetValue:status,  //
	                changeType:3  //修改的类型 列 1.设备id，
	            }
	        },
	        headers:{"Content-Type": "application/json"},
	        success:function(data){
	        	options.success(data);
	        },
	        error:function(err){
	            options.error(err);
	        }
	    })
	},
	/**
	 * 查询卡每月流量使用量
	 * @param {object} options
	 * @param {string} iccid 卡iccid
	 * @param {string} month 月份,超出月份返回resultCode:1074
	 * @param {callback_success} options.success - 成功后的回调函数。
     * @param {callback_error} options.error - 失败后的回调函数。
	 */
	getTerminalUsage:function(options){
	 	var iccid = options.iccid;
	 	var months = options.months
	 	var app_id = "s1hD2xJP7O";
		var app_secret = "tYgRxGfPWzy9f2pna3JE92xPaYeM6d";
		var openId = "27132ou5wUtkBD7";
		var info = simInfo[iccid.substring(0,13)];
		if (info) {
			app_id = info.app_id;
			app_secret = info.app_secret;
			openId = info.openId;
		}
		var terminalusages = [];
		var i = 0;
		post2UnicomApi(i,months,terminalusages,app_id,app_secret,openId,iccid,options);
	},
	/**
	 * 查询卡流量使用详情
	 * @param {object} options
	 * @param {string} iccid 卡iccid
	 * @param {string} month 月份，超出月份返回resultCode:1074
	 * @param {string} startTime 开始时间
	 * @param {callback_success} options.success - 成功后的回调函数。
     * @param {callback_error} options.error - 失败后的回调函数。
	 */
	getTerminalUsageDataDetails:function(options){
		var date = new Date();
	 	var iccid = options.iccid;
	 	var currentTime = yjDateTime.format(new Date(),"YYYY-MM-DD HH:mm:ss SSS");
	 	var app_id = "s1hD2xJP7O";
		var app_secret = "tYgRxGfPWzy9f2pna3JE92xPaYeM6d";
		var openId = "27132ou5wUtkBD7";
		var info = simInfo[iccid.substring(0,13)];
		if (info) {
			app_id = info.app_id;
			app_secret = info.app_secret;
			openId = info.openId;
		}
		var trans_id='';
		for(var i=0;i<6;i++){
	        trans_id+= Math.floor(Math.random()*10);  
	    }
	    trans_id = yjDateTime.format(date,"YYYYMMDDHHmmssSSS") + trans_id;
		var sign = "app_id" + app_id + "timestamp" + currentTime + "trans_id" + trans_id + app_secret
		var signData = sm3(sign);

		yjREST.post({
			url:"https://gwapi.10646.cn/api/wsGetTerminalUsageDataDetails/V1/1Main/vV1.1",
			data:{
				app_id: app_id,
				timestamp: currentTime,
			    trans_id: trans_id,
			    token: signData,
			    date:{
			    	messageId:'1',
	                openId:openId,
	                version:'1.0',
	                iccid:iccid,
	                billingCycle:options.month,
	                cycleStartDate: options.startTime//'2020-04-01 00:00:00'
			    }
			},
		    headers:{"Content-Type": "application/json"},
		    success:function(data){
	        	options.success(data);
	        },
	        error:function(err){
	            options.error(err);
	        }
		})
	}
}

function post2UnicomApi(index,months,terminalusages,app_id,app_secret,openId,iccid,options)
{
	var date = new Date();
	var currentTime = yjDateTime.format(new Date(),"YYYY-MM-DD HH:mm:ss SSS");
	var trans_id='';
	for(var j=0;j<6;j++){
        trans_id+= Math.floor(Math.random()*10);  
    }
	trans_id = yjDateTime.format(date,"YYYYMMDDHHmmssSSS") + trans_id;
	var sign = "app_id" + app_id + "timestamp" + currentTime + "trans_id" + trans_id + app_secret
	var signData = sm3(sign);
	yjREST.post({
		url:"https://gwapi.10646.cn/api/wsGetTerminalUsage/V1/1Main/vV1.1",
		data:{
			app_id: app_id,
			timestamp: currentTime,
		    trans_id: trans_id,
		    token: signData,
		    data:{
		    	messageId:'1',
                openId:openId,
                version:'1.0',
                iccid:iccid,
                billingCycle:months[index]
		    }
		},
	    headers:{"Content-Type": "application/json"},
	    success:function(data){
	    	if (data.status == "0000" && data.data.resultCode == "0000") 
	    	{
	    		terminalusages.push({month:months[index],totalDataVolume:data.data.totalDataVolume});
	    	}
	    	else if (data.status == "0000" && data.data.resultCode == "1074") 
	    	{
	    		terminalusages.push({month:months[index],totalDataVolume:0});
	    	}
	    	else
	    	{
	    		yjLog.info(data);
	    	}
	    	index ++;
	    	if (index == months.length) 
	    	{
	    		options.success(terminalusages);
	    	}
	    	else
	    	{
	    		post2UnicomApi(index,months,terminalusages,app_id,app_secret,openId,iccid,options);
	    	}
        },
        error:function(err){
        	yjLog.info(err);
        	index ++;
        	if (index == months.length) 
        	{
        		options.error(err);
        	}
        	else
        	{
        		post2UnicomApi(index,months,terminalusages,app_id,app_secret,openId,iccid,options);
        	}
        }
	})
}