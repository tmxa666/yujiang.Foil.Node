/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjLocation_baidu
 */

/**
 * <pre>百度的定位API。
 * url:http://api.map.baidu.com/location/ip
 * 不能查询国外的IP
 * ak账号来源：http://lbsyun.baidu.com/apiconsole/key
 * 使用百度账号：mustapha.wang@163.com
 * 需要设置发起调用的IP白名单。
 * 出错时格式：
 * 	 {   status: 1,
 * 	 	 message: 'Internal Service Error:ip[106.193.235.215] loc failed' 
 * 	 }
 * 	无错误时格式：
 * 	 {   address: 'CN|陕西|西安|None|CMNET|0|0',
 * 	 	 content:{ 
 * 	 		 address: '陕西省西安市',
 * 	 	     address_detail:	{ 
 * 	 		     city: '西安市',
 * 	 			 city_code: 233,
 * 	 			 district: '',
 * 	 			 province: '陕西省',
 * 	 			 street: '',
 * 	 			 street_number: '' 
 * 	 		 },
 * 	 		 point: { x: '108.95309828', y: '34.27779990' } 
 * 	 	 },
 * 	 	 status: 0 
 * 	 }
 * </pre>
 * @exports yjLocation_baidu
 * @see yjLocation
 * @example <pre>
 * var yjLocation_baidu=yjRequire("yujiang.Foil","yjLocation.baidu.js");
 * </pre>
 * @see nodejs::yjRequire
 */

var yjREST=require("./yjREST.js");
var g_ak="Xtbb9ASaxH6xpZGl7IYImiXr";
module.exports={
	/**
	 * 从IP地址获取位置信息(国家、省、市、区，经纬度)
	 * @param {string} IP 
	 * @param {callback} callback 
	 */
	getLocationByIp:function(IP,callback){
		yjREST.get({
			url:"http://api.map.baidu.com/location/ip",
			query : {
				ak:g_ak,
				coor:'bd09ll',
				ip:IP
			},
			success:function(result){
				try{
					if (result.status==0){
						var country=result.address?result.address.split("|")[0]:'';
						if (country=='CN') country='中国';
						callback({
							country:country,
							province:result.content.address_detail.province,
							city:result.content.address_detail.city,
							district:result.content.address_detail.district,
							street:result.content.address_detail.street,
							address:result.content.address,
							latitude:result.content.point.y,
							longitude:result.content.point.x
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
	},
	/**
	 * 从国家、省、市获取经纬度
	 * @param {string} country 国家
	 * @param {string} province 省
	 * @param {string} city 市
	 * @param {callback} callback 
	 */
	getLocationByName:function(country,province,city,callback){
		//{"status":0,
		// "message":"ok",
		// "results":[{
		//		"name":"西安市",
		//   	"location":{
		//			"lat":34.347269,
		//			"lng":108.946465
		//		},
		//		"uid":"6004101013367be6b817e7e7"
		// }]}
		if (!country||country=='XX'||country=='null'){
			callback({});
			return;
		}
		var url="http://api.map.baidu.com/place/v2/search";
		if (country!="中国" && country!='CN') url="http://api.map.baidu.com/place_abroad/v1/search";
		//中国.台湾.XX
		yjREST.get({
			url:url,
			query:{
				query:city=='XX'?province:city,
				region:country+(province=='XX'?'':province),
				ak:g_ak,
				output:"json",
				scope:1
			},
			success:function(result){
				//console.log(result);
				try{
					if (result.status==0 && result.results && result.results.length>0){
						callback({
							address:result.results[0].name,
							latitude:result.results[0].location?result.results[0].location.lat:null,
							longitude:result.results[0].location?result.results[0].location.lng:null
						});
					}
					else{
						console.log(result);
						callback({});
					}		
				}
				catch(err){
					console.log(result);
					err.country=country;
					err.province=province;
					err.city=city;
					console.log(err);
					callback({});
				}
			},
			error:function(err){
				err.country=country;
				err.province=province;
				err.city=city;
				console.log(err);
				callback({});
			}
		});
	},
	/**
	 * 
	 * @param {float} lat 纬度
	 * @param {float} lng 经度
	 * @param {*} callback 
	 */
	getLocationByLatLng:function(lat,lng,callback){
		var url='http://api.map.baidu.com/reverse_geocoding/v3';
		yjREST.get({
			url:url,
			query:{
				location:{
					lat:lat,
					lng:lng
				},
				ak:g_ak,
				output:"json"
			},
			success:function(result){
				console.log(result);
				try{
					if (result.status==0){
						callback({
							country:result.addressComponent.country,
							province:result.addressComponent.province,
							city:result.addressComponent.city,
							district:result.addressComponent.district,
							address:result.formatted_address
						});		
					}
					else{
						console.log(result);
						callback({});
					}		
				}
				catch(err){
					console.log(JSON.result);
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