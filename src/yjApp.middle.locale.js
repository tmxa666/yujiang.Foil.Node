/**
 * @module yjApp_middle_locale
 * @author mustapha.wang
 * @description
 * 中间件。把当前语言的标识从cookie中解析到req.session.yjLocale上。
 */
function localeHandler(req,res,next){
	var yjCookie=require("./yjCookie.js");
	var locale_s=req.cookies[yjCookie.IDs.locale];
	var locale={};
	if (locale_s){
		locale=JSON.parse(locale_s);
	}
	if (!req.session){
		req.session={};
	}
	req.session.yjLocale=locale;
	next();
}
yjGlobal.app.use(localeHandler);