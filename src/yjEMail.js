/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjEMail
 */

/**
 * @exports yjEMail
 * @description <pre>只能在node.js中使用。
 * 发送电子邮件。
 * @example <pre>
 * var yjEMail=yjRequire("yujiang.Foil","yjEMail.js");
 * </pre>
 * @see nodejs::yjRequire
 */

var nodemailer = require('nodemailer');
var util=require('util');
var yjError=require("./yjError.js");
var yjSecurity = require("./yjSecurity.js");

module.exports = {
	/**
	 * 向一个或多个邮箱发送电子邮件。发送时如果没有指定SMTP相关参数，使用global.yjGlobal.config.email中的参数。
	 * @param {object} options
	 * @param {boolean[]} options.pool - 是否使用缓冲池。
	 * @param {string} options.host - smtp服务器地址。
	 * @param {int} options.port - 发送端口。
	 * @param {boolean} options.secure - 是否使用SSL。
	 * @param {object} tls - 
	 * @param {boolean} tls.rejectUnauthorized - 
	 * @param {object} options.auth - 登录授权
	 * @param {string} options.auth.user - 账号
	 * @param {string} options.auth.pass - 密码
	 * @param {string} options.from - 从哪个邮箱发出邮件
	 * @param {array} options.to - 向哪一个或多个邮箱发送邮件
	 * @param {string} options.subject - 主题
	 * @param {string} options.text - 纯文本格式正文
	 * @param {string} options.html - html格式正文
	 * @param {callback_success} options.success - 成功后的回调函数。
	 * @param {callback_error} options.error - 失败后的回调函数。
	 * @return {void}
	 */
	send : function(options) {
		if (global.yjGlobal.config.email) {
			var config = global.yjGlobal.config.email;
			util._extend(config,options);
		}
		else{
			var config=options;
		}
		if (config.auth && !config.auth.pass && config.auth.encryptedPassword) {
			var encrptedPassword = config.auth.encryptedPassword;
			
			var password='';
			if (global.yjGlobal.config.security.passwordEncryptMode=="rsa"){
				password = yjSecurity["Diffie-Hellman"].decrypt(encrptedPassword);
			}
			else{
				password = yjSecurity.decryptStr0_Ansi(encrptedPassword);
			}
			config.auth.pass = password;
		}
		var transporter = nodemailer.createTransport(config);
		
		transporter.sendMail(config, function(err, info) {
			yjError.handleResult(options,err,info);
		});
	}
}