/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjLocation
 */

/**
 * @exports yjLocation
 * @description 物理位置定位。<br/>
 * 注意：在BAE中，百度的定位服务才允许发起调用，在外面不允许。
 * @example <pre>
 * var yjLocation=yjRequire("yujiang.Foil","yjLocation.js");
 * </pre>
 * @see nodejs::yjRequire
 */
module.exports = {
	/**
	 * 获取调用者的IP地址
	 * @param {HTTPRequest} req - 请求元件
	 * @return {string} - 返回IP地址
	 */
	getClientIP : function(req) {
		//console.log("req.socket.remoteAddress:"+(req.socket && req.socket.remoteAddress));
		//console.log("req.connection.socket.remoteAddress:"+(req.connection.socket && req.connection.socket.remoteAddress));
		var ips= req.headers['x-real-ip'] || req.headers['x-forwarded-for']
			|| (req.connection && req.connection.remoteAddress) 
			|| (req.socket && req.socket.remoteAddress)
			|| (req.connection.socket && req.connection.socket.remoteAddress);
		if (ips){
			//格式是：::ffff:36.23.216.182
			ips=ips.split(",")[0];
			ips=ips.split(":");
			return ips[ips.length-1];
		}
		else return "";
	},
	/**
	 * 从IP地址获得物理位置
	 * @function
	 * @param {string} IP - IP地址
	 * @param {callback_success} callback - <pre>回调函数，返回的data结构如下：
	 * {
	 *     country:xxx,     //国家
	 *     province:xxx,    //省
	 *     city:xxx,        //市
	 *     district:xxx,    //区
	 *     latitude:xxx,    //纬度
	 *     longitude:xxx    //经度
	 * }</pre>
	 * @return {void}
	 */
	getLocationByIp : function(IP,callback){
		//2019/7/7:淘宝能获取国外的IP位置，百度只能查询国内IP，从名称定为也只能查国内的
		var yjBaiDu=require("./yjLocation.baidu.js");
		var yjTaoBao=require("./yjLocation.taobao.js");
		yjTaoBao.getLocationByIp(IP,function(data){
			if (data.country!='中国'){
				callback(data);
				return;
			}
			yjBaiDu.getLocationByName(data.country,data.province,data.city,function(data2){
				data.latitude=data2.latitude;
				data.longitude=data2.longitude;
				callback(data);
			});
		});
	}
}