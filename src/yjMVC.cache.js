/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjMVC_cache
 */

/**
 * @module yjMVC_cache
 * @description <pre>处理页面缓存。使加快载入速度。
 * 是否使用view的cache机制，由config.cache.isCacheView=true决定。
 * 如果统一处理页面缓存，要考虑：
 * （1）如何做过期机制？
 * （2）使用本地文件来缓存时，如果用key做为文件名，可能超出文件名的最大长度255，因此用内存方式</pre>
 * @example <pre>
 * var yjMVC_cache=yjRequire("yujiang.Foil","yjMVC.cache.js");
 * </pre>
 * @see nodejs::yjRequire
 */

/**
 * 从请求req内容中生成一个Key，使用了url和query参数
 * @function getKey
 * @param {HTTPRequest} req 请求元件
 * @return {string} 生成的Key
 */
module.exports.getKey = function(req) {
	var key = {
		url : req.url,
		query : req.query
	};
	key =Buffer.from(JSON.stringify(key)).toString("base64");
	key = encodeURIComponent(key);
	return key;
}

function isCachedView() {
	return (global.yjGlobal.config.cache.isCacheView == true);
}
/**
 * 保存要缓存的内容。只有req.method='get'时才会缓存。
 * @function write
 * @param {HTTPRequest} req 请求元件
 * @param {string} html html内容
 * @param {callback_success} success
 * @param {callback_error} error
 * @return {void}
 */
module.exports.write = function(req, html, success, error) {
	if (isCachedView() != true) {
		if (error)
			error(new Error("Config 'cache.isCacheView' is not true."));
		return;
	}
	if (req.method.toLowerCase() == "get") {
		var key = exports.getKey(req);
		var yjCache = require("./yjCache.js");
		yjCache.write(key, html, function(data) {
			if (success)
				success(data);
		}, function(err) {
			if (error)
				error(err);
		});
	}
}
/**
 * 从缓存的内容中读取。只有req.method='get'时才会尝试读取缓存。
 * @function read
 * @param {HTTPRequest} req 请求元件
 * @param {HTTPResponse} res 响应元件
 * @param {callback_success} success
 * @param {callback_error} error
 * @return {void}
 */
module.exports.read = function(req, res, success, error) {
	if (isCachedView() != true) {
		if (error)
			error(new Error("Config 'cache.isCacheView' is not true."));
		return;
	}
	if (req.method.toLowerCase() == "get") {
		var yjCache = require("./yjCache.js");
		var key = exports.getKey(req);
		yjCache.read(key, function(data) {
			res.send(data);
			if (success)
				success(data);
		}, function(err) {
			if (error)
				error(err);
		});
	} else {
		if (error) {
			error(new Error("Is not 'get' type method.Can`t use cache."));
		}
	}
}