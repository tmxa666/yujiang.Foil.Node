//这是yjTest.js调用qunit测试时自动产生的文件，修改无效。
//为了解决跨进程传递资料问题。此文件是在另一个进程执行。
module.exports={port:2999};
var yjApp_init=require('../yjApp.init.js');
yjApp_init.setConfigFile('D:/work/Source/yujiang.Foil.Node/test/node.js/config.wxh.js');
var config=yjApp_init.init();
console.log('------cross process global inited.');