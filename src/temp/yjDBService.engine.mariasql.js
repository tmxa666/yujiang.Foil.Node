/**
 * @fileOverview
 * Created by Zheng.Guan on 2014/10/15.
 * （1）支持在sql中使用where AID=？的参数形式，但是用new Date()给参数会出错：Incorrect datetime value: 'Fri Oct 17 2014 10:46:51 GMT+0800 (中国标准时间)' for column 'CreateTime'
 * （2）字段中排序规则是“utf8_bin”时中文会显示乱码，"utf8_general_ci"不会
 * （3）不支持存储过程
 */
var g_isInited = false;
var g_connection=null;
var mariaDB = require('mariasql');
var yjDBServiceUtil = require("./yjDBService.util.js");

function getConnection() {
	if (g_isInited)
		return g_connection;
	else {
		var conn=yjDBServiceUtil.getConnection();
		g_connection ={
			host:conn.server,
			user:conn.user,
			password:conn.password,
			db:conn.database
		}
		g_isInited = true;
		return g_connection;
	}
}

var yjError=require("./yjError.js");

var dbm = {
	engine:"mariasql",
    conn: function (callback) {
        var client = new mariaDB();
        client.connect(getConnection());
        var backValues={
            error:null,
            client:null
        }
        client.on('connect', function () {
            backValues.client=client;
            callback(backValues);
        }).on('error', function (err) {
            console.log('connected_error');
            if (err) {
                backValues.err=err;
                callback(backValues);
            }
        }).on('close', function (hadError) {
            client.destroy();
        });
    },
    exec: function (options) {
        try {
        	yjDBServiceUtil.checkOptions(options,false);

        	function doQuery(conn){
        		var result = [];
        		var g_err=null;
        		//一定要有meta,因此useArray参数传false
        		//bug:不能正确处理日期参数
        		conn.query(options.sql, options.parameters, false)//options.rowsAsArray
                    .on('result', function (res) {
                        var table = {
                            rows:[]
                        };

                        res.on('row', function (row) {
                            table.rows.push(row);
                        })
                        .on('error', function (err) {
                            g_err = err;
                        })
                        .on('abort', function () {
                        })
                        .on('end', function (info) {
                            result.push(table);
                        });
                    })
                    .on('end', function () {console.log(result);
                    	if (options.isAutoDisconnect!=false){
                    		conn.end();
                    	}
                        if (g_err) {
                        	yjError.safeError(options.error, g_err);
                        } else {
                        	var data={
                        		meta:[],
                        		rows:[]
                        	}
                            if(result.length>0 && result[0].rows){
                            	data.rows = result[0].rows;
                            }

                            if (options.rowsAsArray!=false){
                            	var yjDB=require("./client/js/yjDB.js");
                            	var dataset=yjDB.objectList2DataSet(data.rows);
                            	
                            	data.meta=dataset.meta;
                            	data.rows=dataset.rows;
                            }                         
                            if (options.isAutoDisconnect==false){
                        		data.connection=conn;
                        	}
                        	yjError.safeSuccess(options.success, data);
                        }
                    });
        	}
        	
        	if (options.connection){
        		var connection=options.connection;
        		doQuery(connection);
        	}
        	else{
                dbm.conn(function (backValues) {
                    if(backValues.err){
                    	yjError.safeError(options.error, backValues.err);                       
                    }
                    else{
                    	doQuery(backValues.client);
                    }                    
                })
        	}
        } catch (err) {
            yjError.safeError(options.error, err);
        }
    },
    selectDataCount:function(options){
    	var success_old=options.success;
        options.success= function (data) {        	
            var count=null;
            if (data.rows && data.rows.length>0) {
                count = data.rows[0][0];
            }
            yjError.safeSuccess(success_old, {count:count});
        }
        options.sql="select count(*)  from("+options.sql+") as abcdefg";
    	options.rowsAsArray=true;
        this.exec(options);
    },
    
    selectData: function (options) {
        yjDBServiceUtil.checkOptions(options,true);

        var sql_old=options.sql;
        var success_old=options.success;                         
        options.success= function (data) {
            data.pageIndex=options.pageIndex;
            data.pageRowCount=options.pageRowCount;
            if (options.fetchTotalCount==true){
                var options2={
                	sql:sql_old,
                	parameters:options.parameters,
                	isAutoDisconnect:true,
                	success:function(data2){
                		data.total=data2.count;
                		yjError.safeSuccess(success_old, data);
                	},
                	error:options.error
                }
                dbm.selectDataCount(options2);            
            }
            else{
            	yjError.safeSuccess(success_old, data);
            }
        }
        if (options.pageRowCount == -1) {
            var sql_page = options.sql;
            if (options.orderBy) {
                sql_page += ' Order By ' + options.orderBy;
            }
        }
        else {
            var sql_page = options.sql +
                ' Order By ' + options.orderBy +
                ' limit ' + (options.pageIndex * options.pageRowCount) +
                ' , ' + options.pageRowCount;
        }
        options.sql= sql_page;
        if (options.fetchTotalCount==true){
        	options.isAutoDisconnect=false;
        }
        this.exec(options);
    },
    insertData:function(options){
    	var success_old=options.success;
    	options.success=function(data){
    		var sql="select LAST_INSERT_ID()";
    		var options2={
    			sql:sql,
    			rowsAsArray:true,
    			connection:data.connection,
    			isAutoDisconnect:true,
    			success:function(data){    				
					//以object传回，如果直接传回integer，客户端有时不认
					var OID=(data.rows && data.rows.length>0)?data.rows[0][0]:null;
					yjError.safeSuccess(success_old,{OID:OID});    				
    			},
    			error:options.error
    		}
    		dbm.exec(options2);
    	}
    	options.isAutoDisconnect=false;
    	dbm.exec(options);
    }
};

module.exports = dbm;