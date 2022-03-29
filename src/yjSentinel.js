/**
 * 环境：win10 64位 
 *       node v6.7.0 64位
 *       ffi模组 64位操作系统编译生成 
 */
var FFI = require('ffi');
var ref = require('ref');
var  yjSentinel=function (functionCode,vendorCode){
	this.function_code=functionCode;
	this.vendor_code=vendorCode;

	var hasp_handle_t= ref.refType('uint64');
	var hasp_size_t=ref.refType('uint64');
	this.hasp = FFI.Library('./x641/hasp_windows_x64_113942.dll',{
	    'hasp_login': ['uint64',['uint64','string',hasp_handle_t]],
	    'hasp_logout':['uint64',['pointer']],
	    'hasp_read':['uint64',['pointer','uint64','uint64','uint64','string']],
	    'hasp_write':['uint64',['pointer','uint64','uint64','uint64','string']]
	});
	this.handle= ref.alloc(hasp_handle_t);
	this.HASP_FILEID_RW=65524;
	this.HASP_FILEID_RO=65525;
}
yjSentinel.prototype.login=function(){
		console.log(this.function_code,this.vendor_code,this.handle);
		var status_login=this.hasp.hasp_login(this.function_code,this.vendor_code,this.handle); 
		console.log(status_login);
		return status_login;
	},
yjSentinel.prototype.read=function(){
		var status=this.login();
		if(status===0){
			var read_result =  Buffer.alloc(112);
			var status_read=this.hasp.hasp_read(this.handle.deref(),this.HASP_FILEID_RW,0,112,read_result);
			var authority={};
			if(status===0){
				var fixedInfo={};
				fixedInfo.companyName=read_result.toString('utf8',0,17);
				fixedInfo.productName=read_result.toString('utf8',17,37);
				fixedInfo.perpetualAuthority=read_result.readUInt8(37);
				fixedInfo.licenseDate=new Date(1899,11,30+read_result.readDoubleLE(38));
                authority.fixedInfo=fixedInfo;

                var controlInfo={};
				controlInfo.clientCount=read_result.readUInt16LE(46);
				controlInfo.connectionCount=read_result.readUInt16LE(48);
				controlInfo.monitorCount=read_result.readUInt16LE(50);
				controlInfo.iDataVersion=read_result.readUInt16LE(52);
				controlInfo.controlValue5=read_result.readUInt16BE(54);
				controlInfo.controlValue6=read_result.readUInt16BE(56);
				controlInfo.controlValue7=read_result.readUInt16BE(58);
				controlInfo.controlValue8=read_result.readUInt16BE(60);
				authority.controlInfo=controlInfo;

				var modelInfo={};
				modelInfo.modularValue1=read_result.readUInt8(62);
				modelInfo.modularValue2=read_result.readUInt8(63);
				modelInfo.modularValue3=read_result.readUInt8(64);
				modelInfo.modularValue4=read_result.readUInt8(65);
				modelInfo.modularValue5=read_result.readUInt8(66);
				modelInfo.modularValue6=read_result.readUInt8(67);
				modelInfo.modularValue7=read_result.readUInt8(68);
				modelInfo.modularValue8=read_result.readUInt8(69);
				authority.modelInfo=modelInfo;
				
				var backInfo={};
				backInfo.backupValue1=read_result.readUInt8(70);
				backInfo.backupValue2=read_result.readUInt8(71);
				backInfo.backupValue3=read_result.readUInt32BE(72);
				backInfo.backupValue4=read_result.readUInt32BE(76);
				backInfo.backupValue5=read_result.readDoubleLE(80);
				backInfo.backupValue6=read_result.toString('utf8',88,104);
				backInfo.backupValue7=new Date(1899,11,30+read_result.readDoubleLE(104)) ;
				authority.backInfo=backInfo;
			}
			this.logout();
			return authority;
		}else{
			console.log("login failed!error code: "+status);
		}
	},
	// offset：偏移量
	// length：写入的字节数
yjSentinel.prototype.write=function(offset,length,buf){
		var status=this.login();
		if(status===0){
			var status_write=this.hasp.hasp_write(this.handle.deref(),this.HASP_FILEID_RW,offset,length,buf);
		}else{
			console.log("login failed!error code: "+status);
		}
		this.logout();

	},
yjSentinel.prototype.logout=function(){
		var status_logout=this.hasp.hasp_logout(this.handle.deref());
		if(status_logout!=0){
			console.log("logout failed!error code: "+status_logout);
		}
		return status_logout;
	},
	// 设置加密卡过期失效
	// offset：70
	// length：1
	
yjSentinel.prototype.setDeviceExpired=function(){
		this.write(70,1,Buffer.from("01","Hex"));
	}
	// 检查产品授权
yjSentinel.prototype.getProductAuthority=function(productName){
		var au=this.read();
		var temp=au.fixedInfo.productName.indexOf(productName);
		if(temp>0){
			return true;
		}else{
			return false;
		}
	}
	//检查授权是否过期？
yjSentinel.prototype.checkAuthorityIsExpired=function(){
		
		if(au.backInfo.backupValue1===1){
			return true;
		}
		var today=new Date();
		var licenseDate=au.fixedInfo.licenseDate;
		if( today>licenseDate){
			//过期 
			this.setDeviceExpired();
			return true;
		}else{
			return false;
		}
	}
yjSentinel.prototype.getModelAuthority=function(){
	var au=this.read();
	return au.modelInfo;
}
module.exports=yjSentinel;