/**
	应用系统启动前 检查数据库服务是否准备好
**/

module.exports=function(cb){
	if (global.yjGlobal.config.db_Connection){
	 	var mysql = require("mysql");
		var timerDBConnect;
		function checkDBService (){
			var ops=global.yjGlobal.config.db_Connection.connection;
			var connection = mysql.createConnection({
			  host     : ops.server,
			  user     : ops.user,
			  password : ops.password,
			  port:ops.port?ops.port:3306
			})
			connection.connect(function(err) {
			  	if (err) {
			    	console.error("DBServic is not reday.....");
			  	}else{
			  		clearInterval(timerDBConnect);
			  		cb(true);	
			  	}
			});	
		}
		checkDBService();
		timerDBConnect= setInterval(checkDBService, 1000*2);
	}
}