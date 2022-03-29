/**
 * @module yjApp_middle_crossDomain
 * @author mustapha.wang,2018/7/27
 * @description
 * 中间件。允许跨域访问。
 */

function crossDomain(req,res,next){
	res.header("Access-Control-Allow-Methods", "DELETE,PUT,POST,GET,OPTIONS");
 	res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Origin", "*");
	next();
}
yjGlobal.app.use(crossDomain);