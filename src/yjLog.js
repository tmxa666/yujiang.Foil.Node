/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjLog
 */

/**
 * @module yjLog
 * @description 日志功能元件。
 * @example <pre>
 * var yjLog=yjRequire("yujiang.Foil","yjLog.js");
 * </pre>
 * @see nodejs::yjRequire
 */
var yjGlobal = global.yjGlobal;
var g_dateFileLog=console;
var g_logDir = yjGlobal.config.logDir;
if (g_logDir) {
	var path = require("path");
	var fs = require("fs");
	if (!fs.existsSync(g_logDir)) {
		var dir;
		g_logDir.split(path.sep).forEach(function(dirName) {
			if (dir) {
				dir = path.join(dir, dirName);
			} else {
				dir = dirName;
			}
			if (dir&&!fs.existsSync(dir)){
				if (!fs.mkdirSync(dir)) {
					return false;
				}
			}
		});
	}

	var log4js = require('log4js');
	log4js.configure({
		appenders : {
		    console: {
    			type : 'console'
    		}, // 控制台输出
    		dateFile:{
    			type : "dateFile",
    			filename : path.join(g_logDir, 'log'),
    			pattern : "-yyyy-MM-dd",
    			alwaysIncludePattern : true
    		} // 日期文件格式
		},
		categories:{
		    default:{appenders:['console'],level:"all"},
		    dateFileLog:{appenders:['dateFile'],level:"all"}
		}
	});
    var consoleLog = log4js.getLogger('console');
    console.log = consoleLog.info.bind(consoleLog);

    console.error = consoleLog.error.bind(consoleLog);
    console.warn = consoleLog.warn.bind(consoleLog);
    console.info = consoleLog.info.bind(consoleLog);
	// 页面请求日志,用auto的话,默认级别是WARN
    g_dateFileLog = log4js.getLogger('dateFileLog');
	if (yjGlobal.app) {
		// 在qunit的单元测试用例里面app访问不到
		yjGlobal.app.use(log4js.connectLogger(g_dateFileLog, {
			level : 'all',
			format : ':method :url'
		}));
	}
}
module.exports = g_dateFileLog;
