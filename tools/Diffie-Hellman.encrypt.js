var yjSecurity=require("../src/yjSecurity.js");
var str=process.argv[2];
var strEncrypted=yjSecurity["Diffie-Hellman"].encrypt(str);
var clipboard=require("copy-paste");
clipboard.copy(strEncrypted);
console.log("加密后的字串已经复制到剪贴板");
var str2=yjSecurity["Diffie-Hellman"].decrypt(strEncrypted);
if (str2==str) console.log("解密验证成功。")
else console.log("解密验证失败。");