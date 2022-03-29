/**
 * @fileOverview
 * @author zcl,2016/01/12
 * @description
 * <pre>（1）支持mongodb
 * （2）mongodb是文档型数据库，所以不能如以前那样把数据分为meta和rows,因为集合中的文档不一定schema一样
 * （3）</pre>
 * @see module:yjDBService_engine_mongodb
*/

var yjDBServiceUtil = require("./yjDBService.util.js");
var yjUtils=require("./client/js/yjUtils.js");
var yjError=require("./yjError.js");
var merge = require("merge");
var g_mongodbs={};
var pkg='mongodb';
if (global.yjGlobal.config.db_Connection && 
	global.yjGlobal.config.db_Connection['package']){
	pkg=global.yjGlobal.config.db_Connection['package'];
}
var Db =require(pkg).Db;
var Server=require('mongodb').Server;

/**
 * @ignore
 * @description 为了支持多个数据库，允许传递不同连接参数
 * mongodb创建的实例本身带有连接池且线程安全？，默认poolSize=5？不需要显示释放连接？
 */
function getMongodbInstance(options) {
	var connectionOptions=options.connectionOptions;
	if (!connectionOptions){
		var conn=yjDBServiceUtil.getDefaultConnectionOptions();
		connectionOptions=merge(true,conn);
		connectionOptions.host=conn.server;
	}else{
		if (!connectionOptions.host){
			connectionOptions.host=connectionOptions.server;
		}
	}
	var key=JSON.stringify(connectionOptions);
	var db=g_mongodbs[key];
	if (db){
		//此处需要检查db是否是开着的，如果是close，需要打开
		//目前只对外开放collection，是否会有db意外关闭状况?
		yjError.handleResult(options,null,db);
		return;
	}
	//此处可以确保时open的
	var mongodbInstance=new Db(
		connectionOptions.database, 
		new Server(connectionOptions.host, connectionOptions.port, {}), 
		{w: 1}
	);
	mongodbInstance.open(function(err, db) {
		if(err){			
			yjError.handleResult(options,err);
			return;
		}
		//如果数据库设定了权限验证
		if(connectionOptions.authenticate){
			db.authenticate(connectionOptions.user, 
				connectionOptions.password, 
				function(err, result) {
					if (err) {
						db.close();
						yjError.handleResult(options,err);
						return;
					}
					g_mongodbs[key]  = db;
					yjError.handleResult(options,null,db);
				}
			);	
		}else{
			g_mongodbs[key]  = db;
			yjError.handleResult(options,null,db);
		}
	});
}

/**
 * mongodb数据库引擎。
 * @exports yjDBService_engine_mongodb
 * @example <pre>
 * var yjDBService_mongodb=yjRequire("yujiang.Foil","yjDBService.engine.mongodb.js");
 * </pre>
 * @see nodejs::yjRequire
 */
var dbm = {
    /**
     * 引擎名。写无效。
     * @type {string}
     */
	engine:"mongodb",
    /**
     * 获取一个新的连接。
     * @param {object} options
     * @param {object} [options.connectionOptions] 连接参数，如果不传递，使用框架的config.db_Connection.connection参数。
     * @param {callback_success} options.success 成功后的回调函数：function(connection)
     * @param {callback_error} options.error 失败后的回调函数
     */
	getConnection:function(options){
		getMongodbInstance(options);
	},
	/**
	 * 获取一个集合。
     * @param {object} options
     * @param {object} [options.connectionOptions] 连接参数，如果不传递，使用框架的config.db_Connection.connection参数。
     * @param {string} options.tableName 集合名称
     * @param {string} options.collectionName 集合名称，先检查tableName，没有时使用collectionName
     * @param {callback_success} options.success 成功后的回调函数：function(connection)
     * @param {callback_error} options.error 失败后的回调函数
	 */
	getCollection:function(options){		
		//此处db应该是开着的，collection无需关闭，mongodb会帮着处理
		//处理逻辑应该是如果存在collection，则复用，不存在创建
		//对外开发collection
		yjUtils.hookCallback(options,function(err,db,oldCallback){
			if (err){
				oldCallback(err);
				return;
			}
			var tn=options.tableName;
			if (!tn){
				tn=options.collectionName;
			}
			db.collection(tn,oldCallback);
		});
		getMongodbInstance(options);
	}
};

module.exports = dbm;