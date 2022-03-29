/**
 * @fileOverview 只能在node.js环境下使用。记录框架的全局元件。
 * @author mustapha.wang
 * @see module:yjGlobal
 */
/**
 * 全局对象。
 * @exports yjGlobal
 * @example <pre>
 * var yjGlobal=yjRequire("yujiang.Foil","yjGlobal.js");
 * 或者直接使用global.yjGlobal
 * </pre>
 * @see nodejs::yjRequire
 */
module.exports = {
	/**
	 * <pre>版本号，如："1.0.9"。
	 * 注意：运行时，webserver的app/system/release/readNewestVersion.{autorun}.js会刷新这个版本号。
	 * 因此每次发布新版本时，不需要手动修改这里的版本号，只需要在app/system/release/data下定义新的发布日志文件。
	 * 刷新是按data目录下的文件名排序，取最大的那个认为是最新的版本。
	 * </pre>
	 * @type {string}
	 */
	version : "1.0.15",
	/**
	 * express()返回结果。
	 * @type {object}
	 */
	app : null,
	/**
	 * http.createServer(app)返回结果。yjPusher需要这个server元件。
	 * @type {object}
	 */
	server : null,
	/**
	 * https.createServer(options,app)返回结果。yjPusher需要这个server元件。
	 * @type {object}
	 */
	server_https:null,
	/**
	 * 配置文件，如：config.xxx.js。
	 * @type {string}
	 */
	configFile : null,
	/**
	 * 配置参数，即config.xxx.js定义的配置参数。
	 * @see module:config_web
	 * @see module:config_biz
	 * @type {object}
	 */
	config : null,
	/**
	 * 产品版权信息
	 * @type {String}
	 */
	copyright:"2013-"+new Date().getFullYear(),
	/**
	 * 设计者相关信息
	 * @enum
	 */
	designer:{
	    /**
	     * 标识：Techmation
	     * @type string
	     */
		id:'Techmation',
		/**
		 * 名称：NingBo Techmation Software Co.,Ltd.
		 * @type string
		 */
		name:'NingBo Techmation Software Co.,Ltd.',
		/**
		 * 图形标识：/images/techmation.jpg
		 * @type string
		 */
		logo:'/images/techmation.jpg',
		/**
		 * 愿景：Innovation in Motion
         * @type string
         */
		vision:'Innovation in Motion',
		/**
		 * 网址：http://www.techmation.com.cn
         * @type string
         */
		website:'http://www.techmation.com.cn'
	},
	/**
	 * 我在架构中的哪一层，由各层的start.{autorun}.js赋值，数组，取值一个或多个：iot,biz,web
	 * @type array
	 */
	layer:[],
	accessTokenWhiteList:{},
	loginUserList:{}
}

