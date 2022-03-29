/**
 * @module yjApp_middle_locale
 * @author Mico.wang
 * @description
 * 中间件。根据项目配置，对客户端访问的URL进行记录，记录用户的访问足迹。
 */
var url = require('url');

function logReqFootprint(req, res, next) {
    var needLogURLs = yjGlobal.config.product.footprint;
    if (!needLogURLs || needLogURLs == "undefined") {
        next();
        return;
    } else {
        if (!needLogURLs.isLog || needLogURLs.isLog == "undefined") {
            next();
            return;
        }
    }
    if (!req.session.yjUser || req.session.yjUser == 'undefined') {
        // console.log("没有token,不记录!");
    } else {
        var options = {
            userOID: req.session.yjUser.OID,
            customerOID: req.session.yjUser.CustomerOID,
            reqURL: url.parse(req.url, true).path,
            isBizReq: false
        };
        if ((req.headers['yujiang-from-server'] == undefined && !req.xhr) || req.headers['yujiang-from-server']) {
            var needLogURLs = yjGlobal.config.product.footprint.urls;
            var tempUrl = '';
            if ((options.reqURL).indexOf("?") > -1) {
                tempUrl = (options.reqURL).substring(0, (options.reqURL).indexOf("?"));
            } else {
                tempUrl = options.reqURL;
            }
            if (needLogURLs.indexOf(tempUrl) > -1) {
                //如果访问的是bizServer,直接记录，否则要通过调用服务完成记录
                var yjLogFootprint = require("./yjLogFootprint.js");
                yjLogFootprint.logFootprint(options);
            }
        }
    }
    next();
}
yjGlobal.app.use(logReqFootprint);