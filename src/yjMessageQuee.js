/**
* 消息队列基于Redis 数据库的list实现
* 生产者-消费者 点对点模式：
*   1.每个消息只有一个接收者（Consumer）(即一旦被消费，消息就不再在消息队列中)；
*   2.发送者和接收者间没有依赖性，发送者发送消息之后，不管有没有接收者在运行，都不会影响到发送者下次发送消息；
*   3.接收者在成功接收消息之后需向队列应答成功，以便消息队列删除当前接收的消息；
* 本队列提供两个redis连接：消息生产者producer,消息消费者consumer
**/
var Redis = require('ioredis')
var producer;
var consumer;
var commonClient;

function queeInit () {
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
queeInit();


var opts = {
  createClient: function (type) {
    switch (type) {
      case 'consumer':
        return consumer;
      case 'producer':
        return producer;
      default:
        return commonClient;
    }
  }
}
module.export.createMQ=function(name){
	return new Queue(name, opts);
}


 
