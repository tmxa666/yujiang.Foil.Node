/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjLocation_webxml
 */

/**
 * @module yjLocation_webxml
 * @description <pre>webxml提供的定位API。
 * soap url:"http://webservice.webxml.com.cn/WebServices/IpAddressSearchWebService.asmx?wsdl"
 * rest url:"http://webservice.webxml.com.cn/WebServices/IpAddressSearchWebService.asmx/getCountryCityByIp"</pre>
 * @example <pre>
 * var yjLocation_webxml=yjRequire("yujiang.Foil","yjLocation.webxml.js");
 * </pre>
 * @see nodejs::yjRequire
 */
module.exports={
	getLocationByIp : function(IP,callback) {		
		var soap = require("soap");
		soap.createClient(
			"http://webservice.webxml.com.cn/WebServices/IpAddressSearchWebService.asmx?wsdl",
			function(err, client) {
				if (err){
					console.log(err);
					callback({});
				}
				else{
			        client.getCountryCityByIp(
			        	{theIpAddress:IP}, 
			        	function(err, result) {
			        		console.log(result);
			        		callback({
			        			address:result.getCountryCityByIpResult.string[1]
			        		});	
			        	}
			        );
				}
			}
		);
	},
	getLocationByIp2 : function(IP,callback) {		
		var restler = require("restler");
		var call=restler.get(
			"http://webservice.webxml.com.cn/WebServices/IpAddressSearchWebService.asmx/getCountryCityByIp",
			{
				query : {
					theIpAddress : IP
				}
			}
		);

		call.on("complete", function(result,response){
			if (result instanceof Error) {
				callback({});
			}
			else{
				try{
					console.log(result);
					callback({
						address:result
					});					
				}
				catch(err){
					callback({});
				}
			}				
		});
	}
}