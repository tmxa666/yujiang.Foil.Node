/**
	应用系统启动前 检查数据库服务是否准备好
**/

module.exports=function(cb){
	if (global.yjGlobal.config.db_Connection){
	 	var oracledb = require("oracledb");
		var timerDBConnect;
		function checkDBService (){
			var ops=global.yjGlobal.config.db_Connection.connection;
			oracledb.getConnection({
			  	host     : ops.server,
			  	user     : ops.user,
			 	password : ops.password,
			 	port:ops.port?ops.port:1521
			},function(err,connection){
				if(err){
					console.error("DBServic is not reday.....");
				}else{
					clearInterval(timerDBConnect);
					connection.close();
			  		cb(true);	
				}
			})
		}
		checkDBService();
		timerDBConnect= setInterval(checkDBService, 1000*2);
	}
}