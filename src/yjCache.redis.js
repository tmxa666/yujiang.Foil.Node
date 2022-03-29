/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjCache_redis
 */

/**
 * 在redis服务器保存上传的文件
 * @module yjCache_redis
 * @see yjCache_native
 * @example <pre>
 * var yjCache_redis=yjRequire("yujiang.Foil","yjCache.redis.js");
 * </pre>
 * @see nodejs::yjRequire
 */
var yjRedis = require("./yjRedis.js");
module.exports = {
	/**
	 * 上传文件
	 * @param {HTTPRequest} req
	 * @param {callbak_success} success
	 * @param {callback_error} error
	 */
	upload : function(req, success, error) {
		var yjUpload = require("./yjCache.redis.upload.js");
		yjUpload(req, success, error);
	},
	/**
	 * 下载文件
	 * @param {string} key
	 * @param {HTTPRequest} req
	 * @param {callbak_success} success
	 * @param {callback_error} error
	 */
	download : function(key, res, success, error) {
		var yjDownload = require("./yjCache.redis.download.js");
		yjDownload(key, res, success, error);
	},
	/**
	 * 删除文件
	 * @param {string} key
	 * @param {callbak_success} success
	 * @param {callback_error} error
	 */
	"delete" : function(key, success, error) {		
		yjRedis.exec({
			work : function(client, cb) {
				client.del(key, cb);
			},
			success : success,
			error : error
		});
	},
	/**
	 * 写数据
	 * @param {string} key
	 * @param {object} value
	 * @param {callbak_success} success
	 * @param {callback_error} error
	 */
	write:function(key,value,success,error){
		yjRedis.exec({
			work : function(client, cb) {
				client.set(key, value, cb);
			},
			success : success,
			error : error
		});
	},
	/**
	 * 读数据
	 * @param {string} key
	 * @param {callbak_success} success
	 * @param {callback_error} error
	 */
	read:function(key,success,error){
		yjRedis.exec({
			work : function(client, cb) {
				client.get(key, cb);
			},
			success : success,
			error : error
		});
	}
}