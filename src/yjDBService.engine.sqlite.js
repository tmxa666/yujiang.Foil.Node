/**
 * @fileOverview
 * @author mustapha.wang,2015/03/30
 * @description <pre>sqlite数据库引擎。
 * （1）支持在sqlite中使用where AID=？的参数形式</pre>
*/

var g_isInited = false;
var g_connection = null;

var yjDBServiceUtil = require("./yjDBService.util.js");

function getConnectionOptions() {
	if (g_isInited)
		return g_connection;
	else {
		var conn=yjDBServiceUtil.getDefaultConnectionOptions();
		g_connection ={
			database:conn.database
		}
		g_isInited = true;
		return g_connection;
	}
}
var pkg='sqlite3';
if (global.yjGlobal.config.db_Connection && 
	global.yjGlobal.config.db_Connection['package']){
	pkg=global.yjGlobal.config.db_Connection['package'];
}
var sqlite = require(pkg);
var yjError=require("./yjError.js");

function getConnection(options){
	var errObj=null;
	var connection= new sqlite.Database(
		getConnectionOptions().database,
		function(err){
			errObj=err;
		});
	yjError.handleResult(options,errObj,connection);
}

function releaseConnection(connection){
	if (connection){
		connection.close();
		connection=null;
	}
}

/**
 * sqlite数据库引擎。
 * @exports yjDBService_engine_sqlite
 * @see module:yjDBService_engine_sqlserver
 * @example <pre>
 * var yjDBService_sqlite=yjRequire("yujiang.Foil","yjDBService.engine.sqlite.js");
 * </pre>
 * @see nodejs::yjRequire
 */
var dbm = {
	/**
	 * 引擎名。写无效。
	 */
	engine:"sqlite",
    /**
     * 获取一个新的连接。
     * @function
     * @param {object} options
     * @param {callback_success} options.success 成功后的回调函数：function(connection)
     * @param {callback_error} options.error 失败后的回调函数
     */
	getConnection:getConnection,
    /**
     * 释放一个连接。
     * @function
     * @param {object} connection 要释放的连接。
     */
	releaseConnection:releaseConnection,
    /**
     * 执行sql语句，支持select，delete，insert...
     * @param {object} options
     * @param {object} [options.connection] 数据库连接。如果不给，获取一个新的连接。
     * @param {string} options.sql - 如：'select col1,col2 from TableName where col3 = ? And col4 = ?'
     * @param {any[]} [options.parameters=[]] - 如：[p1,p2]
     * @param {boolean} [options.rowsAsArray=true] - 返回的data.rows[i]是值阵列[2，'A','B'],还是object{OID:2,AID:'A',Name:'B'}
     * @param {boolean} [options.isAutoDisconnect=true] - 是否自动断开数据库连接。<ul>
     * <li>True：自动断开连接；</li>
     * <li>False:不自动断开连接，把连接放在在success的data.connection，以便下一个调用继续使用。</li></ul>
     * @param {callback_success} options.success - 成功后的回调函数。<br/>
     * data格式为:<ul>
     * <li>sql只包含一条语句：<ul>
     *   <li>select，返回object：{meta:[],rows[],connection:{}}</li>
     *   <li>insert/delete/update，返回object：{affectedRows:x,changedRows:x}</li></ul></li>
     * <li>sql包含多条语句，返回数组。</li></ul>
     * 如果isAutoDisconnect为false，才返回connection。
     * @param {callback_error} options.error - 出错时的回调函数
     * @return {undefined}
     * @see 测试用例：{@link testcase::yjDBService_exec}
     */
    exec: function (options) {
    	yjDBServiceUtil.checkOptions(options,false);
    	if (options.connection){
    		doQuery(options.connection);
    	}
    	else{
        	getConnection({
        		success:function(connection){
    				doQuery(connection);
    			},
    			error:function(err){
    				yjError.handleResult(options,err);
    			}
        	});
    	}
    	
    	function doQuery(connection){        
        	connection.all(
        		options.sql, 
        		options.parameters,        		
                function(err, data){
                    if (options.isAutoDisconnect!=false){
                        releaseConnection(connection);
                    }
                    if (err) {
                    	releaseConnection(connection);
                    	//这个引擎可以找到domain，不用process.domain.intercept
                    	//在错误元件上记录sql语句，日志文件和console中可以打印出来
                    	if (!err.sql){
                    	    err.sql=options.sql;
                    	}
                        yjError.handleResult(options, err);
                    } else {
                    	if (options.rowsAsArray!=false){
                    		var yjDB=require("./client/js/yjDB.js");
            				data=yjDB.objectList2DataSet(data)
                    	}
                    	if (options.isAutoDisconnect==false){
                    		data.connection=connection;
                    	}

                        yjError.handleResult(options,null,data);                            
        			}
                }
            );
    	}
    },
    /**
     * 获取资料条数，主要用于与分页配合。sql不要写count(*)，函数自动处理
     * @param {object} options
     * @param {string} options.sql sql语句，如：'select col1,col2 from TableName where col3 = ? And col4 = ?'
     * @param {array} [options.parameters] sql语句中的参数值，如：[p1,p2]
     * @param {callback_success} options.success 成功后的回调函数:function(data){}, data格式为:{count:x}
     * @param {callback_error} options.error 失败后的回调函数:function(err){}
     * @return {undefined}
     */
    selectDataCount:function(options){
    	yjUtils.hookCallback(options,function(err,data,oldCallback){
    		if (err){
    			oldCallback(err);
    		}
    		else{
                var count=null;
                if (data.rows && data.rows.length>0) {
                    count = data.rows[0][0];
                }
                oldCallback(null, {count:count});
    		}
    	});
    	options.sql="select count(*) from("+options.sql+") as abcdefg";
    	options.rowsAsArray=true;
        dbm.exec(options);
    },
    /**
     * 产生分页sql语句
     * @param {object} options
     * @param {string} options.sql sql语句，如：'select col1,col2 from TableName where col3 = ? And col4 = ?'
     * @param {array} [options.parameters] sql语句的参数值，如：[p1,p2]
     * @param {string} [options.orderBy] 排序子句，如：'col1 desc'
     * @param {int} [options.pageIndex=0] 页码，预设为0
     * @param {int} [options.pageRowCount=20] 每页记录条数，预算为20，-1表示全部（0就是0，可能用户只要schema）
     * @return {string} 返回带分页的sql语句。
     */
    getSelectPagerSQL:function(options){
    	yjDBServiceUtil.checkOptions(options,true);
    	var sql_page = options.sql;
        if (options.pageRowCount == -1) {            
            if (options.orderBy) {
                sql_page += ' Order By ' + options.orderBy;
            }
        }
        else {
            sql_page = sql_page +
                ' Order By ' + options.orderBy +
                ' limit ' + (options.pageIndex * options.pageRowCount) +
                ' , ' + options.pageRowCount;
        }
        return sql_page;
    },
    /**
     * 分页函数，只支持select语句。
     * @param {object} options
     * @param {string} options.sql sql语句，如：'select col1,col2 from TableName where col3 = ? And col4 = ?'
     * @param {array} [options.parameters] sql语句的参数值，如：[p1,p2]
     * @param {string} [options.orderBy] 排序子句，如：'col1 desc'
     * @param {int} [options.pageIndex=0] 页码，预设为0
     * @param {int} [options.pageRowCount=20] 每页记录条数，预算为20，-1表示全部（0就是0，可能用户只要schema）
     * @param {bool} [options.rowsAsArray=true] 结果行是否用阵列格式。
     * @param {bool} [options.fetchTotalCount=false] 是否获取总行数。
     * @param {bool} [options.isAutoDisconnect=true] 是否自动断开连接
     * @param {callback_success} options.success 成功后的回调函数：function(data){}, data格式为:{pageIndex:x,pageRowCount:x,meta:[],rows:[]}
     * @param {callback_error} options.error 失败后的回调函数:function(err){}
     * @return {undefined}
     */
    selectData: function (options) {    	
    	var sql_old=options.sql;
    	var isAutoDisconnect_old=options.isAutoDisconnect;
    	yjUtils.hookCallback(options,function(err,data,oldCallback){
        	if (err){
        		//最初本意是自动关闭连接
        		if (isAutoDisconnect_old!=false){
        			//如何关闭连接？
        			releaseConnection(err.connection);
        		}
        		delete err.connection;
        		oldCallback(err);
    		}
    		else{              
	            data.pageIndex=options.pageIndex;
	            data.pageRowCount=options.pageRowCount;
	            if (options.fetchTotalCount==true){
	                var options2={
	                	sql:sql_old,
	                	parameters:options.parameters,
	                	isAutoDisconnect:isAutoDisconnect_old,
	                	connection:data.connection,
	                	success:function(data2){
	                		data.total=data2.count;
	                		delete data.connection;
	                		//如果不删除connection，可能出现错误：converting circular structure to JSON
	                		oldCallback(null, data);
	                	},
	                	error:oldCallback
	                }
	                dbm.selectDataCount(options2);
	            }
	            else{
	            	oldCallback(null, data);
	            }
    		}
        });
    	var sql_page = dbm.getSelectPagerSQL(options);
        options.sql= sql_page;
        if (options.fetchTotalCount==true){
        	options.isAutoDisconnect=false;
        }
        dbm.exec(options);
    },
    /**
     * <pre>新增资料函数，如果有auto increment identity字段，在success中返回新增的identity值，
     * 只支持insert语句。</pre>
     * @param {object} options 参数
     * @param {string} options.sql sql语句，只能是insert，如：'insert into TabeName(col1,col2) values(?,?)'
     * @param {array} [options.parameters] sql语句的参数值，如：[p1,p2]
     * @param {callback_success} success 成功后的回调函数:function(data){}, data格式为:{OID:x}
     * @param {callback_error} error 失败后的回调函数:function(err){}
     * @return {undefined} 异步调用，无直接返回结果
     */
    insertData:function(options){
    	var isAutoDisconnect_old=options.isAutoDisconnect;
    	yjUtils.hookCallback(options,function(err,data,oldCallback){
    		if (err){
        		//最初本意是自动关闭连接
        		if (isAutoDisconnect_old!=false){
        			//如何关闭连接？
        			releaseConnection(err.connection);
        		}
        		delete err.connection;
        		oldCallback(err);
    		}
    		else{
	    		var sql="select last_insert_rowid()";
	    		var options2={
	    			sql:sql,
	    			rowsAsArray:true,
	    			connection:data.connection,
	    			isAutoDisconnect:isAutoDisconnect_old,
	    			success:function(data2){    				
	    				//以object传回，如果直接传回integer，客户端有时不认
						var OID=(data2.rows && data2.rows.length>0)?data2.rows[0][0]:null;
						oldCallback(null,{OID:OID});
	    			},
	    			error:oldCallback
	    		}
	    		dbm.exec(options2);  
    		}
    	});
    	
    	options.isAutoDisconnect=false;
    	dbm.exec(options);
    },
    /**
     * sql字串中标识符的转义，如：字段名有空格时，mysql是使用`Field`，SQLServer是使用[Field]
     * @param {string} str 要转义的字串
     * @return {string} 转义后的字串
     */
    escapeId:function(str){
    	return "["+str+"]";
    }
};

module.exports = dbm;