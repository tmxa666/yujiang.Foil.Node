/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjAuthority
 * 基于角色的访问控制：Role Based Access Control（RBAC）
 * 这里处理逻辑比较复杂，涉及数据库逻辑，因此不适合放在Foil.Node中，适合放在Foil.Node.BizServer中
 */
/**
 * @module yjAuthority
 * @example <pre>
 * var yjAuthority=yjRequire("yujiang.Foil","yjAuthority.js");
 * </pre>
 * @see nodejs::yjRequire
 */

var yjBizService = require('./yjBizService.js');

var g_authorityAdpter=null;
module.exports = {
	/**
	 * 设置权限适配器。
	 */
	setAuthorityAdapter:function(adapter){
		g_authorityAdpter=adapter;
	},
	/**
	 * 判断用户是否能执行某个作业
	 * @param {string} options.userAID 用户AID
	 * @param {string} options.processURL 作业的url
	 * @param {callback_success} options.success 成功后的回调函数
	 * @param {callback_error} options.error 失败后的回调函数
	 */
	isUserCanRunProcess:function(options){
		if (g_authorityAdpter){
			g_authorityAdpter.isUserCanRunProcess(options);
		}
		else{
			yjBizService.get({
				params : [ 'org', 'isUserCanRunProcess'],
				query : {
					userAID : options.userAID,
					processURL:options.processURL
				},
				success : options.success,
				error : options.error
			});
		}
	},
	/**
	 * 获取某个用户的某个作业的权限
	 * @param {string} options.userAID 用户AID
	 * @param {string} options.processURL 作业的url
	 * @param {callback_success} options.success 成功后的回调函数
	 * @param {callback_error} options.error 失败后的回调函数
	 */
	getUserProcessAuthority:function(options){
		if (g_authorityAdpter){
			g_authorityAdpter.getUserProcessAuthority(options);
		}
		else{
			yjBizService.get({
				params : [ 'org', 'getUserProcessAuthority'],
				query : {
					userAID : options.userAID,
					processURL:options.processURL
				},
				success : options.success,
				error : options.error
			});
		}
	},
	/**
	 * 返回用户被授权的组织的OID列表
	 * @param {string} options.userAID 用户AID
	 * @param {callback_success} options.success 成功后的回调函数
	 * @param {callback_error} options.error 失败后的回调函数
	 */
	getUserOrgOIDs:function(options){
		if (g_authorityAdpter){
			g_authorityAdpter.getUserOrgOIDs(options);
		}
		else{
			yjBizService.get({
				params : [ 'org', 'getUserOrgOIDs'],
				query : {
					userAID : options.userAID
				},
				success : options.success,
				error : options.error
			});
		}
	}
}