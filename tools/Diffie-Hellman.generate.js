console.log("重新生成非对称加密的公钥和私钥到yjDiffie-hellman_new.js，请确认后改为yjDiffie-hellman.js......");
var fs = require("fs");
var NodeRSA = require('node-rsa');
var key = new NodeRSA();
key.generateKeyPair();
var publicKey = key.exportKey('pkcs8-public-pem');
console.log(publicKey);
var privateKey = key.exportKey('pkcs1-private-pem');
console.log(privateKey);

var s = {
	publicKey_pkcs8 : publicKey,
	publicKey_pkcs1: key.exportKey('pkcs1-public-pem'),
	privateKey_pkcs1 : privateKey,
	privateKey_pkcs8: key.exportKey('pkcs8-private-pem')
}
var util = require("util");
var path=require("path");
var fileName = path.join(__dirname, "../src/yjDiffie-hellman_new.js");
var content =
	"//自动生成的文件，公钥私钥必须配套，不要手动修改。\r\n" + "module.exports=" + util.inspect(s);
fs.writeFile(fileName, content);
console.log("非对称加密的公钥私钥重新完毕。文件已重新产生。" + fileName);