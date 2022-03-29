var yjSecurity=require("../src/yjSecurity.js");
var str=process.argv[2];
var signature=yjSecurity["Diffie-Hellman"].sign(str);
console.log(signature);

/*
var crypto = require('crypto');
var md5 = crypto.createSign('RSA-SHA256');
var yjDH = require("../src/yjDiffie-Hellman.js");
md5.update(str);
var s2=md5.sign(yjDH.privateKey_pkcs1,'base64');
console.log(s2);
console.log(signature==s2);
*/

var clipboard=require("copy-paste");
clipboard.copy(signature);

console.log("签名后的字串已经复制到剪贴板。");
var verified=yjSecurity["Diffie-Hellman"].verify(str,signature);
if (verified==true) console.log("签名验证成功。")
else console.log("签名验证失败。");