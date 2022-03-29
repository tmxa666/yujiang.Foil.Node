/**
 * @author mustapha.wang
 * @fileOverview
 * @see module:yjSMS_mzkj
 */

/**
 * <pre>拇指科技的短信API。
 * url:http://www.symzcm.net/
 * 错误举例：
 * errorSMS send error:包含屏蔽词：付款</pre>
 * @exports yjSMS_mzkj
 * @see module:yjSMS
 * @example <pre>
 * var yjSMS_mzkj=yjRequire("yujiang.Foil","yjSMS.mzkj.js");
 * </pre>
 * @see nodejs::yjRequire
 */
module.exports = {
	/**
	 * 向一个或多个手机号码发送短信息。
	 * @param {object} options
	 * @param {string[]} options.phones - 手机号码，数组。
	 * @param {boolean} options.isAutoSignature - 预设为true,true表示如果有
	 * 签名参数signature,则使用signature，否则使用预设的【弘讯软件】作为参数。
	 * false表示不使用签名，签名由短信服务商自动添加
     * @param {string} options.msg - 短信息内容。发送时，会自动在最后加上“【弘讯软件】”作为签名。
     * @param {callback_success} options.success - 成功后的回调函数。
     * @param {callback_error} options.error - 失败后的回调函数。
     * @return {void}
	 */
	send : function(options) {
		var startTime=new Date();
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
		//zcl content 为短信内容
		var content="";
		if(options.isAutoSignature==undefined||options.isAutoSignature==null){
			options.isAutoSignature=true;
		}
		//不与BizServer的接口共用，因为调用BizServer可能使用native
		var yjREST=require("./yjREST.js");
		if(options.isAutoSignature==true){
			if (options.signature){
				var signature=options.signature;
			}
			else{
				var signature="【弘讯软件】";
			}
			content=signature+options.msg;
		}else{
			content=options.msg;
		}
		//console.log(content);
		yjREST.post({
		    //engine:"remote.superagent",
			url:"http://www.qf106.com/sms.aspx",
			isTextPlain:true,
			query:{
				action:"send",
				userid:"15550",//"11331",
				account:"tmxian",//"dd1407",
				password:"123456",
				mobile:options.phones.join(","),
				content:content
			},
			success:function(data){				
				//console.log("发送短信毫秒："+(new Date().getTime()-startTime.getTime()).toString());
				//console.log("【弘讯软件】"+options.msg);
				//console.log(data);
				var xml = require('xml2js');
				
				xml.parseString(data, function (err, result) {
					if (err){
						callerror(err.message);
					}
					else{
					    //console.dir(result);
					    if (result.returnsms.returnstatus=="Success"){
					    	if (options.success){
					    		options.success("SMS send success:"+result.returnsms.message);
					    	}
						}
						else{
							callerror("SMS send error:"+result.returnsms.message);
						}
					}
				});
			},
			error:function(err){
				callerror("SMS send error:"+err.message);
			}
		});
	}
}