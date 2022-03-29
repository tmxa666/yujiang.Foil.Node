/**
 * @module yjApp_middle_error
 * @author mustapha.wang
 * @description
 * 中间件。拦截错误信息。
 */
var yjError= require("./yjError.js");
function clientErrorHandler(err, req, res, next) {
	//重来没有触发过,2018/8/4,post资料量很大时会触发
    console.error("Node.Foil clientErrorHandler:"+req.url);
	console.error("Node.Foil clientErrorHandler:"+err.stack);
	if (req.xhr) {
	    res.status(err.statusCode?err.statusCode:500).send(err.message);
	} else {
		res.status(err.statusCode?err.statusCode:500).send(err.message);
	}
}
global.yjGlobal.app.use(clientErrorHandler);
//拦截预料之外的异常,拦截不到，why???
//在x.{autorun}.js中抛出一个异常会被触发
process.on('uncaughtException', function(err) {
    if (process.domain && process.domain.yjRequest){
        console.error("Node.Foil uncaughtException:"+process.domain.yjRequest.url);
    }
    console.error("Node.Foil uncaughtException:"+err.stack);
    yjError.handleError(err);
});