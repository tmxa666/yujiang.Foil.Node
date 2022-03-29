/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjCache_redis_download
 */
var yjError = require("./yjError.js");
/**
 * @description <pre>从redis缓存服务器下载文件。
 * 因为已经有res，所以，直接对res返回，外部success/error只是得到执行结果通知,请不要再对res操作。</pre>
 * @exports yjCache_redis_download
 * @example <pre>
 * var yjCache_redis_download=yjRequire("yujiang.Foil","yjCache.redis.download.js");
 * </pre>
 * @see nodejs::yjRequire
 * @param {string} key 键值
 * @param {HTTPResponse} res http响应对象
 * @param {callback_success} success
 * @param {callback_error} error
 */
module.exports = function(key, res, success, error) {
	var yjRedis = require("./yjRedis.js");
	var packetCount = 0;
	var packetGotCount = 0;
	var lastError = null;

	function mySuccess(data) {
		if (success) {
			success(data);
		}
	}

	function myError(err,isLog) {		
		if (error) {
			error(err,isLog);
		}
	}

	yjRedis.exec({
		work : function(client, cb) {
			client.llen(key, function(err, replies) {
				if (err) {
					myError(err);
					return;
				}

				var packetCount = parseInt(replies);
				if (packetCount == 0) {
					//没有时，不记录这个错误
					myError(new Error("Not found or is empty!"),false);
					return;
				}

				for ( var i = 0; i < packetCount; i++) {
					client.lrange(key, i, i, function(err, replies2) {
						if (err) {
							if (lastError) {
								// 已经回报过错误，就不要再回报了
								return;
							}
							lastError = err;
							myError(err);
							return;
						}
						var buf = Buffer.from(replies2[0], "base64");
						res.write(buf, "binary");
						packetGotCount++;
						if (packetCount == packetGotCount) {
							//没有调用cb，所以要自己quite
							client.quit();
							res.end();
							mySuccess("success");
						}
					});
				}
			});
		},
		error : myError
	});
}