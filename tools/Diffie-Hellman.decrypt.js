var yjSecurity=require("../src/yjSecurity.js");
var strEncrypted=process.argv[2];
//console.log(strEncrypted);
var str=yjSecurity["Diffie-Hellman"].decrypt(strEncrypted);
var clipboard=require("copy-paste");
clipboard.copy(str);
console.log("解密后的字串已经复制到剪贴板。");