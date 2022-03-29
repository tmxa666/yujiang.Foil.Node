/**
 * @author mustapha.wang,2014/6/7
 * @fileOverview
 * @description <pre>microsoft sql server数据库引擎。
 * （1）支持在sql中使用where AID=？的参数形式</pre>
 * （2）msnodesqlv8模组，有连接复用，空闲连接会在1分钟后释放，但是没有池的最大连接数和等待功能
 * （3）msnodesql模组，维护少，编译总是遇到错误
 * （4）mssql模组，人气蛮高，后续可以试试这个，有连接池，支持transaction
 * @see module:yjDBService_engine_sqlserver
*/
var g_connectionStrings = {};
var pkg='msnodesqlv8';
if (global.yjGlobal.config.db_Connection && 
	global.yjGlobal.config.db_Connection['package']){
	pkg=global.yjGlobal.config.db_Connection['package'];
}
var sqlserver = require(pkg);
var yjDBServiceUtil = require("./yjDBService.util.js");
 
function getConnectionString(connectionOptions) {
    var key=JSON.stringify(connectionOptions)
	if (!g_connectionStrings[key]){
        var conn='';
        if(connectionOptions){
            conn=connectionOptions;
        }else{
             conn=yjDBServiceUtil.getDefaultConnectionOptions();
        }
		var connectionPattern =
			"Driver={%s};Server={%s};Database={%s};UID=%s;PWD=%s";
		var util = require("util");		
	    g_connectionStrings[key]=util.format(connectionPattern, conn.driver,
                conn.server, conn.database, conn.user,
                conn.password);
	}
    return g_connectionStrings[key];
}
function getConnection(options){
    sqlserver.open(getConnectionString(options.connectionOptions),function(err,connection){
    	yjError.handleResult(options,err,connection);
    });
}

function releaseConnection(connection){
	connection.close();
}

var yjError=global.yjRequire("yujiang.Foil","./yjError.js");
var yjUtils=require("./client/js/yjUtils.js");

/**
 * sqlserver数据库引擎。
 * @exports yjDBService_engine_sqlserver
 * @example <pre>
 * var yjDBService_sqlserver=yjRequire("yujiang.Foil","yjDBService.engine.sqlserver.js");
 * </pre>
 * @see nodejs::yjRequire
 */

var dbm = {
	/**
	 * 引擎名。写无效。
	 * @type {string}
	 */
	engine:"sqlserver",
	/**
	 * 获取一个新的连接。
	 * @function
	 * @param {object} options
	 * @param {callback_success} options.success 成功后的回调函数function(connection)
	 * @param {callback_error} options.error
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
    	
    	function doQuery(conn){           
			var resultsArray=[];
			
        	function checkResults(results){            	
            	if (options.isAutoDisconnect!=false){
                	if (conn){
                		//一定要关闭，否则连接会越来越多
                		releaseConnection(conn);
                    	conn=null;
                	}
            	}
            	else{
            		results.connection=conn;
            	}
            	//通过process.domain.intercept后，有错误不会触发此callback
        	
        		//用户的success可能执行有错，要拦截到并马上汇报客户端，否则会死等到超时
        		if ((options.rowsAsArray==false) && results){
        			var yjDB=require("./client/js/yjDB.js");
        			//这个引擎只返回array，不是object list
        			if (results.constructor == Array){
        				for(var i=0;i<results.length;i++){
        					var data=results[i];
        					if (data.meta && data.rows){                				
        						results[i]=yjDB.dataSet2ObjectList(data.meta,data.rows);
                			}                					
        				}                					
        			}
        			else if (results.meta && results.rows){                				
        				results=yjDB.dataSet2ObjectList(results.meta,results.rows);
        			}
        		}                		
        		yjError.handleResult(options,null,results);                               
        	}
        	            	           	
        	var vMeta=[];
        	var vRows=[];
        	var vRow=[];
        	//queryRaw使用callback，有些问题：
        	//如果options.sql里面有2条语句，会触发2次,如果2次都送回客户端，会报错：Can't set headers after they are sent.如何把最后一次结果送回客户端，而不是第1次？
        	//如：insert后，通过select @@IDENTITY取OID
    		//但是on("done")事件在第一次就触发了。    
            var stmt=conn.queryRaw(options.sql, options.parameters);
            
            stmt.on('meta', function (meta) {
            	vMeta=meta;
            	vRows=[];
            	resultsArray.push({
            		meta:vMeta,
            		rows:vRows});
            });
            
            stmt.on('row', function (idx) {
            	//如果有2个查询，idx是连续的，不会重开始,因此不能用
            	vRow=new Array(vMeta.length);
            	vRows.push(vRow);
            });
            
            stmt.on('column', function (idx, data, more) {
            	vRow[idx]=data; 
            });
            
            stmt.on("rowcount",function(rowCount){
            	//insert/delete/update会触发
            	resultsArray.push({affectedRows:rowCount});
            });               
            
            stmt.on('error',function(err){
            	if (options.isAutoDisconnect==false){
            		//让外部决定是否释放连接
            		err.connection=conn;
            	}
            	//在错误元件上记录sql语句，日志文件和console中可以打印出来
            	if (!err.sql){
            	    err.sql=options.sql;
            	}
            	yjError.handleResult(options,err);
            });
            stmt.on('done', function () {
            	//如果这里抛出一个异常，domain抓不到，错误显示：uncaught error:xxxx，到底是谁抓到了，能拦截到吗？
            	var data=resultsArray;
            	if (resultsArray.length==1){
            		data=resultsArray[0];
            	}
            	checkResults(data);
            });
    	}
    	
    	if (options.connection){
    		var connection=options.connection;
    		doQuery(connection);
    	}
    	else{
    		getConnection({
                connectionOptions:options.connectionOptions,
        		success:function(connection){
    				doQuery(connection);
    			},
    			error:function(err){
    				yjError.handleResult(options,err);
    			}
        	});
    		//使用process.domain.intercept后，doQuery中才能访问到process.domain
/*    		function getOnOpenHandler(){
    			if (process.domain){
    				return process.domain.intercept(function(conn){            	
    	            	doQuery(conn);
    	            });
    			}
    			else{
    				return function(err,conn){
    					if (err){    						
    						yjError.handleResult(options,err);
    					}
    					else{
    						doQuery(conn);
    					}
    				}
    			}
    		}
            sqlserver.open(getConnectionString(),getOnOpenHandler());*/
    	}
    },
    /**
     * <pre>获取资料条数，主要用于与分页配合。sql不要写count(*)，函数自动处理
     * options结构如下：
     * {
     *   sql:"",                   //'select col1,col2 from TableName where col3 = ? And col4 = ?'
     *   parameters:[],            //[p1,p2]
     *   rowsAsArray:true,         //结果行是否用阵列格式。
     *   success:function(data){}, //data格式为:{count:x}
     *   error:function(err){}
     * }</pre>
     * @param options {object} 参数
     * @return {undefined}
	 */
    selectDataCount: function (options) {
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
     * <pre>分页函数，只支持select语句。
     * 注意：只能用于 SqlServer2012及以上版本
     * options结构如下：
     * {
     *   sql:"",                   //sql语句，如：'select col1,col2 from TableName where col3 = ? And col4 = ?'
     *   parameters:[],            //sql语句的参数值，如：[p1,p2]
     *   orderBy:"",               //排序子句，如：'col1 desc'
     *   pageIndex:0,              //页码，预设为0
     *   pageRowCount:20,          //每页记录条数，预算为20，-1表示全部（0就是0，可能用户只要schema）
     *   rowsAsArray:true,         //结果行是否用阵列格式。
     *   fetchTotalCount:false,    //是否获取总行数。
     *   isAutoDisconnect:true,    //是否自动断开连接
     *   success:function(data){}, //成功后的回调函数，data格式为:{pageIndex:x,pageRowCount:x,meta:[],rows:[]}
     *   error:function(err){}     //失败后的回调函数
     * }
     * </pre>
     * @param {object} options 参数
     * @return {undefined}
	 */
    selectData: function (options) {        
        yjDBServiceUtil.checkOptions(options,true);
        var isAutoDisconnect_old=options.isAutoDisconnect;
        var sql_old=options.sql;
        yjUtils.hookCallback(options,function(err,data,oldCallback){
        	if (err){
                console.log(err);
        		//最初本意是自动关闭连接
        		if (isAutoDisconnect_old!=false){
        			//如何关闭连接？
        			releaseConnection(err.connection);
        		}
        		delete err.connection;
        		oldCallback(err);
    		}
    		else{
                data.pageIndex = options.pageIndex;
                data.pageRowCount = options.pageRowCount;
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
        
        function getPageSql(options){
            const db_Connection = global.yjGlobal.config.db_Connection;
            var sql_page = options.sql;
            options.orderBy = options.orderBy==null?options.req.query.sort:options.orderBy;
            options.pageIndex = options.pageIndex==null?options.req.query.page-1:options.pageIndex;
            options.pageRowCount = options.pageRowCount==null?options.req.query.rows:options.pageRowCount;
            if(db_Connection.connection.version && db_Connection.connection.version<2012){
                 if (options.pageRowCount == -1) {
                    if (options.orderBy){
                        sql_page+=' Order By ' + options.orderBy;
                    }
                }  else {
                    var orderBy = options.orderBy || options.keyFieldName;
                    orderBy = orderBy.split(".")[orderBy.split(".").length - 1];
                    sql_page = 
                    `select top ${options.pageRowCount} * from( 
                        select row_number() over(order by tb1.${orderBy}) as rownumber,
                        tb1.* from (${options.sql}) as tb1) 
                    temp_row where rownumber > ${options.pageIndex * options.pageRowCount}`;
                }
            }else{
                if (options.pageRowCount == -1) {
                    if (options.orderBy){
                        sql_page+=' Order By ' + options.orderBy;
                    }
                } else if (options.pageRowCount == 0) {
                    sql_page = 'Select Top 0 * From (' +
                            options.sql + ' Order By ' + options.orderBy +
                            ' Offset 0 Rows Fetch Next 1 Rows Only'+
                        ') T ';
                } else {
                    sql_page = options.sql +
                        ' Order By ' + options.orderBy +
                        ' Offset ' + (options.pageIndex * options.pageRowCount) +
                        ' Rows Fetch Next ' + options.pageRowCount +
                        ' Rows Only';
                }
            }
            return sql_page;
        }
        options.sql= getPageSql(options);
        if (options.fetchTotalCount==true){
        	options.isAutoDisconnect=false;
        }
        dbm.exec(options);
    },
    /**
     * <pre>新增资料函数，如果有auto increment identity字段，在success中返回新增的identity值，
     * 只支持insert语句。
     * options结构如下：
     * {
     *   sql:"",                   //'insert into TabeName(col1,col2) values(?,?)'
     *   parameters:[],            //[p1,p2]
     *   success:function(data){}, //data格式为:{OID:x}
     *   error:function(err){}
     * }</pre>
     * @param {object}options 参数
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
        		//var sql="select SCOPE_IDENTITY()";//得不到
        		var sql="select @@IDENTITY";
        		var options2={
        			sql:sql,
        			rowsAsArray:true,
        			isAutoDisconnect:isAutoDisconnect_old,
        			connection:data.connection,
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
    	return '[' + str + ']';
    }
};
module.exports = dbm;