/**
 * @fileOverview
 * @author mustapha.wang,2019/4/12
 * @see module:yjResource_errors
 */

/**
 * 错误资源。统一管理系统的错误，避免重复。
 * @exports yjResource_errors
 * @example <pre>
 * var yjRS=yjRequire("yujiang.Foil","yjResource.errors.js");
 * </pre>
 * @see nodejs::yjRequire
 */

var yjMultiLang = require("./yjMultiLang.js"); 
var util=require("util");
var g_errors={};

/**
 * 把错误定义加到错误列表中，如果ID重复会报错
 * @param {object} errors 错误定义，如：
 *  {'tm.err.foil.biz.passwordNotCorrectForUserAID' : "Password is not correct for userAID %s.",
 *   'tm.err.foil.biz.passwordNotCorrectForMobilePhone' : "Password is not correct for mobilePhone %s."}
 */
module.exports.addErrors = function(errors){
    for(var ID in errors){
        var msg=g_errors[ID];
        if (msg){
            throw new Error("error ID already exists:"+ID);
        }
        g_errors[ID]=errors[ID];
    }
}
/**
 * 创建一个error对象，message会按多语言翻译
 * @param {string} ID 错误ID，错误码，错误标识
 * @param {any} p0 错误信息模板的第一个参数
 * ...
 * @param {any} pn 错误信息模板的第n个参数
 * @result {object} {code:xxx,message:xxx}
 * @example
 * <pre>假设有如下错误定义：
 * {'tm.err.foil.biz.passwordNotCorrectForMobilePhone' : "Password is not correct for mobilePhone %s."},
 * 
 * var err=yjResourceErrors.newError('tm.err.foil.biz.dynamicPasswordNotCorrect','138');
 *      
 * 得到的结果：
 * { 
 *   code:"tm.err.foil.biz.dynamicPasswordNotCorrect",
 *   message:"手机号138的密码不对"
 * }</pre>
 */
module.exports.newError=function(ID){
    var msg=g_errors[ID];
    if (!msg){
        throw new Error("Not found error ID:"+ID);
    }
    if (yjMultiLang.isConfigured()){
        msg=yjMultiLang.ml(msg,false);
    }
    var ID0=ID;
    arguments[0]=msg; 
    msg=util.format.apply(null,arguments);
    var err=new Error(msg)
    err.code=ID0;

    return err;
}