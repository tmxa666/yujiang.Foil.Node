/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjDBService
 */
/**
 * @module yjDBService
 * @see module:yjDBService_engine_sqlserver
 * @description 数据库访问接口。<br/>
 * 可以通过不同的数据库引擎访问不用的数据库，如：mssqlserver,mysql/mariadb,sqlite...
 * 由配置文件决定使用哪个引擎。如：<pre>
 * 文件：config.xxx.js
 * var config={
 *     ...
 *     db_Connection:{
 *         engine:"mysql",
 *         connection:{
 *             server : '127.0.0.1',
 *             database : 'safetyPLC',
 *             user : 'root',
 *             password : 'root'
 *         }
 *     },
 *     ...</pre>
 * @example <pre>
 * var yjDBService=yjRequire("yujiang.Foil","yjDBService.js");
 * </pre>
 * @see nodejs::yjRequire
 */
//注意：WebServer端也可能引用了这个文件，但是没有使用其中的方法。
if (global.yjGlobal.config.db_Connection){
	var yjDBService_util=require("./yjDBService.util.js");
	var path=require("path");
	module.exports=yjDBService_util.loadByEngine(path.join(__dirname,"./yjDBService.engine."));
}
