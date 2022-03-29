/**
 * @fileOverview 框架初始化。
 * 单独提出来，是因为yjApp.js和yjCrossProcessGlobal.js都需要它。
 * @see module:yjApp_init
 * @author mustapha.wang
 */

/**
 * @callback callback_success
 * @param {object} data
 */

/**
 * @callback callback_error
 * @param {error} err
 */

/**
 * @global
 * @function nodejs::yjRequire
 * @description <pre>node.js全局变量，从config的requireDirs中查找调用的模组，提供更灵活的部署模式。
 * 与require函数不一样，require查找模组的原则是查找node_modules目录。
 * config配置举例：
 * 文件：config.wxh.js
 * var config={
 *     ...
 *     requireDirs : {
 *         "yujiang.Foil" : path.join(g_dirFoil,"src"),
 *         "acroprise.MultiLang" : path.join(g_dirFoil,"../MultiLanguage/Component/JavaScript/Acroprise.MultiLang.JavaScript/src")
 *     },
 *     ...</pre>
 * @param {string} namespace - 命名空间
 * @param {string} file - 要引入的js文件
 * @return {any} - 返回文件exports出来的内容
 * @example <ul>
 * <li>var yjDirectory = global.yjRequire("yujiang.Foil",'yjDirectory.js');</li>
 * </ul>
 * <pre><code>var yjDirectory = global.yjRequire("yujiang.Foil",'yjDirectory');
 * var path = require("path");
 * var dir=path.join(__dirname, "data")
 * var files = yjDirectory.scanFiles(dir, {
 *     isSort : true
 * });
 * if (files.length>0){
 *     var release = require(files[files.length-1].fullName);
 *     yjGlobal.version=release.version;
 * }
 *
 * var files = yjDirectory.scanFiles(global.yjGlobal.config.product.releaseLogDir, {
 *     isSort : true
 * });
 * if (files.length>0){
 *     var release = require(files[files.length-1].fullName);
 *     yjGlobal.config.product.version=release.version;
 * }</code></pre>
 */

/**
 * @global
 * @name nodejs::yjGlobal
 * @description node.js全局变量
 * @type {yjGlobal}
 * @see yjGlobal
 */

var path = require('path');
var util = require("util");
var fs=require("fs");
var yjResourceErrors = require("./yjResource.errors.js");
require("./yjResource.strings.js");
var yjGlobal = require("./yjGlobal.js");

var g_configFile="";

function setConfigFile(file){
	g_configFile=file;
}

function getConfigFile(){
	return g_configFile;
}

global.yjGlobal = yjGlobal;

function init() {
	var config={};
	if (g_configFile){
		config = require(g_configFile);
	}
	//给参数赋初值
	if (!config.port){
		if (config.isNeedView==true){
			config.port=3001;
		}
		else{
			config.port=3000;
		}
	}
	if (!config.port_https){
		if (config.isNeedView==true){
			config.port_https=3444;
		}
		else{
			config.port_https=3443;
		}
	}
	if (!config.potocols){
		config.potocols=['http'];
	}
	if (!config.security){
		config.security={};
	}
	if (!config.security.passwordEncryptMode){
		config.security.passwordEncryptMode=['random','rsa'][1];
	}
	if (config.security.isNeedSession==true && !config.security.login_url){
		config.security.login_url="/app/account/ShowLogin";
	}
	if (!config.security.loginTypes){
		config.security.loginTypes=["userID"];
	}
	if (!config.homePage_url){
		config.homePage_url='/';
	}
	
	if (!config.product){
		config.product={};
		config.product.env='development';
		config.product.description='[config.product.description]';
	}
	if (!config.product.name){
		config.product.name='[config.product.name]';	
	}
	if (!config.product.version){
		config.product.version='[config.product.version]';
	}
	if (!config.product.company){
		config.product.company={
			name:"[config.product.company.name]",
			website:"[config.product.company.website]"
		}
	}
	if (!config.product.logo){
		config.product.logo = "/images/login/logo.png";
	}
	if (!config.product.favIcon){
		config.product.favIcon = path.join(__dirname, "/client/img/Foil.ico");
	}

	if (g_configFile){
		var rootDir=path.dirname(g_configFile);
	}
	else{
		var rootDir=path.join(__dirname,'../../');
	}
	
	if (!config.requireDirs){
		config.requireDirs={};
	}
	if (!config.requireDirs['yujiang.Foil']){
		config.requireDirs['yujiang.Foil']=__dirname;
	}
	if (!config.logDir){
		config.logDir=path.join(rootDir,'log');
	}
	if (!config.cache){
		config.cache={
			engine:"native",
			isCacheView:false
		}
	}		
	if (!config.cache.connection){
		config.cache.connection={};
	}
    if (config.cache.engine=='native' && !config.cache.connection.dir){
		var dir=path.join(rootDir,"uploaded");
		config.cache.connection.dir=dir;
		if (!fs.existsSync(dir)){
			fs.mkdirSync(dir);
		}
	}
    if (config.locale && !config.locale.DDFile){
    	config.locale.DDFile=path.join(__dirname,'../../yujiang.Foil.Node.Lng/Unicode.lng');
    }
    
    if (!config.processTree){
    	config.processTree={};
    }
    if (!config.processTree.style){
    	config.processTree.style=["accordion","tree"][0];
	}
    
    if (!config.packages){
    	config.packages={};
    }
    if (!config.packages.version){
    	config.packages.version={};
    }
    if (!config.packages.version['jquery-easyui']){
    	config.packages.version['jquery-easyui']="1.5";
    }
    
    if (!config.project){
    	config.project={};
    }
    if (!config.project.edition){
    	config.project.edition='v0.1';
    }
	//console.log(config);
	global.yjRequire = function(namespace, file) {
		var dir = config.requireDirs[namespace];
		if (!dir) {			
			throw yjResourceErrors.newError('tm.err.foil.namespaceNotConfig');
		}
		if (!file){
			file = "";
		}
		return require(path.join(dir, file));
	}
	yjGlobal.configFile = g_configFile;
	yjGlobal.config = config;

	return config;
}

/**
 * @exports yjApp_init
 * @description <pre>只能在node.js中使用。</pre>
 * @example <pre>
 * var yjAPP_init=yjRequire("yujiang.Foil","yjApp.init.js");
 * </pre>
 * @see nodejs::yjRequire
 */
module.exports={
	/**
	 * 获取配置文件名
	 * @function
	 * @return {string} 返回文件名
	 */
	getConfigFile:getConfigFile,
	/**
	 * 设置配置文件名
	 * @function
	 * @param {string} file 文件名
	 */
	setConfigFile:setConfigFile,
	/**
	 * 初始化Foil。按配置文件建立配置环境。
	 * @function
	 * @return {config}
	 */
	init:init,
	/**
	 * 初始化任务。task是async模组的一个函数，签名为function(cb)。
	 * 当Foil框架yjApp.run后，开始扫描路由，用户可以在xx.{autorun}.js或config.autoRunDirs中启动自己的预处理任务，
	 * 但是这些任务可能是异步的，不能保证顺序。因此，根据情况，如果需要确保在任务执行完毕后才开启服务监听，那就可以把这个任务加入到yjApp.init的tasks中。
	 * @type {arrray}
	 */
	tasks:[]
}