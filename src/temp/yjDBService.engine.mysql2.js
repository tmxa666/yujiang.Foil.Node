/**
 * @fileOverview
 * created by mustapha.wang,2014/10/17
 * （1）支持在sql中使用where AID=？的参数形式
 * （2）支持mysql和mariadb
 * （3）不支持一次多条语句
 * （4）不支持存储过程
*/
var g_isInited = false;
var g_connection = null;

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
			database:conn.database
		}
		g_isInited = true;
		return g_connection;
	}
}

var mysql = require('mysql2');
var yjError=require("./yjError.js");

var dbm = {
	engine:"mysql2",
    exec: function (options) {
        try {
        	yjDBServiceUtil.checkOptions(options,false);
        	if (options.connection){
        		var connection=options.connection;
        	}
        	else{
            	var connection = mysql.createConnection(getConnection());
            	connection.connect();
        	}

        	connection.execute({
        			sql:options.sql, 
        			values:options.parameters,		
        			rowsAsArray:options.rowsAsArray
        		},
                function(err, rows, fields){
        			/*console.log(rows);
        			console.log(fields);*/
        			//应该何时关闭连接？？要保证关闭
        			//isAutoDisconnect不给就预设自动关闭
        			if (options.isAutoDisconnect!=false){
        				connection.end();
        				connection=null;
        			}        			
                    if (err) {
                    	//这个引擎可以找到domain，不用process.domain.intercept
                        yjError.safeError(options.error, err);
                    } else {
                    	if (fields&&fields.length>0){
                        	var data={
                            	meta:fields,
                            	rows:rows
                            }
                    	}
                    	else if (rows){
                    		//delete/insert/update时，rows为：{fieldCount,affectedRows,insertId,warningStatus}                    		
                    		var data={affectedRows:rows.affectedRows}
                    	}
                    	else{
                    		var data={};
                    	}
                    	if (options.isAutoDisconnect==false){
                    		data.connection=connection;
                    	}
                        yjError.safeSuccess(options.success,data);
                    }
                }
            );
        } catch (err) {
            yjError.safeError(options.error, err);
        }
    },
    selectDataCount:function(options){
    	var success_old=options.success;
    	options.success=function (data) {
            var count=null;
            if (data.rows && data.rows.length>0) {
                count = data.rows[0][0];
            }
            yjError.safeSuccess(success_old, {count:count});
        }
    	options.sql="select count(*) from("+options.sql+") as abcdefg";
    	options.rowsAsArray=true;
        dbm.exec(options);
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
        options.sql= sql_page;
        if (options.fetchTotalCount==true){
        	options.isAutoDisconnect=false;
        }
        dbm.exec(options);
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