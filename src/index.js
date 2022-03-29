exports.yjBizService = require("./yjBizService.js");
exports.yjDB = require("./client/js/yjDB.js");
exports.yjDBService = require("./yjDBService.js");
exports.yjDirectory = require("./yjDirectory.js");
// 奇怪，当在D:\work\source\autocode\webserver下执行node
// d:/work/source/yujiang.Foil.Node/src/yjApp.js config.wxh.js
// 用require("yujiang.Foil").yjGlobal;会被多次载入，不认为是同一个文件
exports.yjGlobal = global.yjGlobal;// require("./yjGlobal.js");
exports.yjLog = require("./yjLog.js");
exports.yjMVC = require("./yjMVC.js");
exports.yjPusher = require("./yjPusher.js");
exports.yjSecurity = require("./yjSecurity.js");
exports.yjTest = require("./yjTest.js");
exports.yjUtils = require("./client/js/yjUtils.js");
exports.yjMultiLang = require("./yjMultiLang.js");
exports.yjDateTime = require("./client/js/yjDateTime.js");
exports.yjLocation = require("./yjLocation.js");
exports.yjCrc32= require("./client/js/yjCrc32.js");

//exports.yjDate=require("./yjDate.js");
//exports.yjOffice=require("./yjOffice.js");