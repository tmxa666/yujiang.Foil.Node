/**
	应用系统启动前 检查数据库服务是否准备好
**/
var yjDBServiceUtil = require("./yjDBService.util.js");
module.exports=function(cb){
	if (global.yjGlobal.config.db_Connection){
	 	var sqlserver = require("msnodesqlv8");
	 	var connectionPattern =
			"Driver={%s};Server={%s};Database={%s};UID=%s;PWD=%s";
		var util = require("util");	

		var ops=global.yjGlobal.config.db_Connection.connection;	
	    var connectionStrings = util.format(connectionPattern, ops.driver,
                ops.server, ops.database,  ops.user,
                ops.password);
		var timerDBConnect;
		function checkDBService (){
			sqlserver.open(connectionStrings,function(err,connection){
		    	if(err){
					console.error("DBServic is not reday.....");
				}else{
					clearInterval(timerDBConnect);
					connection.close();
			  		cb(true);	
				}
		    });
		}
		checkDBService();
		timerDBConnect= setInterval(checkDBService, 1000*2);
	}
}