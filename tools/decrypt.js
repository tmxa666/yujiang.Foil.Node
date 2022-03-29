if (process.argv.length < 3)
	throw "need a third parameter as a to be decrypted string in command line.";
var yjSecurity = require("../src/yjSecurity.js");
var str = process.argv[2];
var decryptedStr = yjSecurity.decryptStr0_Ansi(str);
console.log("原始字串：" + str + "\r\n" + "解密后字串：" + decryptedStr);
var clipboard = require("copy-paste");
clipboard.copy(decryptedStr);
console.log("解密后的字串已经复制到剪贴板。");