/**
 * @author 赵传龙
 * @ignore
 */
var Auth = require('bce-sdk-js').Auth;

var yjSMSBaiduSDK={
	generateAuthorization:function(options) {
		var auth = new Auth(options.ak, options.sk);
		var timestamp = Date.parse(new Date(options.x_bce_date));
		timestamp = timestamp / 1000;
		var signature = auth.generateAuthorization(options.method, options.uri,
			 options.params, options.headers, timestamp,1800,["host","x-bce-date"]);
		return signature;
	}
}
module.exports=yjSMSBaiduSDK;