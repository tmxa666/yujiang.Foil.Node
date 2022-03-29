module.exports=function(cb){
	if (global.yjGlobal.config.db_Connection){
	 	var MongoClient  = require("mongodb").MongoClient;
		var timerDBConnect;
		function checkDBService (){
			var ops=global.yjGlobal.config.db_Connection.connection;

			var connstr='mongodb://'+ops.server+':'+(ops.port?ops.port:27017);
			var dbName= ops.database;
		
			MongoClient.connect(connstr, function(err, client) {
		 		if(err){
		 			console.error("DBServic is not reday.....");
		 		}else{
		 			// var db = client.db(dbName); 
			  		// 	client.close();
		 			clearInterval(timerDBConnect);
			  		cb(true);	
		 		}
			});
		}
		checkDBService();
		timerDBConnect= setInterval(checkDBService, 1000*2);
	}
}