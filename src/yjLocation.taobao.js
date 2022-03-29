/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjLocation_taobao
 */

/**
 * @exports yjLocation_taobao
 * @description <pre>淘宝提供的定位API。
 * API说明：http://ip.taobao.com/instructions.html
 * 访问限制：小于1qps
 * url:"http://ip.taobao.com/service/getIpInfo.php"</pre>
 * @example <pre>
 * var yjLocation_taobao=yjRequire("yujiang.Foil","yjLocation.taobao.js");
 * </pre>
 * @see nodejs::yjRequire
 */
var yjREST=require("./yjREST.js");
module.exports={
	/**
	 * <pre>从IP地址获取物理位置信息。
	 * 返回资料：如IP：104.248.173.148
	 * {
	 *     "code":0,
	 * 	   "data":{
	 *  		"ip":"104.248.173.148",
	 * 			"country":"英国",
	 * 			"area":"",
	 * 			"region":"伦敦",
	 * 			"city":"伦敦",
	 * 			"county":"XX",
	 * 			"isp":"XX",
	 * 			"country_id":"GB",
	 * 			"area_id":"",
	 * 			"region_id":"GB_H9",
	 * 			"city_id":"GB_1021",
	 * 			"county_id":"xx",
	 * 			"isp_id":"xx"
	 * 		}
	 * }
     * 没有经纬度，可以查询国外IP。
	 * 返回的是子串，常常报错：502 Bad Gateway
	 * </pre>
     * @param {string} IP - IP地址
	 * @param {callback_success} callback - <pre>回调函数，返回的data结构如下：
	 * {
	 *     country:xxx,     //国家
	 *     area:xxx,        //地区
	 *     province:xxx,    //省
	 *     city:xxx,        //市
	 *     district:xxx,    //区
	 *     county:xxx       //县
	 * }</pre>
	 * @return {void}
	 */
	getLocationByIp:function(IP,callback){		
		yjREST.get({
			url:"http://ip.taobao.com/service/getIpInfo.php",
			query:{
				ip:IP
			},
			success:function(result){
				//console.log(result);
				try{
					if (result.code==0){
						callback({
							country:result.data.country,
							area:result.data.area,
							province:result.data.region,
							city:result.data.city,
							district:"",
							county:result.data.county,
							longitude:result.longitude,
							latitude:result.latitude
						});
					}
					else{
						console.log(result);
						callback({});
					}	
				}
				catch(err){

					console.log(err);
					callback({});
				}
			},
			error:function(err){
				console.log(err);
				callback({});
			}
		});
	}
}