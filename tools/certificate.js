var pem = require('pem');
var yjDH = require("../src/yjDiffie-Hellman.js");
pem.createCSR({
	country:'CN',
	state:'ShaanXi',
	locality:'XiAn',
	organization:'NingBo Techmation Software Co.,Ltd.',
	organizationUnit:'XiAn Branch',
	commonName:'Techmation',
	altNames:[],
	emailAddress:'info@techmation.com.cn',
	clientKey:yjDH.privateKey_pkcs1
	//clientKeyPassword:'Techmation'
}, function(err,data){
	if (err){
		console.log(err);
		return;
	}
	console.log(data);
	pem.createCertificate({
			days:365*10,
			serviceKey:yjDH.privateKey_pkcs1,
			selfSigned:false,
			csr:data.csr
		}, function(err, data){
			if (err){
				console.log(err);
				return;
			}
			console.log(data);
		}
	);
});
