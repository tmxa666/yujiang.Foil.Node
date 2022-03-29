let authorizeInfo = {};
const yjSecurity = require("./yjSecurity.js")["Diffie-Hellman"];
const fs = require("fs");
const path = require("path");
const yjDBService = require("./yjDBService.js");
module.exports = {
	createAuthorize : (keyValue) => {
		let obj = {
			Product : "iNet5.0",
			Copyright : "Techmation",
			AuthorizeModules : []
		}
		keyValue = Object.assign(obj,keyValue);
		let encryptedStr = yjSecurity.encrypt(JSON.stringify(keyValue));
		return encryptedStr;
	},
	verifyAuthorize : (callback) => {
		readCipher();
		function readCipher(){
			yjDBService.exec({
				sql : "select * from AuthorizeInfo order by OID desc limit 1",
				rowsAsArray : false,
				success : (data) => {
					if(data.length > 0){
						let keyValue = JSON.parse(yjSecurity.decrypt(data[0].data));
						verify(data[0].data,function(result){
							if(result){
								global.yjGlobal.config.project.HostAuthorizeSuccess = true;
								callback();
							}else{
								doErrorOut();
							}
						});
					}else{
						doErrorOut();
					}
				},
				error : (err) => {
					console.log(err);
					doErrorOut();
				}
			})
		}

		function doErrorOut(){
			console.log("Authorization code verification failed...");
			callback();
		}

		function getHostMac(cb2){
			const getmac = require("getmac").default;
			let mac1 = getmac().split(":").join("").toLowerCase();
			let mac2 = null;//从文件读取，虚拟MAC和实际MAC任一对应即可
			fs.readFile(path.join(__dirname,"../../enp0s3/address"),(err,data) => {
				if(err){
					console.log(err);
					if(data){
						mac2 = data.toString();
					}
				}
				if(mac2){
					mac2 = mac2.split(":").join("").toLowerCase().trim();
				}
				cb2(mac1,mac2);
			})
		}

		function verify(cipher,cb1){
			//cipher = 'lg2Ibhl29jBKOdrRQXGrA5zNWYmG314Uyze+highjZKsP2fc9vDyDQSZYqcjigPEe0TpLY+7v9J5YiCmDIIvHtUA6+obJeEuq6+KD7fs9+Lxoms10YM9tG19nTLHII1hZjW6UxmT43CDd3yUiTB+WraiJFeeBSvPKj6NGWRk/2RQ5cdFKgB3whv0ejQraw/nD+LyqF4rgoSnbfbzSH+OFLCld8OYu7wEQEBFWhpOK4eDKwEOZp8xvKfXsCPbD39LzOxT3wPLnMhKF16LU6iKnVaPxwKtLP+m2+6CQhqczL0UdIKCIjhQsej6FNceMNXlkyw3sprL7fC6jMr5vPjYgpcRuCizAI2YLIRMBiW4qGZmp+zdQPXm8KEeRVZE5MC6rR4MMJ8eHI1ov1zPzdQLWwj3MkuGPlOGWXrnl6aOb1nFgU/qbaB6N/SFr1FmgHvz0pbjDWEjS6pVGbrKs+5dRAOZ3Tq6YIE40mctrVuMnCY+dZ9BVNnmgaAFYP9oeKJcu77E2oIGyNHuAN8MXifjOccxl2y6e1Ol6mMhlJM/MVgqyBhs1EUWDMNssGmuyDasdtVgQiTqR/T5S36hFJO3mnaHOjWUi8MAjZ1jPLRPz8YehKe8UaVOOhN3GrUKGaNBo+lYV8NOCsNFCxqtQh+WqK4XYHJbBjJuiQxcNMS3DJY='
			getHostMac(function(mac1,mac2){
				let keyValue = JSON.parse(yjSecurity.decrypt(cipher));
				let mac_ = keyValue.HostMac.toLowerCase();
				let endDate = new Date(keyValue.AuthorizeDuration).getTime();
				let now = new Date().getTime();
				let result = false;
				if(now <= endDate){
					if(mac_ == mac1 || mac_ == mac2){
						authorizeInfo = keyValue;
						authorizeInfo.HostAuthorizeSuccess = true;
						result = true;
					}else{
						result = false;
					}
				}
				cb1(result);
			});
		}
	},
	getAuthorizeInfo : () => {
		return authorizeInfo;
	}
}