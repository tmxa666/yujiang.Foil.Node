/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjCookie
 */
/**
 * @module yjCookie
 * @description 这些cookie id加入了产品名称，因此要求bizserver和webserver的config.product.name保持一致。
 * @example <pre>
 * var yjCookie=yjRequire("yujiang.Foil","yjCookie.js");
 * </pre>
 * @see nodejs::yjRequire
 */
module.exports ={
	/**
	 * @type {object}
	 * @property {string} autoLogin 自动登录的需要的信息的ID
	 * @property {string} token 登录后的access-token的ID
	 * @property {string} refreshToken 用来刷新已经过期的access-token的refresh-token的ID
	 * @property {string} locale 本地语言信息的ID
	 */
	IDs:{
		autoLogin:   "yujiang-"+yjGlobal.config.product.name+'-autoLogin',
		token:       "yujiang-"+yjGlobal.config.product.name+'-x-access-token',
		refreshToken:"yujiang-"+yjGlobal.config.product.name+'-x-refresh-token',
		locale:      "yujiang-"+yjGlobal.config.product.name+'-locale'
	}
}