if (process.argv.length < 3)
	throw "need a third parameter as a to be encrypted string in command line.";
var yjSecurity = require("../src/yjSecurity.js");
var str = process.argv[2];
var encryptedStr = yjSecurity.encryptStr0_Ansi(str);
console.log("原始字串：" + str + "\r\n" + "加密后字串：" + encryptedStr);
var clipboard = require("copy-paste");
clipboard.copy(encryptedStr);
console.log("加密后的字串已经复制到剪贴板。");
var strRaw = yjSecurity.decryptStr0_Ansi(encryptedStr);
if (str == strRaw)
	console.log("加密后字串解密成功。")
else
	console.log("加密后字串解密失败。");