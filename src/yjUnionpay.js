var yjREST = yjRequire("yujiang.Foil","yjREST.engine.remote.superagent.js");
var yunpay = global.yjGlobal.config.payment.yunpay;
var crypto = require('crypto');
module.exports = (function(){
	var util = {};

	//获取二维码
	util.getQrCode = function(options){
		var formData = {};
		formData.mid = yunpay.mid;
		formData.tid = yunpay.tid;
		formData.msgType = yunpay.msgType[options.type];
		formData.msgSrc = yunpay.msgSrc;
		formData.instMid = yunpay.instMid;
		formData.billDate = options.billDate;
		formData.totalAmount = options.totalAmount;
		formData.requestTimestamp = options.requestTimestamp;
		formData.notifyUrl = yunpay.notifyUrl;
		var billNo = "";
		if (options.billNo) 
		{
			billNo = options.billNo;
		}
		else
		{
			billNo = yunpay.msgSrcId + options.timestamp + "";
		}
		// var billNo = yunpay.msgSrcId + options.timestamp + "";
		formData.billNo = billNo;
		var sign = transForSign(formData);
		sign += yunpay.key;
		sign = md5(sign).toUpperCase();
		formData.sign = sign;
		yjREST.post({
			url:yunpay.url,
			data:formData,
			headers:{
				"Content-Type":"application/json",
				"Accept_Charset":"UTF-8",
				"contentType":"UTF-8"
			},
			success:function(data){
				options.success(data);
			},
			error:function(err){
				options.error(err);
			}
		})
	}

	//退款
	util.refund = function(options){
		var formData = {};
		formData.mid = yunpay.mid;
		formData.tid = yunpay.tid;
		formData.msgType = yunpay.msgType[options.type];
		formData.msgSrc = yunpay.msgSrc;
		formData.instMid = yunpay.instMid;
		formData.billNo = options.billNo;
		formData.billDate = options.billDate;
		formData.refundAmount = options.refundAmount;
		formData.requestTimestamp = options.requestTimestamp;
		var sign = transForSign(formData);
		sign += yunpay.key;
		sign = md5(sign).toUpperCase();
		formData.sign = sign;
		yjREST.post({
			url:yunpay.url,
			data:formData,
			headers:{
				"Content-Type":"application/json",
				"Accept_Charset":"UTF-8",
				"contentType":"UTF-8"
			},
			success:function(data){
				options.success(data);
			},
			error:function(err){
				options.error(err);
			}
		})
	}

	//更新二维码
	util.updateQRCode = function(options){
		var formData = {};
		formData.mid = yunpay.mid;
		formData.tid = yunpay.tid;
		formData.msgType = yunpay.msgType[options.type];
		formData.msgSrc = yunpay.msgSrc;
		formData.instMid = yunpay.instMid;
		formData.qrCodeId = options.qrCodeId;
		formData.billDate = options.billDate;
		formData.totalAmount = options.totalAmount;
		formData.requestTimestamp = options.requestTimestamp;
		var sign = transForSign(formData);
		sign += yunpay.key;
		sign = md5(sign).toUpperCase();
		formData.sign = sign;
		yjREST.post({
			url:yunpay.url,
			data:formData,
			headers:{
				"Content-Type":"application/json",
				"Accept_Charset":"UTF-8",
				"contentType":"UTF-8"
			},
			success:function(data){
				options.success(data);
			},
			error:function(err){
				options.error(err);
			}
		})
	}

	//查询二维码静态信息
	util.queryQRCodeInfo = function(options){
		var formData = {};
		formData.mid = yunpay.mid;
		formData.msgSrc = yunpay.msgSrc;
		formData.qrCodeId = options.qrCodeId;
		formData.msgType = yunpay.msgType[options.type];
		formData.requestTimestamp = options.requestTimestamp;
		var sign = transForSign(formData);
		sign += yunpay.key;
		sign = md5(sign).toUpperCase();
		formData.sign = sign;
		yjREST.post({
			url:yunpay.url,
			data:formData,
			headers:{
				"Content-Type":"application/json",
				"Accept_Charset":"UTF-8",
				"contentType":"UTF-8"
			},
			success:function(data){
				options.success(data);
			},
			error:function(err){
				options.error(err);
			}
		})
	}

	//关闭二维码
	util.closeQRCode = function(options){
		var formData = {};
		formData.mid = yunpay.mid;
		formData.tid = yunpay.tid;
		formData.msgType = yunpay.msgType[options.type];
		formData.msgSrc = yunpay.msgSrc;
		formData.instMid = yunpay.instMid;
		formData.qrCodeId = options.qrCodeId;
		formData.requestTimestamp = options.requestTimestamp;
		var sign = transForSign(formData);
		sign += yunpay.key;
		sign = md5(sign).toUpperCase();
		formData.sign = sign;
		yjREST.post({
			url:yunpay.url,
			data:formData,
			headers:{
				"Content-Type":"application/json",
				"Accept_Charset":"UTF-8",
				"contentType":"UTF-8"
			},
			success:function(data){
				options.success(data);
			},
			error:function(err){
				options.error(err);
			}
		})
	}
	return util;
})();

function transForSign(params){
    var array = []
    for (var i in params) {
        array.push(i)
    }
    array.sort();
    var arr = [];
    for (var i = 0; i < array.length; i++) {
    	arr.push(array[i]+"="+params[array[i]]);
    }

    return arr.join('&');
};

function md5(data){
    var hash = crypto.createHash('md5',data);
    return hash.update(data).digest('HEX');
}

// function randomNum(){
// 	var num = '';
//     for(var i=0;i<3;i++)
//     {
//         num+=Math.floor(Math.random()*10);
//     }
//     return num;
// }