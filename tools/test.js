var yjSecurity=require("../src/yjSecurity.js");
var str='123456';
var strEncrypted=yjSecurity["Diffie-Hellman"].encrypt(str);
console.log(strEncrypted);

var str2=yjSecurity["Diffie-Hellman"].decrypt(strEncrypted);
console.log(str2);