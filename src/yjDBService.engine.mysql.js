/**
 * @fileOverview
 * @author mustapha.wang,2014/10/17
 * @description <pre>mysql/mariadb数据库引擎。
 * （1）支持在sql中使用where AID=？的参数形式
 * （2）支持mysql和mariadb
 * （3）bug:不会按存储过程中的执行顺序和次数返回结果</pre>
 * @see module:yjDBService_engine_mysql
*/

var yjDBServiceUtil = require("./yjDBService.util.js");
var yjError=require("./yjError.js");
var yjUtils=require("./client/js/yjUtils.js");
var yjResourceErrors = yjRequire("yujiang.Foil","yjResource.errors.js");

var pkg='mysql';
if (global.yjGlobal.config.db_Connection && 
	global.yjGlobal.config.db_Connection["package"]){
	pkg=global.yjGlobal.config.db_Connection["package"];
}
var version=global.yjGlobal.config.db_Connection["version"];
var mysql = require(pkg);
var merge = require("merge");
var g_mysqlpools={};

yjGlobal.app.get("/system.monitor.mysql", function(req, res, next) {
    var html="";
    var index=0;
    for(key in g_mysqlpools){
        var pool=g_mysqlpools[key];
        html+=index.toString()+key+"<br>";
        html+="--  All Connections(池中全部连接数): "+pool._allConnections.length+"<br>";
        html+="--  Acquiring Connections(真正在执行sql语句的连接数): "+pool._acquiringConnections.length+"<br>";
        html+="--  Free Connections(池中空闲的连接数): "+pool._freeConnections.length+"<br>";
        html+="--  Queue Connections(排队等待从池中获取连接的任务数): "+pool._connectionQueue.length+"<br>";
        index++;
    }
    res.send(html);
});

yjGlobal.app.get("/system.monitor.mysql-process", function(req, res, next) {
    dbm.exec({
        sql:"show processlist;",
        rowsAsArray:false,
        success:function(data){
            res.send(data);
        },
        error:function(err){
            res.send(err);
        }
    });
});

/*
 * 为了支持多个数据库，允许传递不同连接参数
 */
function getMySqlPool(connectionOptions) {
	if (!connectionOptions){
		var conn=yjDBServiceUtil.getDefaultConnectionOptions();
		connectionOptions=merge(true,conn);
		connectionOptions.host=conn.server;
	}
	else{
		if (!connectionOptions.host){
			connectionOptions.host=connectionOptions.server;
		}
	}
	var key=JSON.stringify(connectionOptions);
	var mysqlpool=g_mysqlpools[key];
	if (!mysqlpool){
		mysqlpool=mysql.createPool(connectionOptions);
		mysqlpool.on('release', function (connection) {
			//console.log('Connection %d released', connection.threadId);
		});
		g_mysqlpools[key]  = mysqlpool;
	}
	
	return mysqlpool;
}

function getConnection(options){
	var mysqlpool=getMySqlPool(options.connectionOptions);
	mysqlpool.getConnection(function(err, connection) {
		if (err){
			//BAE上特别说明要拦截此错误，否则日志会出现很多这种错误
	        if (err.errno == 'ECONNRESET') {
	        	err=undefined;
	        	return;
	        }
		}
		yjError.handleResult(options,err,connection);
	});
}

function releaseConnection(connection){
    connection.release();
}

/**
 * mysql数据库引擎。
 * @exports yjDBService_engine_mysql
 * @see module:yjDBService_engine_sqlserver
 * @example <pre>
 * var yjDBService_mysql=yjRequire("yujiang.Foil","yjDBService.engine.mysql.js");
 * </pre>
 * @see nodejs::yjRequire
 */
var dbm = {
    /**
     * 引擎名。写无效。
     * @type {string}
     */
	engine:"mysql",
    /**
     * 获取一个新的连接。
     * @function
     * @param {object} options
     * @param {object} [options.connectionOptions] 连接参数，如果不传递，使用框架的config.db_Connection.connection参数。
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
	 * 用同一个连接执行批量任务。注意：在options.work函数中多次执行dbHandler.exec是异步并行的，不能在中途出错停止，如果需要中途停止，应该使用async组件控制流程。
	 * @param {object} options
	 * @param {object} [options.connection] 数据库连接。如果不传递，自动获取一个新连接。注意：传递进来的连接不会在dbHandler.end调用时自动归还到连接池。
	 * @param {object} [options.connectionOptions] 数据库连接参数，如果不传递，使用框架的config.db_Connection.connection参数。
	 * @param {boolean} [options.isNeedTransaction=false] 是否要启动Transaction
	 * @param {function(dbHandler)} options.work 执行任务的函数:function(dbHandler)，dbHandler是一个object，属性如下：<ul>
	 * <li>connection:object,数据库连接</li>
	 * <li>exec:function(op),数据库查询函数。op的connection已经设置为dbHandler.connection，op的isAutoDisconnect也被设置为false。</li>
	 * <li>selectData:function(op),数据库分页查询函数。op的connection已经设置为dbHandler.connection，op的isAutoDisconnect也被设置为false。</li>
	 * <li>selectDataCount:function(op),数据库记录数查询函数。op的connection已经设置为dbHandler.connection，op的isAutoDisconnect也被设置为false。</li>
	 * <li>insertData:function(op),数据库新增函数。op的connection已经设置为dbHandler.connection，op的isAutoDisconnect也被设置为false。</li>
	 * <li>end(err,result),批处理执行完毕后，调用此结束函数，以告知commit或rollback交易，并回报success或error，最后归还数据库连接。注意：options.connection传递进来的连接不会在dbHandler.end调用时自动归还到连接池。</li>
	 * </ul>
	 * @param {callback_success} options.success 成功后的回调函数。
	 * @param {callback_error} options.error 失败后的回调函数。
	 * @see 测试用例：{@link testcase::yjDBService_execMulti}
	 * @example
	 * <pre>var yjDBService = global.yjRequire("yujiang.Foil",'yjDBService.engine.mysql.js');
     * var async = require("async");
     * 
     * module.exports = {
     *     getNewSN:function(sender){
     *         yjDBService.execMulti({
     *             connection:sender.connection,        
     *             isNeedTransaction:sender.isNeedTransaction!=false,
     *             success:sender.success,
     *             error:sender.error,
     *             work:function(dbHandler){
     *                 async.waterfall([
     *                     function(cb){
     *                         dbHandler.exec({
     *                             sql:'select SN from SNs where Category=? for update',
     *                             parameters:[sender.query.category],
     *                             success:function(data){
     *                                 if (data.rows.length>0){
     *                                     cb(null,{
     *                                         isFound:true,
     *                                         SN:data.rows[0][0]+1
     *                                     });
     *                                 }
     *                                 else{
     *                                     cb(null,{
     *                                        isFound:false,
     *                                        SN:sender.query.init?sender.query.init:1
     *                                     });
     *                                 }
     *                             },
     *                             error:cb
     *                         });
     *                     },
     *                     function(result,cb){
     *                         var sql='';
     *                         if (result.isFound){
     *                             sql='update SNs set SN=? where Category=?';
     *                         }
     *                         else{
     *                             sql='insert into SNs(SN,Category) values(?,?)';
     *                         }
     *                         dbHandler.exec({
     *                             sql:sql,
     *                             parameters:[result.SN,sender.query.category],
     *                             success:function(data){
     *                                 cb(null,{SN:result.SN});
     *                             },
     *                             error:cb
     *                         }); 
     *                     }
     *                 ],
     *                 function(err,result){
     *                     dbHandler.end(err,result);
     *                 });
     *             }
     *         });
     *     }
     * }</pre>
	 */
	execMulti:function(options){
		//注意：这里希望整个过程中连接使用同一个，且不要在某一步中自动关掉，即使单一一次有错误
	    var debugStack={};
	    Error.captureStackTrace(debugStack);
	    
	    var isNewConnection=false;
	    function doExec(connection){
	        var isFinished=false;
            function doRollback(err){
                connection.rollback(function(err2){
                    if (isNewConnection) releaseConnection(connection);
                    if (err2){
                        options.error(err2);
                    }
                    else{
                        options.error(err);
                    }
                });
            }
            
            function doError(err){
                if (options.isNeedTransaction){
                    doRollback(err);
                }
                else{
                    if (isNewConnection) releaseConnection(connection);
                    options.error(err);
                }
            }
            
            function doSuccess(result){
                if (options.isNeedTransaction){
                    connection.commit(function(err){
                        if (err){
                            doRollback(err);
                        }
                        else {
                            if (isNewConnection) releaseConnection(connection);
                            options.success(result);
                        }
                    });
                }
                else{
                    if (isNewConnection) releaseConnection(connection);
                    options.success(result);
                }
            }

            var dbHandler={
                connection:connection,
                timerTimeout:null,
                exec:function(op){
                    op.connection=connection;
                    op.isAutoDisconnect=false;
                    return dbm.exec(op);
                },
                selectData:function(op){
                    op.connection=connection;
                    op.isAutoDisconnect=false;
                    return dbm.selectData(op);
                },
                selectDataCount:function(op){
                    op.connection=connection;
                    op.isAutoDisconnect=false;
                    return dbm.selectDataCount(op);
                },
                insertData:function(op){
                    op.connection=connection;
                    op.isAutoDisconnect=false;
                    return dbm.insertData(op);
                },
                end:function(err,result){
                    if (isFinished) return;
                    if (dbHandler.timerTimeout) clearTimeout(dbHandler.timerTimeout);
                    if (err){
                        doError(err);
                    }
                    else{
                        doSuccess(result);
                    }
                    isFinished=true;
                }
            }
            //如果用户的work方法出错，或者用户最后没有调用handler.end，会导致connection无法还到pool中。
            function doWork(){
                try{
                    options.work(dbHandler);
                }
                catch(err){
                    doError(err);
                }
            }

            if (options.isNeedTransaction){
                connection.beginTransaction(function(err){
                    if (err) doError(err);
                    else{
                        doWork();
                        //120秒没有结束的交易，强制结束
                        dbHandler.timerTimeout=setTimeout(function(){
                            err=new Error();
                            err.message="Foil:transaction exeed 120 seconds not commit or rollback,force invoke dbHandler.end by foil.";
                            //err.stack=debugStack.stack;
                            dbHandler.end(err);
                        },120*1000);
                    }
                });
            }
            else doWork();
	    }
	    if (options.connection){
	        doExec(options.connection);
	        return;
	    }
	    else{
    		getConnection({
    			connectionOptions:options.connectionOptions,
    			success:function(connection){
    			    isNewConnection=true;
    			    doExec(connection);
    			},
    			error:options.error
    		});
	    }
	},
    /**
     * 执行sql语句，支持select，delete，insert...
     * @param {object} options
     * @param {object} [options.connection] 数据库连接。如果不给，获取一个新的连接。
     * @param {string} options.sql - 如：'select col1,col2 from TableName where col3 = ? And col4 = ?'
     * @param {any[]} [options.parameters=[]] - 如：[p1,p2]
     * @param {boolean} [options.rowsAsArray=true] - 返回的行记录用值数组还是object
     * @param {boolean} [options.isAutoDisconnect=true] - 是否自动断开数据库连接。<ul>
     * <li>True：自动断开连接；</li>
     * <li>False:不自动断开连接，把连接放在在success的data.connection，以便下一个调用继续使用。如果你要返回到客户端，记得先删除它。</li></ul>
     * @param {callback_success} options.success - 成功后的回调函数。<br/>
     * data格式为:<ul>
     * <li>sql只包含一条语句：如：'select 12 as Name1,23 as Name2'
     *   <ul>
     *     <li>select语句，根据options.rowsAsArray不同：
     *       <ul>
     *         <li>true，返回object：<pre>
     *             {meta:[{},{},...],
     *              rows[[],[],...],
     *              connection:{}
     *             }
     *             如：
     *             { meta:
     *                  [ FieldPacket {
     *                      catalog: 'def',
     *                      db: '',
     *                      table: '',
     *                      orgTable: '',
     *                      name: 'Name1',
     *                      orgName: '',
     *                      charsetNr: 63,
     *                      length: 2,
     *                      type: 8,
     *                      flags: 129,
     *                      decimals: 0,
     *                      default: undefined,
     *                      zeroFill: false,
     *                      protocol41: true },
     *                    FieldPacket {
     *                      catalog: 'def',
     *                      db: '',
     *                      table: '',
     *                      orgTable: '',
     *                      name: 'Name2',
     *                      orgName: '',
     *                      charsetNr: 63,
     *                      length: 2,
     *                      type: 8,
     *                      flags: 129,
     *                      decimals: 0,
     *                      default: undefined,
     *                      zeroFill: false,
     *                      protocol41: true } 
     *                  ],
     *               rows: [ [ 12, 23 ] ],
     *               connection:
     *                  PoolConnection {
     *                    domain: null,
     *                    ...
     *                  }
     *             }</pre>
     *         </li>
     *         <li>false，返回数组：<pre>
     *           [{},{},...]
     *           如：
     *           [ RowDataPacket { Name1: 12, Name2: 23 },
     *             connection: PoolConnection {
     *               domain: null,
     *               ...
     *             }
     *           ]
     *           注意：因为“一切皆对象”，返回的数组带了一个connection属性，但是并不影响数组的length。序列化结果只是一种可能被误解的表现形式。
     *           </pre>
     *         </li>
     *       </ul>
     *     </li>
     *     <li>insert/delete/update语句，返回object：<pre>
     *       {affectedRows:x,
     *        changedRows:x
     *        connection:{}
     *       }</pre>
     *     </li>
     *   </ul>
     * </li>
     * <li><pre>
     * sql包含多条语句，如："select 12 as Name1,23 as Name2; select 'A' as Name1,'B' as Name2"
     * 注意：需要配置config.db_Connection.connection.multipleStatements=true支持多SQL语句
     * 返回数组：</pre>
     *   <ul>
     *     <li>select语句，根据options.rowsAsArray不同：
     *       <ul>
     *         <li>true:<pre>
     *           [{meta:[{},{},...],rows[[],[],...]},
     *            ...,
     *            connection:{}
     *           ]</pre>
     *         </li>
     *         <li>false:<pre>
     *           [[{},{},...],
     *            ...,
     *            connection:{}
     *           ]
     *           注意：因为“一切皆对象”，返回的数组带了一个connection属性，但是并不影响数组的length。序列化结果只是一种可能被误解的表现形式。
     *           </pre>
     *         </li>
     *       </ul>
     *     </li>
     *     <li>insert/delete/update语句，返回：<pre>
     *       [{affectedRows:x,changedRows:x},
     *        ...,
     *        connection:{}
     *       ]
     *       注意：因为“一切皆对象”，返回的数组带了一个connection属性，但是并不影响数组的length。序列化结果只是一种可能被误解的表现形式。
     *       </pre>
     *     </li>
     *   </ul>
     * </li>
     * </li>
     * </ul>
     * 注意：如果isAutoDisconnect为false，才返回connection，以便调用者自己处置connection。
     * @param {callback_error} options.error - 出错时的回调函数
     * @return {undefined}
     * @see 测试用例：{@link testcase::yjDBService_exec}
     * @See module:yjDBService_engine_mysql.execMulti
     */
    exec: function (options) {
         
    	yjDBServiceUtil.checkOptions(options,false);
    	      

    	if (options.connection){
    		doQuery(options.connection);
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
    	}	
    	function doQuery(connection){
            connection.query({
        			sql:options.sql, 
        			values:options.parameters
        		},
                function(err, rowsArray, fieldsArray){
        			if (options.isAutoDisconnect!=false){
                		releaseConnection(connection);
                	}
                    if (err) {
                        if(err.code=="ER_DUP_ENTRY"){
                            var msg = err.message;
                                re = /\'(.*?)\'/g;
                                arr = msg.match(re);
                            // 字段重复时 只提醒输入的“XXX”资料重复，不提供是数据表的
                            // 哪个字段
                            err=yjResourceErrors.newError(
                            'tm.err.foil.mysql.ER_DUP_ENTRY',
                            arr[0]);
                        } 
                    	//这个引擎可以找到domain，不用process.domain.intercept
                    	if (options.isAutoDisconnect==false){
                    		//让外部决定是否释放连接
                    		err.connection=connection;
                    	}
                    	//在错误元件上记录sql语句，日志文件和console中可以打印出来
                    	//mysql的v2.14.0已经在err对象上增加了sql属性记录参数替换后的最终的sql。
                    	if (!err.sql){
                    	    //参数还没替换的sql
                    	    err.sql=options.sql;
                    	}
                        yjError.handleResult(options, err);

                    } 
                    else {	        			
                    	var data=[];	                	
                		function checkMetaRows(meta,rows){
                			if (meta && (meta.constructor==Array)){
                				isMultiple=true;
                    			data.push({
                                	meta:meta,
                                	rows:rows
                                });
                			}
                			else if (meta==null){
                				data.push({
                					affectedRows:rows.affectedRows,
                					changedRows:rows.changedRows,
                					insertedOID:rows.insertId
                				});
                			}
                		}
                		
                		var isMultiple=false;
                    	if (rowsArray && (rowsArray.constructor==Array) &&
                    		fieldsArray && (fieldsArray.constructor==Array)){
                    		for (var i=0;i<fieldsArray.length;i++){
                    			var meta=fieldsArray[i];
                    			var rows=rowsArray[i];
                    			checkMetaRows(meta,rows);
                    		}
                    	}
                		if (isMultiple==false){
                			checkMetaRows(fieldsArray,rowsArray);
                		};
                		
            			if (options.rowsAsArray!=false){
            				//row转成数组
            				var yjDB=require("./client/js/yjDB.js");
            				for(var i=0;i<data.length;i++){
            					if (data[i].meta && data[i].rows){
            						data[i].rows=yjDB.objectList2List(data[i].meta,data[i].rows);                						
            					}
            				}      			                    			
                		}
            			else{
            				//add by wxh,2016/1/8
            				//row直接是object，console.log(data)看到的可能是如下格式，它使用util.inspect函数，把class name打印出来了：
            			    //sql:"select 12 as Name1,23 as Name2; select 'A' as Name1,'B' as Name2;"
            				//[ [ RowDataPacket { Name1: 12, Name2: 23 } ],
            				//  [ RowDataPacket { Name1: 'A', Name2: 'B' } ] ]   
            			    //使用JSON.stringify(data)看到的是：
            			    //[ [ { Name1: 12, Name2: 23 } ],
                            //  [ { Name1: 'A', Name2: 'B' } ] ]
            			    //console.log(JSON.stringify(data));
            			    
            				for(var i=0;i<data.length;i++){
            					if (data[i].rows){
            						data[i]=data[i].rows;
            					}
            				}           				
            			}
            			
                    	if (data.length==1){
                    		data=data[0];
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
     * @param {callback_success} options.success 成功后的回调函数：
     * function(data){}, data格式为:{<ul>
     *   <li>pageIndex:x,     -- int,页码</li>
     *   <li>pageRowCount:x,  -- int,每页记录条数</li>
     *   <li>meta:[],         -- array,数据表的schema。options.rowsAsArray=false时meta为null。</li>
     *   <li>rows:[],         -- array,记录。<pre>
     *                           .options.rowsAsArray=true时rows[i]是值数组，如：[2，'A','B']；
     *                           .options.rowsAsArray=false时rows[i]是object，如：{OID:2,AID:'A',Name:'B'}</pre></li>
     *   <li>total:x          -- int,总的记录条数。只有options.fetchTotalCount=true时，才会返回。</li></ul>
     * }
     * @param {callback_error} options.error 失败后的回调函数:function(err){}
     * @return {undefined}
     */
    selectData: function (options) {
        var sql_page = dbm.getSelectPagerSQL(options);
        if (options.fetchTotalCount==true){
            var index=sql_page.toLowerCase().indexOf('select');
            if (index>=0){
                sql_page=sql_page.substr(0,index+6)+' SQL_CALC_FOUND_ROWS '+sql_page.substr(index+6);
            }
            if(version!="TiDB"){
                sql_page=sql_page+";SELECT FOUND_ROWS() as Total;";
            }
        }
 
        options.sql= sql_page;
        if (options.fetchTotalCount==true){
        	yjUtils.hookCallback(options,function(err,data,oldCallback){

                if(version=="TiDB"){
                    data=[data];
                }
          
        		if (err){
            		oldCallback(err);
        		}
        		else{
                    var data2=null;
                    if (options.rowsAsArray!=false){
                        data2=data[0];
                        data2.total=data[1]?data[1].rows[0][0]:0;                      
                    }
                    else{
                        data2={rows:data[0]};
                        data2.total=data[1]?data[1][0].Total:0;
                    }
                    data2.pageIndex=options.pageIndex;
                    data2.pageRowCount=options.pageRowCount;
                    oldCallback(null, data2);
        		}
            });
        }
        dbm.exec(options);
    },
    /**
     * <pre>新增资料函数，如果有auto increment identity字段，在success中data.OID返回新增的identity值，
     * 只支持insert语句。</pre>
     * @param {object} options 参数
     * @param {string} options.sql sql语句，只能是insert，如：'insert into TabeName(col1,col2) values(?,?)'
     * @param {array} [options.parameters] sql语句的参数值，如：[p1,p2]
     * @param {callback_success} success 成功后的回调函数:function(data){}, data格式为:{OID:x}
     * @param {callback_error} error 失败后的回调函数:function(err){}
     * @return {undefined} 异步调用，无直接返回结果
     */
    insertData:function(options){
    	//注意最開始的意願：是否自動釋放连接
    	var isAutoDisconnect_old=options.isAutoDisconnect;
    	options.isAutoDisconnect=false;
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
    			var sql="select LAST_INSERT_ID()";
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
        			error:function(err2){
        				oldCallback(err2);
        			}
        		}
        		dbm.exec(options2);
    		}
    	});
    	
    	dbm.exec(options);
    },
    /**
     * sql字串中标识符的转义，如：字段名有空格时，mysql是使用`Field`，SQLServer是使用[Field]
     * @param {string} str 要转义的字串
     * @return {string} 转义后的字串
     */
    escapeId:function(str){
    	return mysql.escapeId(str);
    },
    /**
     * @description
     * 把数据库的时间量子化到某个点上。
     * @param {string} dateTimeFieldName 时间字段名
     * @param {int} value 量子化值
     * @param {int} unit 量子化单位：Y,M,D,h,m,s,ms
     * @example
     * <pre>统计时，把数据库中的时间（utc字串）量子化到某个点，即把某个时间点归属到某个量子区间中。
     * 注意：
     * (1).mysql的月和日都是从1开始；而javascript的月是从0开始，日是从1开始
     * (2).mysql的时间戳unix_timestamp单位是秒，而javascript的时间戳单位还是毫秒
     * ps:用空格代替tab，jsdoc排版比较理想。http://www.cnblogs.com/sirwang/p/5763448.html
	 * 假设dataPointInterval是{value:2,unit:'h'}，即2小时，查询区间[L,C)序列应该是：[00:00,02:00,04:00,06:00,08:00...22:00,00:00)
	 * time                value   unit  属于的区间[L,C)          x(合理的显示位置)             映射         公式
	 * 06-12 00:03         1       h     [06-12 00,06-12 01)   06-12 01:00:00.000       0->1->0+1   floor(h/value)*value+value
	 * 06-12 01:03         1       h     [06-12 01,06-12 02)   06-12 02:00:00.000       1->2->1+1   
	 * 06-12 02:03         1       h     [06-12 02,06-12 03)   06-12 03:00:00.000       2->3->2+1   
	 *                                                                                              
	 * 06-12 00:03         2       h     [06-12 00,06-12 02)   06-12 02:00:00.000       0->2->0+2   floor(h/value)*value+value
	 * 06-12 01:03         2       h     [06-12 00,06-12 02)   06-12 02:00:00.000       1->2->0+2   
	 * 06-12 02:03         2       h     [06-12 02,06-12 04)   06-12 04:00:00.000       2->4->2+2   
	 * 06-12 03:03         2       h     [06-12 02,06-12 04)   06-12 04:00:00.000       3->4->2+2   
	 *                                                                                              
	 * 06-01 01:03         1       D     [06-01,06-02)         06-01 00:00:00.000       1->1->1+0   (1+floor((D-1)/value)*value)+(value-1)
	 * 06-02 01:03         1       D     [06-02,06-03)         06-02 00:00:00.000       2->2->2+0   前面部分保证不超过原始天时分秒，后面部分用毫秒加
	 * 06-03 01:03         1       D     [06-03,06-04)         06-03 00:00:00.000       3->3->3+0   
	 *                                                                                              
	 * 06-01 01:03         2       D     [06-01,06-03)         06-02 00:00:00.000       1->2->1+1   (1+floor((D-1)/value)*value)+(value-1)
	 * 06-02 01:03         2       D     [06-01,06-03)         06-02 00:00:00.000       2->2->1+1   
	 * 06-03 01:03         2       D     [06-03,06-05)         06-04 00:00:00.000       3->4->3+1   
	 * 06-04 01:03         2       D     [06-03,06-05)         06-04 00:00:00.000       4->4->3+1   
	 *                                                                                              
	 * 06-01 01:03         3       D     [06-01,06-04)         06-03 00:00:00.000       1->3->1+2   (1+floor((D-1)/value)*value)+(value-1)
	 * 06-02 01:03         3       D     [06-01,06-04)         06-03 00:00:00.000       2->3->1+2   
	 * 06-03 01:03         3       D     [06-01,06-04)         06-03 00:00:00.000       3->3->1+2   
	 * 06-04 01:03         3       D     [06-04,06-07)         06-06 00:00:00.000       4->6->4+2   
	 * ......                                                                                       
	 * 06-30 01:03         3       D     [06-28,07-01)         06-30 00:00:00.000       30->30->28+2
	 *                                                                                  
	 * 2017-01-01 01:03    3       M     [2017-01,2017-04)     2017-03-01 00:00:00.000  1->3        ceil(M/value)*value，溢出12后年进位1
	 * 2017-02-02 01:03    3       M     [2017-01,2017-04)     2017-03-01 00:00:00.000  2->3        月的天数不固定，无法用D的方法加2个月
	 * 2017-03-03 01:03    3       M     [2017-01,2017-04)     2017-03-01 00:00:00.000  3->3        
	 * 2017-04-03 01:03    3       M     [2017-04,2017-07)     2017-06-01 00:00:00.000  4->6        
	 * </pre>
     */
    sql_quantumDateTimeField:function(dateTimeFieldName,value,unit){
    	var sql=null;
    	switch(unit){
    		case 'Y':
    			sql="concat(floor(left({0},4)/{1})*{1},'-01-01 00:00:00')";
    			sql="unix_timestamp("+sql+")*1000";
    			break;
    		case 'M':
    			/**
    			 * mysql的月是从1开始，月份超过12后，年进1
    			 * @ignore
    			 */
    			sql="concat(left({0},4)+floor(ceil(substr({0},6,2)/{1})*{1}/13),'-',lpad(ceil(substr({0},6,2)/{1})*{1}%13,2,'0'),'-01 00:00:00')";
    			sql="unix_timestamp("+sql+")*1000";
    			break;
    		case 'D':
    			sql="concat(left({0},7),'-',lpad(1+floor((substr({0},9,2)-1)/{1})*{1},2,'0'),' 00:00:00')";
    			sql="unix_timestamp("+sql+")*1000+({1}-1)*24*60*60*1000";
    			break;
    		case 'h':
    			sql="concat(left({0},10),' ',lpad(floor(substr({0},12,2)/{1})*{1},2,'0'),':00:00')";
    			sql="unix_timestamp("+sql+")*1000+{1}*60*60*1000";
    			break;
    		case 'm':
    			sql="concat(left({0},13),':',lpad(floor(substr({0},15,2)/{1})*{1},2,'0'),':00')";
    			sql="unix_timestamp("+sql+")*1000+{1}*60*1000";
    			break;
    		case 's':
    			sql="concat(left({0},16),':',lpad(floor(substr({0},18,2)/{1})*{1},2,'0'))";
    			sql="unix_timestamp("+sql+")*1000+{1}*1000";
    			break;
    		case 'ms':
    			sql="concat(left({0},19),'.',lpad(floor(substr({0},21,3)/{1})*{1},3,'0'))";
    			sql="unix_timestamp("+sql+")*1000+{1}";
    			break;
    		default:
    			throw new Error('Unknown unit:'+unit);
    	}
    	sql=yjUtils.formatStr(sql,dateTimeFieldName,value);
    	return sql;
    },
    /**
     * 把数据库的utc时间按目标时区量子化到某个点上。
     * @param {string} tableName 数据表名称
     * @param {string} fields select要选择的字段
     * @param {string} dateTimeFieldName 要处理的时间字段名称
     * @param {int} destTimezone 目标时区，单位：毫秒
     * @param {int} value 量子化间隔
	 * @param {string} unit 量子化单位：Y,M,D,h,m,s,ms
     * @example
     * <pre>假设数据库有如下数据，CatchTime存的utc时间字串。
	 * "DeviceDataTodayOID" "DeviceEntityOID"   "CatchTime"                 "DeviceDataMetaOID" "ValueDec"
	 * "1067"               "187"               "2017-05-01 06:07:08.345"   "79"                "5.1"
	 * "894"                "94"                "2017-05-19 00:06:09.352"   "79"                "6.8"
	 * "599"                "188"               "2017-05-19 00:45:59.025"   "79"                "7.2"
	 * "880"                "93"                "2017-05-19 01:56:18.617"   "79"                "2.9"
	 * "818"                "187"               "2017-05-19 02:05:32.582"   "79"                "3.8"
	 * "833"                "186"               "2017-05-19 04:12:26.612"   "79"                "3.9"
	 * "866"                "189"               "2017-05-19 07:23:43.667"   "79"                "4.6"
	 * "993"                "188"               "2017-05-20 08:37:40.637"   "79"                "3.5"
	 * 
	 * 对GMT +08:00区，转换成本地时间是加8小时。如果dataPointInterval是1h，就是：
	 * "DeviceDataTodayOID" "DeviceEntityOID"   "CatchTime"                 归入x点           "DeviceDataMetaOID" "ValueDec"
	 * "1067"               "187"               "2017-05-01 14:07:08.345"   2017-05-01 15   "79"                "5.1"
	 * "894"                "94"                "2017-05-19 08:06:09.352"   2017-05-19 09   "79"                "6.8"
	 * "599"                "188"               "2017-05-19 08:45:59.025"   2017-05-19 09   "79"                "7.2"
	 * "880"                "93"                "2017-05-19 09:56:18.617"   2017-05-19 10   "79"                "2.9"
	 * "818"                "187"               "2017-05-19 10:05:32.582"   2017-05-19 11   "79"                "3.8"
	 * "833"                "186"               "2017-05-19 12:12:26.612"   2017-05-19 13   "79"                "3.9"
	 * "866"                "189"               "2017-05-19 15:23:43.667"   2017-05-19 16   "79"                "4.6"
	 * "993"                "188"               "2017-05-20 16:37:40.637"   2017-05-20 17   "79"                "3.5"
	 * </pre>
	 * @example
	 * <pre>
	 * var sql_table=yjDBService.sql_quantumDateTimeTable('DeviceDataToday',
            'DeviceEntityOID,DeviceDataMetaOID,CatchTime,ValueDec','CatchTime',
            timezone,dataPointInterval.value,dataPointInterval.unit);
     * var sql_realTimePower=
     *      ' select tb.time, sum(value) as value'+
     *      ' from (select ddt.DeviceEntityOID,quantumTime as time,avg(ddt.ValueDec) as value'+
     *      '       from ({0}) as ddt'+
     *      '       join DeviceDataMetas ddm on ddt.DeviceDataMetaOID=ddm.DeviceDataMetaOID'+
     *      '       where ddm.DeviceDataMetaAID={1} and ddt.DeviceEntityOID in ({2}) and (ddt.CatchTime>={3} and ddt.CatchTime<{4})'+
     *      '       group by ddt.DeviceEntityOID,time) as tb'+
     *      ' group by time'+
     *      ' order by time';
     * sql_realTimePower=yjUtils.formatStr(sql_realTimePower,sql_table,
     *   	yjUtils.quotedStr(deviceDataMetaAID),devices,
     *   	yjUtils.quotedStr(fromTimeStr),yjUtils.quotedStr(toTimeStr));
	 * </pre>
     */
    sql_quantumDateTimeTable:function(tableName,fields,dateTimeFieldName,destTimezone,value,unit){
    	var sql_table=
    		' select {1},date_format(from_unixtime(unix_timestamp({2})+({3})/1000),\'%Y-%m-%d %H:%i:%S.%f\') as quantumTime'+ 
    		' from {0}';
    	sql_table=yjUtils.formatStr(sql_table,tableName,fields,dateTimeFieldName,-destTimezone);
    	sql_time=dbm.sql_quantumDateTimeField('quantumTime',value,unit);
    	var sql=
    		' select {1},({2}+({3})) as quantumTime'+
    		' from ({0}) as tt';
    	sql=yjUtils.formatStr(sql,sql_table,fields,sql_time,-new Date().getTimezoneOffset()*60000+destTimezone);
    	return sql;
    }
};

module.exports = dbm;