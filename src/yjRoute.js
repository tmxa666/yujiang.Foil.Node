/**
 * @author mustapha.wang
 * @fileOverview
 * @see module:yjRoute
 */

/**
 * @module yjRoute
 * @description <pre>处理路由。
 * 定义了一种约定，按MVC的层次来扫描目录下的文件，自动匹配model和view和controller。
 * 建议：开发Biz和Web时，每一个功能或页面，在biz或app下新建一个目录，m/v/c三种文件都放在这个目录中，这样某个人维护某个功能时比较容易管理。不要把整个网站的m集中放一个目录，v集中放一个目录，c集中放一个目录，mvc三者分散放置对多人维护来讲更容易混乱。
 * </pre>
 * mvc文件名，约定分为3节：<ol>
 * <li>功能名；xxx，命名使用javascript函数命名规则，即：开头小写字母动词+名词，如：getUsers，addNewUser</li>
 * <li>动作名，verb，或叫method，如：{get}，{post}</li>
 * <li>类型，{m}，或{v}，或{c}</li></ol>
 * 
 * mvc文件命名约定：<ul>
 * <li>xxx.{autorun}.js，目录扫描时自动载入运行</li>
 * <li>xxx.{get}.{m}.js，使用get的model</li>
 * <li>xxx.{get}.{v}.js，使用get的view</li>
 * <li>xxx.{post}.{c}.js，使用post的controller</li></ul>
 * 
 * 一个目录匹配一次，m,v,c只要有一个都可以建立路由：<ol>
 * <li>xxx.{get}.{m}.js，xxx.{get}.{v}.js，xxx.{get}.{c}.js，三个文件，除了倒数第2节的{m},{v},{c}不一样，其它都一样，匹配为一个m,v,c俱全的路由；</li>
 * <li>c缺少时，用层级目录加文件名第一节，作为路由；</li>
 * <li>verb缺少时，用get；</li></ol>
 * <pre>
 * 得到的路由长短，与config中routeDirs里面的rootDir有关。
 * 假设配置如下：
 * routeDirs:[{
 *   rootDir:"d:/a/b/c"
 *   dir:"d:/a/b/c/d"
 * },
 * 假设有文件d:/a/b/c/d/getUser.{v}.ejs
 * 当rootDir为d:/a/b/c时，得到的路由是：/d/getUser
 * 当rootDir为d:/a/b时，得到的路由是：/c/d/getUser</pre>
 * @example <pre>
 * var yjRoute=yjRequire("yujiang.Foil","yjRoute.js");
 * </pre>
 * @see nodejs::yjRequire
 */

/**
 * 返回系统的全部路由列表。
 * @return {array} 路由表。格式如下：<pre>
 * [{
 *   "name":"bound dispatch",
 *   "keys":[],
 *   "regexp":{
 *   	"fast_star":false,
 * 		"fast_slash":false
 * 	 },
 *   "route":{
 * 		"path":"/biz/account/changeNewPassword",
 * 		"stack":[{
 * 			"name":"<anonymous>",
 * 			"keys":[],
 * 			"regexp":{
 * 				"fast_star":false,
 * 				"fast_slash":false
 * 			},
 * 			"method":"get"
 * 		}],
 * 		"methods":{
 * 			"get":true
 *		}
 *	 }
 *  },
 *  ...
 * ]</pre>
 */
module.exports.getRoutes = function() {
	// http://stackoverflow.com/questions/14934452/how-to-get-all-registered-routes-in-express
	var routes = [];
	var app = global.yjGlobal.app;

	var routeList = app._router.stack;
	for ( var i = 0; i < routeList.length; i++) {
		var route = routeList[i];
		if (route.route) {
			routes.push(route);
		}
	}
	return routes;
}

var path = require("path");
var yjMVC=require("./yjMVC.js");
/**
 * 扫描文件夹，自动匹配M、V、C，生成并注册路由表。
 * @param {object} options 参数
 * @param {string} options.rootDir 根目录，路由url是相对根目录的相对路径。
 * @param {string} options.dir 要扫描的目录
 * @param {boolean} [options.isNeedAuthorityCheck=true] 是否需要权限检查
 * @return {void}
 */
exports.scanRoute =	function(options) {
	//rootDir, dir, isNeedAuthoryCheck
	var yjDirectory = require("./yjDirectory.js");
	yjDirectory.scanFiles(options.dir,
		{
			isSort : false,
			scanedDirSelf : function(dir, files) {
				if (files.length <= 0)
					return;

				files.forEach(function(file) {
					var partName = file.partName;

					var ext = path.extname(partName);
					file.baseName =	partName.substring(0, partName.length - ext.length);
					if (file.baseName.substring(file.baseName.length - "{autorun}".length).toLowerCase() == "{autorun}") {
						require(file.fullName);
						file.checked = true;
					} else {
						file.checked = false;
					}
					file.names = file.baseName.split(".");
				});

				files.forEach(function(file) {
					if (!file.checked && file.names.length > 0) {
						var tier = file.names[file.names.length - 1].toLowerCase();
						if (tier == "{m}" || tier == "{v}" || tier == "{c}") {
							var names = new Array();
							names = names.concat(file.names);
							names[names.length - 1] = "{m}";
							var mName =	names.join(".").toLowerCase();

							names[names.length - 1] = "{v}";
							var vName =	names.join(".").toLowerCase();

							names[names.length - 1] = "{c}";
							var cName =	names.join(".").toLowerCase();

							var m, v, c;
							files.forEach(function(file2) {
								if (!file2.checked) {
									if (file2.baseName.toLowerCase() == mName)
										m = file2;
									else if (file2.baseName.toLowerCase() == vName)
										v = file2;
									else if (file2.baseName.toLowerCase() == cName)
										c = file2;
									else
										return;
									file2.checked = true;
								}
							});
							if (m || v || c) {
								// 没有找到controller路由器文件，就按目录结构作为路由器
								// 假设：dir=d:\biz\overview\get

								var route =	dir.substring(options.rootDir.length);
								if (options.nameSpace){
									route=path.join(options.nameSpace,route);
								}
								route=route.replace(/\\/g, "/");// route=/biz/overview
								var method;
								function isToken(s) {
									return ((s.length > 1) && (s[0] == "{") && (s[s.length - 1] == "}"));
								}
								if (c) {
									// 找到了controller路由器文件，载入
									var mod = require(c.fullName);
									// 如果controller中是字串，约定为参数，如：module.exports=":UserAID?";
									if (typeof mod == "string") {
										var params = mod;
										if (!isToken(c.names[0]))
											route +="/" + c.names[0];
										if (params[0] != "/")
											route += "/";
										route += params;
										if (c.names.length > 1)
											method = c.names[c.names.length - 2];
									} else
										return;
								} else {
									if (m) {
										if (m.names.length > 1)
											method = m.names[m.names.length - 2];
										if (!isToken(m.names[0]))
											route += "/" + m.names[0];
									} else if (v) {

										if (v.names.length > 1)
											method = v.names[v.names.length - 2];
										if (!isToken(v.names[0]))
											route += "/" + v.names[0];
									}
								}

								var mFile, vFile;
								if (m)
									mFile = m.fullName;
								if (v)
									vFile = v.fullName;

								if (method) {
									if (method[0] == "{"
										&& method[method.length - 1] == "}")
										method =method.substring(1,	method.length - 1);
									else
										method = "get";
								} else
									method = "get";
								
								if (!options.excludes || options.excludes.indexOf(route)<0){
									yjMVC[method](route, mFile,vFile, 
										(options.isNeedAuthorityCheck==null)?true:options.isNeedAuthorityCheck);
								}
							}
						}
					}
				});
			}
	});
}

/**
 * 移除某些路由。如果项目/产品有自己的路由代替了框架提供的路由，移除旧的，避免被用户不小心访问到。
 * @param {array} paths 要移除的路由列表
 */
module.exports.removeRoutes = function(paths) {
	var app = global.yjGlobal.app;
	var routeList = app._router.stack;
	for ( var i = routeList.length-1; i>=0; i--) {
		var route = routeList[i];
		if (route.route && route.route.path) {
			for (var j=0;j<paths.length;j++){
				if (route.route.path==paths[j]){
					routeList.splice(i,1);
					break;
				}
			}
		}
	}
}