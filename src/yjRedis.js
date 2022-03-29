/**
 * @author mustapha.wang
 * @fileOverview
 * @see module:yjRedis
 */

/**
 * Redis服务器引擎
 * @exports yjRedis
 * @example <pre>
 * var yjRedis=yjRequire("yujiang.Foil","yjRedis.js");
 * </pre>
 * @see nodejs::yjRequire
*/
var redis = require("redis");
var yjError = require("./yjError.js");
/**
 * 创建客户端
 */
module.exports.createClient = function() {
	var client=null;
	if (global.yjGlobal.config.cache) {
		client = redis.createClient(
			global.yjGlobal.config.cache.connection.port,
			global.yjGlobal.config.cache.connection.host);
		if (global.yjGlobal.config.cache.connection.password){
			client.auth(global.yjGlobal.config.cache.connection.password);
		}
	} else {
		client = redis.createClient();
	}
	return client;
}
/**
 * 执行
 */
module.exports.exec = function(sender) {
	var client = exports.createClient();
	client.on("error", function(err) {
		yjError.handleResult(sender, err, data);
	});

	sender.work(client, function(err, replies) {
		client.quit();
		yjError.handleResult(sender, err, replies);
	});
}
/**
 * multi
 */
module.exports.multi = function(sender) {
	try {
		var client = exports.createClient();
		var multi = client.multi();
		client.on("error", function(err) {
			yjError.handleResult(sender, err);
		});
		function exec() {
			multi.exec(function(err, replies) {
				client.quit();
				yjError.handleResult(sender, err, replies);
			});
		}
		sender.work(client, multi, exec);		
	} catch (err) {
		yjError.handleResult(sender, err);
	}
}