var yjBizService = require('./yjBizService.js');
var g_logFootprintAdpter=null;
module.exports = {
    setLogFootprintAdapter:function(adapter){
        g_logFootprintAdpter=adapter;
    },
    logFootprint:function(options){
        if(g_logFootprintAdpter){
            g_logFootprintAdpter.log(options);
        }
        else{
            yjBizService.get({
                params : [ 'system','log', 'logFootprint'],
                query : {
                    userOID : options.userOID,
                    customerOID:options.customerOID,
                    reqURL:options.reqURL
                },
                success : function(data){
                },
                error : function(err){
                    console.log(err);
                }
            });
        }
    }
}