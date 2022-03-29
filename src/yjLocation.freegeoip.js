/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjLocation_freegeoip
*/

/**
 * <pre>
 * url:http://freegeoip.net/json/?
 * 不太准：222.41.8.26本来应该是西安，结果为北京
 * { ip: '127.0.0.1',
 *   country_code: 'RD',
 *   country_name: 'Reserved',
 *   region_code: '',
 *   region_name: '',
 *   city: '',
 *   zipcode: '',
 *   latitude: 0,
 *   longitude: 0,
 *   metro_code: '',
 *   area_code: '' 
 * }
 * </pre>
 * @exports yjLocation_freegeoip
 * @example <pre>
 * var yjLocation_free=yjRequire("yujiang.Foil","yjLocation.freegeoip.js");
 * </pre>
 * @see nodejs::yjRequire
 */
module.exports={
	/**
	 * 从IP地址获取物理位置信息。
	 */
	getLocationByIp:function(IP,callback){		
		var restler = require("restler");
		var call=restler.get(
			"http://freegeoip.net/json/"+IP
		);

		call.on("complete", function(result,response){
			console.log(result);
			if (result instanceof Error) {
				console.log(result);
				callback({});
			}
			else{
				try{
					if (result.country_name=="Reserved"){
						callback({});
					}
					else{
						callback({
							country:result.country_name,
							province:result.region_name,
							city:result.city,
							district:"",
							longitude:result.longitude,
							latitude:result.latitude
						});	
					}				
				}
				catch(err){
					console.log(err);
					callback({});
				}
			}				
		});
	}
}