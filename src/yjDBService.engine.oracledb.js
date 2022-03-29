/**
 * @fileOverview
 * @author Mico,2017/10/17
 * @description <pre>oracledb数据库引擎。
 * （1）支持在sql中使用where AID=:p 的参数形式
 * （3）bug:不会按存储过程中的执行顺序和次数返回结果</pre>
 * @see module:yjDBService_engine_oracledb
     var g_dbConenctions = {
        engine: "oracledb",
        connection: {
            server: '127.0.0.1',
            database: 'PIIS',
            user: 'jiaozheng',
            password: 'qW123456',
            poolSizeMin:5,
            poolSizeMax:10,
            port:1521,
            insecureAuth: true
        }
    };
*/

var yjDBServiceUtil = require("./yjDBService.util.js");
var yjError=require("./yjError.js");
var yjUtils=require("./client/js/yjUtils.js");
var events = require('events');
var pkg='oracledb';
if (global.yjGlobal.config.db_Connection && 
  global.yjGlobal.config.db_Connection["package"]){
  pkg=global.yjGlobal.config.db_Connection["package"];
}
var oracledb = require(pkg);
oracledb.autoCommit = true;
var merge = require("merge");
var g_oracledbpools={};
var poolCreating={};
/*
 * 为了支持多个数据库，允许传递不同连接参数
*/
function getOracledbPoolKey(connectionOptions) { 
    // biz 未特别指定连接库，使用默认
    if (!connectionOptions.connectionOptions){
        var conn=yjDBServiceUtil.getDefaultConnectionOptions();
        connectionOptions.connectionOptions=merge(true,conn);
        connectionOptions.connectionOptions.connectString=conn.server+":"+conn.port+"/"+conn.database;
    }
    else{
        // biz端指定了默认链接库 
        if (!connectionOptions.connectionOptions.connectString){
            var conn=connectionOptions;
            connectionOptions.connectString=conn.server+":"+conn.port+"/"+conn.database;
        }else{

        }
    } 
    return connectionOptions.connectionOptions;
}

function getConnection(options){
    var conn=getOracledbPoolKey(options.connectionOptions);
    var key=JSON.stringify(conn.connectString);
    var  poolSizeMin= conn.poolSizeMin?conn.poolSizeMin:10;
    var  poolSizeMax=conn.poolSizeMax?conn.poolSizeMax:20;
    oracledbpool=g_oracledbpools[key];
    if(!poolCreating["eventEmitter"+key]){
            poolCreating["eventEmitter"+key]=new events.EventEmitter(); 
    }
    if(!oracledbpool){
        //连接池尚未创建；
        // 是否在创建中
        if(!poolCreating[key]){
            //开始创建
            poolCreating[key]=true;

            if(poolSizeMin>=poolSizeMax){
                yjError.handleError(new Error("poolSizeMax must more than poolSizeMin!"))
            }
            options.connectionOptions.connectionOptions.poolMin=poolSizeMin;  
            options.connectionOptions.connectionOptions.poolMax=poolSizeMax;     
            oracledb.createPool(options.connectionOptions.connectionOptions,function(err, pool){
                poolCreating[key]=false;
                g_oracledbpools[key] = pool;
                poolCreating["eventEmitter"+key].emit("getConnection",pool);
                pool.getConnection(function(err, connection){
                    yjError.handleResult(options,err,connection);
             
                });
            });
        }else{
            // 等待pool创建完成再执行
            poolCreating["eventEmitter"+key].on("getConnection",function(pool){
                pool.getConnection(function(err, connection){

                    //console.log("连接池已创建");
                    yjError.handleResult(options,err,connection);
                });
            })
        }   
    }else{
        //console.log("连接池已创建");
        oracledbpool.getConnection(function(err, connection){
            yjError.handleResult(options,err,connection);
        });
    }   
}
function releaseConnection(connection){
    if(connection){
      connection.release();
    }
}
/**
 * oracledb数据库引擎。
 * @exports yjDBService_engine_oracledb
 * @see module:yjDBService_engine_sqlserver
 * @example <pre>
 * var yjDBService_oracledb=yjRequire("yujiang.Foil","yjDBService.engine.oracledb.js");
 * </pre>
 * @see nodejs::yjRequire
 */
var dbm = {
    /**
     * 引擎名。写无效。
     * @type {string}
     */
  engine:"oracledb",
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
                connectionOptions:options,
                success:function(connection){
                  doQuery(connection);
                },
                error:function(err){
                  yjError.handleResult(options,err);
                }
            });
        }
        function doQuery(connection){
            var param3={autoCommit: true, };
			if(options.clob2String){
			    param3["fetchInfo"]={};
				if(Object.prototype.toString.call(options.clob2String)=='[object Array]'){
					var fetchInfos=options.clob2String;
				}else{
					var fetchInfos=options.clob2String.split(',');
				}
				fetchInfos.map(function(item){
					param3["fetchInfo"][item]= {type: oracledb.STRING};
				})
			}
            connection.execute( options.sql, options.parameters,param3,
                function(err, result){
                    if(err){
                        connection.close(
                            function(err) {
                                if (err) {
                                    console.error(err.message);
                                }
                            }
                        );
                        //在错误元件上记录sql语句，日志文件和console中可以打印出来
                        if (!err.sql){
                            err.sql=options.sql;
                        }
                        yjError.handleResult(options,err);
                        return;
                    }
                    var data=[];
                    if(result.metaData && result.rows ){
                        if(options.rowsAsArray!=false){
                            var temp={};
                            temp.meta=result.metaData;
                            temp.rows=result.rows;
                            data.push(temp);
                            data=data[0];
    
                        }else{
                            for (var i=0;i<result.rows.length;i++){
                                var temp={};
                                for( var j=0;j<result.metaData.length;j++){
                                    temp[result.metaData[j].name]=result.rows[i][j];
                                }
                                data.push(temp);
                            } 
                        }
                    }else{
                        data={"affectedRows":result.rowsAffected};
                    }
                    if (options.isAutoDisconnect==false){  
                        data.connection=connection;
               
                    }else{
                        connection.close(
                            function(err) {
                                if (err) {
                                  console.log("close after release")
                                    console.error(err.message);
                                }
                            }
                        );
                    }
                    yjError.handleResult(options,null,data);
                }
            );
        }
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
        //注意最開始的意願：是否自動釋放连接
        var isAutoDisconnect_old=options.isAutoDisconnect;
        options.isAutoDisconnect=false;
        yjUtils.hookCallback(options,function(err,data,oldCallback){
            if (err){
                var connection=err.connection;
                //最初本意是自动关闭连接
                if(isAutoDisconnect_old!=false && connection){
                    //如何关闭连接？
                    releaseConnection(err.connection);
                }
                delete err.connection;
                oldCallback(err);
            }
            else{
                var sql="select "+options.seqName+".Currval from dual";
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
    escapeId:function(str){
        return str;
    },
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
        options.sql="select count(*) from("+options.sql+")";
        options.rowsAsArray=true;
        dbm.exec(options);
    },
    getSelectPagerSQL:function(options){
        yjDBServiceUtil.checkOptions(options,true);
        var sql_page = options.sql;
        if (options.pageRowCount == -1) {
            if (options.orderBy) {
                sql_page += ' Order By ' + options.orderBy;
            }
        }
        else {
            sql_page='select *from (select a.*, rownum rn from ('+
            sql_page+' Order By '+options.orderBy+') a where rownum <= '+((options.pageIndex+1)*options.pageRowCount)+')'+
            ' where rn >'+(options.pageIndex * options.pageRowCount);
        }
        return sql_page;
    },
    selectData:function(options){
        var sql_old=options.sql;        
        var sql_page = dbm.getSelectPagerSQL(options);
        var isAutoDisconnect_old=options.isAutoDisconnect;
        options.sql= sql_page;
        if (options.fetchTotalCount==true){
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
                    data.pageIndex=options.pageIndex;
                    data.pageRowCount=options.pageRowCount;
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
            });
        }
        dbm.exec(options);
    }
};
module.exports = dbm;
