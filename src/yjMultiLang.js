/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjMultiLang
 */

/**
 * @module yjMultiLang
 * @description 界面多语言翻译
 * @example <pre>
 * var yjMultiLang=yjRequire("yujiang.Foil","yjMultiLang.js");
 * </pre>
 * @see nodejs::yjRequire
 */
var g_IsDDBuilded = false;
var g_DD = null;
var g_LCID_Default = 2052;

function buildDD() {
	if (!g_IsDDBuilded) {
		var acroMultiFileDD =
			global.yjRequire("acroprise.MultiLang", "acroMulti.DD.File.js");
		var yjGlobal = global.yjGlobal;
		var acroMultiTagMethodStorage =
			global.yjRequire("acroprise.MultiLang", "acroMulti.TagMethod.js");
		global.yjRequire("acroprise.MultiLang",	"acroMulti.TagMethod.Register.js");
		g_DD = new acroMultiFileDD();
		g_DD.fileName = yjGlobal.config.locale.DDFile;
		g_DD.buildDD();
		g_IsDDBuilded = true;
	}
}

/**
 * 判断多语言翻译必要的参数配置没有
 * @function isConfigured
 * @return {boolean} 是否配置了必要参数
 */
exports.isConfigured = function() {
    return global.yjGlobal.config.requireDirs && 
           global.yjGlobal.config.requireDirs["acroprise.MultiLang"] &&
           global.yjGlobal.config.locale &&
           global.yjGlobal.config.locale.DDFile;
}
/**
 * 获取当前的语言ID
 * @function getCurrentLCID
 * @return {int} 当前语言ID，如：2052
 */
exports.getCurrentLCID = function() {
	var tag = exports.getCurrentLCTag();

	var acroMultiLocale = global.yjRequire("acroprise.MultiLang","acroMulti.Locale.js");	
	var LCID = acroMultiLocale.tag2LCID(tag);

	if (!LCID)
		LCID = g_LCID_Default;

	return LCID;
}
/**
 * 获取当前语言Tag
 * @function getCurrentLCTag
 * @return {string} 当前语言Tag，如：“en”
 */
exports.getCurrentLCTag=function(){
	var tag = "en";
	try{
		if (process.domain && process.domain.yjRequest){
	        //console.log(process.domain.yjRequest.cookies);
	        //console.log(process.domain.yjRequest.headers);
			var yjCookie=require("./yjCookie.js");
			var locale=null;
			var locale_s=process.domain.yjRequest.cookies[yjCookie.IDs.locale];
			//locale格式：{"LCTag":"zh-CN","LCID":"2052"}
			if (!locale_s){
			    //yjBizService.js用这个header传递，格式：'{"LCTag":"zh-CN","LCID":"2052"}'
			    locale_s=process.domain.yjRequest.headers["tm-locale"];
			}
			if (locale_s){
				locale=JSON.parse(locale_s);
			}
			if (locale) {
				tag=locale.LCTag;
				if (!tag){
					var lcid=locale.LCID;
					tag=exports.LCID2Tag(lcid);
				}
			} 
			else {
				var languages = process.domain.yjRequest.headers["accept-language"];
				//languages格式：zh-CN,zh;q=0.9
				if (languages) {
					var langs = languages.split(";");
					if (langs && (langs.length > 0)) {
						var lang = langs[0];
						tag = lang.split(",")[0];
					}
				}
				else{
					//语言应该以客户端浏览器语言为主，不需要读config.locale.LCID
				}
			}
		}
	}
	catch(err){
		console.log(err.message);
	}
	return tag;
}
/**
 * 转换语言ID到Tag
 * @function LCID2Tag
 * @param {int} LCID 语言ID
 * @return {string} 返回LCID对应的语言Tag
 */
exports.LCID2Tag=function(LCID){
	var acroMultiLocale =
		global.yjRequire("acroprise.MultiLang",	"acroMulti.Locale.js");
	return acroMultiLocale.LCID2Tag(LCID);
}
/**
 * 转换语言Tag到ID
 * @function Tag2LCID
 * @param {string} tag 返回Tag对应的语言LCID
 * @return {int} 语言ID
 */
exports.Tag2LCID=function(tag){
	var acroMultiLocale =
		global.yjRequire("acroprise.MultiLang",
			"acroMulti.Locale.js");
	return acroMultiLocale.tag2LCID(tag);
}
/**
 * @function ml
 * @description <pre>翻译原语。
 * 主要给ejs模板中的javascript部分使用。
 * 在ejs模板中使用时，一般需要转化为json格式字串，否则在ejs中自己要处理双引号问题，如：
 * $("#p_errorMsg").text(<%-JSON.stringify(locals.ml('Please input "oldpassword.'))%>);
 * 不能用这个方法：$("#p_errorMsg").text("<%-locals.ml('Please input \"oldpassword.')%>");</pre>
 * @param {string} DDKey 原语
 * @param {boolean} isToJson 是否转换为json字串
 * @return {string} 翻译后的字串。
 */
exports.ml = function(DDKey, isToJson, LCID) {
	buildDD();
	
	if (!LCID){
		LCID = exports.getCurrentLCID();
	}
	var displayValue = g_DD.getDisplayValue(DDKey, LCID, 0);
	if (isToJson == true) {
		if (displayValue)
			displayValue = JSON.stringify(displayValue);
		else
			displayValue = "";
	}
	return displayValue;
}
/**
 * 用当前语言翻译html内容。<br/>
 * 使用cheerio解析html文本，然后用每个tag对应的tag-method翻译。
 * @function replaceHtml
 * @param {string} html html文本
 * @return {string} 翻译后的文本
 */
exports.replaceHtml = function(html) {
	buildDD();
	var LCID = exports.getCurrentLCID();
	var cheerio = require("cheerio");
	var $ = cheerio.load(html);
	function scanElements(elements) {
		for ( var i = 0; i < elements.length; i++) {
			var element = elements[i];

			if (element["type"] == "tag") {
				var tagMethod =	acroMultiTagMethodStorage.findNearstTagMethod(element.name);

				if (tagMethod) {
					tagMethod(g_DD, $(element), LCID);
				}
			}

			if (element["children"]) {
				scanElements(element.children);
			}
		}
	}

	scanElements($.root().children());
	return $.html();
}