/**
 * @fileOverview 
 * created by mustapha.wang,2014/10/17
 * （1）不支持在sql中使用where AID=？的参数形式，而是where AID=@AID形式
*/
var g_isInited = false;
var g_connection=null;

var yjDBServiceUtil = require("./yjDBService.util.js");

function getConnection() {
	if (g_isInited)
		return g_connection;
	else {
		var conn=yjDBServiceUtil.getConnection();
		g_connection ={
			driver:conn.driver,
			server:conn.server,
			database:conn.database,
			user:conn.user,
			password:conn.password
		}
		g_isInited = true;
		return g_connection;
	}
}
var sqlserver = require('mssql');
var yjError=require("./yjError.js");

var dbm ={
	engine:"mssql",
	exec : function(options) {
		yjDBServiceUtil.checkOptions(options,false);
		
		function doQuery(conn){
			var request = conn.request();
			try {
				//参数是用名称-类型-值加入的

				request.query(
					options.sql,
					//options.parameters,
					function(err, results) {
						console.log(results);
						if (options.isAutoDisconnect!=false){
							conn.close();
						}						
						if (err) {
							yjError.safeError(options.error,err);
						} else {
							try {
								var data={
									meta:results?results.columns:null,
									rows:results
								}												

								if (data.meta) {
									var meta = [];
									for ( var id in data.meta) {
										meta.push(data.meta[id]);
									}
									data.meta=meta;
									
									if (options.rowsAsArray!=false){									
										var yjDB =require("./client/js/yjDB.js");
										data.rows =yjDB.objectList2List(data.meta,data.rows);
									}
								}
											
								if (options.isAutoDisconnect==false){
									data.connection=conn;
								}
								yjError.safeSuccess(options.success,data);
							} catch (err) {
								yjError.safeError(options.error,err);
							}
						}
					});
			} catch (err) {
				yjError.safeError(options.error,err);
			}
		}
		
		try {
			if (options.connection){
				var connection=options.connection;
				doQuery(connection);
			}
			else{
				var conn = sqlserver.connect(
					getConnection(),
					function(err) {
						if (err) {
							yjError.safeError(options.error,err);
						} else {
							doQuery(conn);
						}
					}
				);
			}
		} catch (err) {
			yjError.safeError(options.error,err);
		}
	},
	
    selectDataCount: function (options) {
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
        options.success=function (data) {
            data.pageIndex = options.pageIndex;
            data.pageRowCount = options.pageRowCount;
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
            if (options.orderBy){
            	sql_page+=' Order By ' + options.orderBy;
            }
        } else if (options.pageRowCount == 0) {
            var sql_page = 'Select Top 0 * From (' +
                    options.sql + ' Order By ' + options.orderBy +
                    ' Offset 0 Rows Fetch Next 1 Rows Only'+
                ') T ';
        } else {
            var sql_page = options.sql +
                ' Order By ' + options.orderBy +
                ' Offset ' + (options.pageIndex * options.pageRowCount) +
                ' Rows Fetch Next ' + options.pageRowCount +
                ' Rows Only';
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
    		//var sql="select SCOPE_IDENTITY()";//得不到
    		var sql="select @@IDENTITY";
    		var options2={
    			sql:sql,
    			rowsAsArray:true,
    			isAutoDisconnect:true,
    			connection:data.connection,
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
}
module.exports = dbm;