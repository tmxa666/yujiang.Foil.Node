/**
 * @fileOverview
 * @author mustapha.wang,2014/6/7<br/>
 * @description <pre>数据库相关功能。
 * （1）用函数达到lazy load的效果，因为有时候，js文件刚加载时，环境还没建立好，global.yjGlobal还没有。如qunit在另一个child process执行。</pre>
 * @see module:yjDBService_util
 */
var g_connectionOptions = {};
var g_isInited = false;
var merge = require("merge");
var fs=require('fs');

/**
 * 数据库相关功能。
 * @exports yjDBService_util
 * @example <pre>
 * var yjDBService_util=yjRequire("yujiang.Foil","yjDBService.util.js");
 * </pre>
 * @see nodejs::yjRequire
 */
var yjDBService_util={
	/**
	 * @description 从原始的配置参数中提取正式的数据库连接参数，并把密码解密。
	 * @param {object} connectionOptions 原始配置参数
	 * @return {object} 解密后的连接参数
	 */
	extractConnectionOptions:function(connectionOptions0) {
		var connectionOptions = merge(true,connectionOptions0);
		if (!connectionOptions['password'] && connectionOptions['encryptedPassword']) {
			var encrptedPassword = connectionOptions.encryptedPassword;
			var yjSecurity = require("./yjSecurity.js");
			var password=null;
			if (global.yjGlobal.config.security.passwordEncryptMode=="rsa"){
				password = yjSecurity["Diffie-Hellman"].decrypt(encrptedPassword);
			}
			else{
				password = yjSecurity.decryptStr0_Ansi(encrptedPassword);
			}
			connectionOptions.password = password;
		}
		return connectionOptions;
	},
	
	/**
	 * @description 从config文件读取预设的配置参数
	 * @return {object}
	 */
	getDefaultConnectionOptions:function() {
		if (g_isInited)
			return g_connectionOptions;
		else {		
			g_connectionOptions = module.exports.extractConnectionOptions(global.yjGlobal.config.db_Connection.connection);
			g_isInited = true;
			return g_connectionOptions;
		}
	},
	/**
	 * @description 检查执行数据查询的参数是否设置正确，并对未设置的参数设置初始值。
	 * @see nodejs:yjDBService.engine.msnodesql.exec 
	 * @see nodejs:yjDBService.engine.msnodesql.selectData
	 * @param {object} options 要检查的查询参数。结构如下：<pre>
	 * {
	 * 	sql:xxx,                //不能为空
	 * 	parameters:[],
	 *	rowsAsArray:true,
	 *	isAutoDisconnect:true,
	 *	pageIndex:0,            //isCheckPager=true时才检查
	 *	pageRowCount:20,        //isCheckPager=true时才检查
	 *	fetchTotalCount:false   //isCheckPager=true时才检查
	 * }</pre>
	 * @param {boolean} [isCheckPager=false] 是否检查分页相关参数。
	 * @returns {undefined}
	 */
	checkOptions:function(options,isCheckPager){
	    if (typeof options.sql != "string") {
	        throw new Error("执行SQL语句不能为空！");
	    }
	    if (options.parameters==null) {
	        options.parameters = [];
	    }
	    if (!((options.parameters == null) ||
	        (typeof options.parameters == "object" && options.parameters.constructor == Array))) {
	        throw new Error("错误的参数类型！只能是阵列。");
	    }
	
	    if (options.rowsAsArray==null) {
	    	//预设为阵列，比较节省数据量
	        options.rowsAsArray = true;
	    } else {
	        // 可能非boolean值
	        options.rowsAsArray = options.rowsAsArray == true ? true : false;
	    }
	    
	    if (options.isAutoDisconnect==null){
	    	options.isAutoDisconnect=true;
	    }
	    
	    if (isCheckPager==true){
	        if (!options.pageIndex){
	        	options.pageIndex = 0;
	        }
	        else if (typeof options.pageIndex != "number"){
	        	options.pageIndex =parseInt(options.pageIndex);
	        }
	        
	        if (!options.pageRowCount){
	        	options.pageRowCount = 20;
	        }        
	        else if (typeof options.pageRowCount != "number"){
	        	options.pageRowCount =parseInt(options.pageRowCount);
	        }
	        
	        if (!options.fetchTotalCount){
	        	options.fetchTotalCount=false;
	        }
	    }
	},
	/**
	 * 按引擎名称载入指定文件
	 * @param {string} file 带引擎名称的文件名，如:./yjDBService.engine.
	 */
	loadByEngine:function(file){
		if (!global.yjGlobal.config.db_Connection) {
			throw new Error('config.db_Connection is empty!');
		}
		var fileName=file+global.yjGlobal.config.db_Connection.engine+".js";

		if (!fs.existsSync(fileName)){
			console.warn("file not exists : "+fileName);					
			fileName=file+"mysql.js";
			console.warn("use file replace: "+fileName);
		}
		return require(fileName);
	}
}
module.exports=yjDBService_util;