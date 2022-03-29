/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjLocation_sina
 */

/**
 * @exports yjLocation_sina
 * @description <pre>sina提供的API。
 * url:"http://int.dpool.sina.com.cn/iplookup/iplookup.php"
 * 返回结构：
 * {
 *     "ret":1,
 *     "start":-1,
 *     "end":-1,
 *     "country":"\u4e2d\u56fd",
 *     "province":"\u5317\u4eac",
 *     "city":"\u5317\u4eac",
 *     "district":"",
 *     "isp":"",
 *     "type":"",
 *     "desc":""
 * }</pre>
 * @see yjLocation_taobao
 * @see yjLocation
 * @example <pre>
 * var yjLocation_sina=yjRequire("yujiang.Foil","yjLocation.sina.js");
 * </pre>
 * @see nodejs::yjRequire
 */
module.exports={
	getLocationByIp : function(IP,callback) {		
		var restler = require("restler");
		var call=restler.get(
			"http://int.dpool.sina.com.cn/iplookup/iplookup.php",
			{
				query : {
					format:"json",
					theIpAddress : IP
				}
			}
		);

		call.on("complete", function(result,response){
		    console.log(result);
		    //console.log(response);
			if (result instanceof Error) {
				callback({});
			}
			else{
				try{
					var location=JSON.parse(result);
					callback({
						country:location.country,
						province:location.province,
						city:location.city,
						district:location.district
					});
				}
				catch(err){
					callback({});
				}
			}				
		});
	}
}