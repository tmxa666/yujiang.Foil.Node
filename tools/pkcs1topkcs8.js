var NodeRSA = require('node-rsa');
var key = new NodeRSA();
var path=require("path");
var hellman=require(path.join(__dirname,"../src/yjDiffie-hellman.js"));

key.importKey(hellman.publicKey_pkcs8, 'pkcs8-public-pem');
var publicKey=key.exportKey('pkcs1-public-pem');
console.log(publicKey);


key.importKey(hellman.privateKey_pkcs1, 'pkcs1-private-pem');
var privateKey = key.exportKey('pkcs8-private-pem');
console.log(privateKey);
//var privateDer = key.exportKey('pkcs1-der');