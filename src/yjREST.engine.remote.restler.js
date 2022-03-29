/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjREST_engine_remote_restler
 * @desciption
 * 已知问题：
 * （1）会把body资料的{SortNumber: 11}编码成{ SortNumber:'11'}，即数据类型从int变为string。
 *     http://192.168.11.5:8080/browse/FOILNODE-148
 * （2）会把body资料的{SortNumber: null}编码成{ SortNumber:''}，即数据类型从null变为string。
 *     http://192.168.11.5:8080/browse/FOILNODE-38
*/

/**
 * restler引擎
 * @module yjREST_engine_remote_restler
 * @see module:yjREST
 * @example <pre>
 * var yjREST_restler=yjRequire("yujiang.Foil","yjREST.engine.remote.restler.js");
 * </pre>
 * @see nodejs::yjRequire
 */
throw new Error('remote.restler已经废止，请使用remote.superagent!');
var methods = require("methods");
var yjError=require("./yjError.js");
var restUtil=require("./yjREST.util.js");
methods.forEach(function(method) {
	exports[method] = function(options) {
		var url = restUtil.generateURL(options);
		var restler = require("restler");
		var call = restler[method](url, {
			query:options.query,
			data:options.data,
			headers:options.headers
		});	

		// complete事件不是像文档描述一致，有错误时，result不是Error
		/*
		 * call.on('complete', function(result, response) {
		 * console.log("complete..........."+typeof(result)); if (result
		 * instanceof Error) {
		 * console.log("error..........."+JSON.stringify(result));
		 * options.error(result); } else { options.success(result); } });
		 */
		call.on('success', function(data, response) {
			yjError.handleResult(options, null,data);
		});
		call.on('fail', function(data, response) {
			//console.log("fail......" + typeof (data));
			yjError.handleResult(options,new Error(data));
		});
		call.on('error', function(err, response) {
			//console.log("error......");
			yjError.handleResult(options,err);
		});
	}
});