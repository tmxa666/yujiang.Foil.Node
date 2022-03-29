/**
 * @author mustapha.wang
 * @fileOverview
 * @see module:yjSMS_sxt
 */

/**
 * 思讯通提供的短信API。
 * url:http://shsixun.com/
 * @exports yjSMS_sxt
 * @see module:yjSMS
 * @example <pre>
 * var yjSMS_mzkj=yjRequire("yujiang.Foil","yjSMS.mzkj.js");
 * </pre>
 * @see nodejs::yjRequire
 */
module.exports = {
	/**
	 * 向一个或多个手机号码发送短信息。
	 */
	send : function(options) {
		function callerror(msg){
			if (options.error){
				options.error(new Error(msg));
			}
			else{
				console.log(msg);
			}			
		}
		if (!options.phones || options.phones.length==0){
			callerror("options.phones is empty.");
			return;		
		}
		else if (!options.msg || options.msg.length==0){
			callerror("options.msg is empty.");
			return;
		}
		//不与BizServer的接口共用，因为调用BizServer可能使用native
		var yjREST=require("./yjREST.js");
		if (options.signature){
			var msg=options.signature;
		}
		else{
			var msg="【弘讯软件】";
		}
		msg=msg+options.msg;
		yjREST.post({
			//zcl 思迅通更换了api地址
			url:"http://sms.shsixun.com/Port/default.ashx",
			// url:"http://122.144.130.35/Port/default.ashx",
			query:{
				method:"SendSms",
				username:"wangxinghua",
				password:"chuandao",
				phonelist:options.phones.join(","),
				msg:msg
			},
			success:function(data){				
				var strs=data.split(":");
				if (parseInt(strs[0])==1){
					if (options.success){
						options.success("SMS send success:"+JSON.stringify(data));
					}
				}
				else{
					callerror("SMS send error:"+data);
				}
			},
			error:function(err){
				callerror("SMS send error:"+err.message);
			}
		});
	}
}