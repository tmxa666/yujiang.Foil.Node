/**
 * @author Mico.wang
 */

/**
 * Redis服务器引擎,初始化,创建连接池缓存连接,节省创建连接所用的时间
 * @exports yjRedisPool
 * @example <pre>
 * var yjRedis=yjRequire("yujiang.Foil","yjRedisPool.js");
 * </pre>
 * @see nodejs::yjRequire
*/

var Redis = require('ioredis')
var publisher;
var subscriber;
var commonClient;

function create () {
	if (global.yjGlobal.config.cache){
		if (global.yjGlobal.config.cache.connection.password){ 
			subscriber = new Redis(global.yjGlobal.config.cache.connection.port,
			global.yjGlobal.config.cache.connection.host,{ password: global.yjGlobal.config.cache.connection.password}); 
			publisher = new Redis(global.yjGlobal.config.cache.connection.port,
			global.yjGlobal.config.cache.connection.host,{ password: global.yjGlobal.config.cache.connection.password});
			commonClient = new Redis(global.yjGlobal.config.cache.connection.port,
			global.yjGlobal.config.cache.connection.host,{ password: global.yjGlobal.config.cache.connection.password}); 
		}
	} else {
		subscriber = new Redis(); 
		publisher = new Redis();
		commonClient = new Redis(); 
	}
	return  commonClient;
};

create();
module.exports= {
	//    createClient?: (type: enum('client', 'subscriber'), redisOpts?: RedisOpts) => redisClient,
	createClient:function (type) {
	    switch (type) {
	      	case 'client': // 这里必须是client字串  没搞懂 为啥
	      	  	return subscriber;
	      	case 'subscriber':// 这里必须是subscriber字串 没搞懂 为啥
	      	  	return publisher;
	      	default:
	        	return commonClient;
	    }
	}
}

   

