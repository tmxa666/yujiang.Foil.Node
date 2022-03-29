var yjSMSBaiduSDK = require("./yjSMS.baiduSDK.js");
module.exports = {
	/**
	 * 向一个手机号码发送短信息,百度只支持一个
	 * 详情API参看https://cloud.baidu.com/doc/SMS/API.html#.E7.9F.AD.E4.BF.A1.E4.B8.8B.E5.8F.91
	 * @param {object} options
	 * @param {string[]} options.phone - 手机号码。
	 * @param {boolean} options.templateCode 短信模板id
     * @param {string} options.contentVar - object 模板中的占位变量。、
     	例如{
			"count":"1",
			"cost":"3000"
		}
     * @param {callback_success} options.success - 成功后的回调函数。
     * @param {callback_error} options.error - 失败后的回调函数。
     * @return {void}
	 */
	send : function(options) {
		var smsOptions= global.yjGlobal.config.sms.baidu;
		if(!smsOptions||!smsOptions.ak||!smsOptions.sk||!smsOptions.invokeId){
			console.log("baidusms options is correct,you must set ak、sk and invokeId");
			return;
		}
		var startTime=new Date();
		function callerror(msg){
			if (options.error){
				options.error(new Error(msg));
			}
			else{
				console.log(msg);
			}			
		}
		if (!options.phone || options.phone.length==0){
			callerror("options.phone is empty.");
			return;
		}
		else if (!options.templateCode || options.templateCode.length==0){
			callerror("options.templateCode is empty.");
			return;
		}
		if(!options.contentVar){
			options.contentVar={};
		}
       
       	var x_bce_date=(new Date()).toISOString().replace(/\.\d+Z$/, 'Z');
		var authorizationOption={
			method:"POST",
			uri:"/api/v3/sendSms",  
			params:{},
			headers:{
				'Host':'smsv3.bj.baidubce.com', 
				'x-bce-date':x_bce_date
			},
			x_bce_date:x_bce_date,
			ak:smsOptions.ak,
			sk:smsOptions.sk
		}
		var authorization=yjSMSBaiduSDK.generateAuthorization(authorizationOption);
		var yjREST=require("./yjREST.js");
		var content={
			"mobile":options.phone,
			"template":options.templateCode,
			"signatureId":smsOptions.invokeId,	
			"contentVar":options.contentVar
		}
		yjREST.post({
			url:"http://smsv3.bj.baidubce.com/api/v3/sendSms",
			headers:{
				"Content-Type":"application/json;charset=UTF-8",
				"x-bce-date":x_bce_date,
				"Authorization":authorization,
				'Host':'smsv3.bj.baidubce.com'
			},
			data:content,
			success:function(data){				
				if (data.code==1000){
					if (options.success){
						options.success("SMS send success:"+JSON.stringify(data));
					}
				}
				else{
					callerror("SMS send error1:"+data.message);
				}
			},
			error:function(err){
				callerror("SMS send error2:"+err.message);
			}
		});
	}
}