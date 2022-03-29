/**
 * @fileOverview
 * 操纵支付宝API工具类
 * @author hrh zcl
 */
var crypto = require('crypto');
var moment=require('moment');
var yjREST=require("./yjREST.js");
module.exports=(function(){
    var utl =  {};
    var g_alipayConfig=null;
    // config有配置支付账户参数, 默认使用config配置的支付账号信息
    if(global.yjGlobal.config.payment&&global.yjGlobal.config.payment.ali){
        g_alipayConfig=global.yjGlobal.config.payment.ali;
    }
    // 调用此方法 初始化 支付账号信息
    // 不调用此方法，会默认读取config 中配置的支付账号信息
   /*
    options:
    {
           //支付宝网关
            alipayURL : 'https://openapi.alipay.com/gateway.do?',
            //应用id
            app_id : '2017111009838166',
            //签名方式：RSA或RSA2
            signType : 'RSA',
            //应用私钥，保密  设置在APP端
            privateKey : '-----BEGIN RSA PRIVATE KEY-----\n'+
                "MIIEogkTOfVqhxM……"
                +'-----END RSA PRIVATE KEY-----',
            //应用公钥，配置给支付宝
            publicKey : "-----BEGIN PUBLI…… +" 
                "-----END PUBLIC KEY-----",
            //支付宝公钥，用来验签
            ali_publicKey:'-----BEGIN PUBLIC KEY-----\n' + 
            "MIGfMA0GCSqGSIb3DQEBA^" + 
            '-----END PUBLIC KEY-----',
            //支付宝商家账号
            ali_account:"zhu@yfish.net",
            notify_url:"https://www.fgems.net/biz/APPService/payment/alipay/aliGateway"
    },
    */
    utl.setAccountInfo=function(options){
        g_alipayConfig=options;
    };
    /**
     * 对请求参数进行组装、编码、签名，返回已组装好签名的参数字符串
     * @param {{Object} params  请求参数
     * @param {String} privateKey 商户应用私钥
     * @param {String} [signType] 签名类型 'RSA2' or 'RSA'
     * @returns {String}
     */
    utl.processParams = function (params) {
        var ret = utl.encodeParams(params);
        var sign = utl.sign(ret.unencode);
        return ret.encode + '&sign=' + encodeURIComponent(sign);
    };

    /**
     * 对请求参数进行组装、编码
     * @param {Object} params  请求参数
     * @returns {Object}
     */
    utl.encodeParams = function (params) {
        var keys = [];
        for(var k in params) {
            var v = params[k];
            if (params[k] !== undefined && params[k] !== "") keys.push(k);
        }
        keys.sort();

        var unencodeStr = "";
        var encodeStr = "";
        var len = keys.length;
        for(var i = 0; i < len; ++i) {
            var k = keys[i];
            if(i !== 0) {
                unencodeStr += '&';
                encodeStr += '&';
            }
            unencodeStr += k + '=' + params[k];
            encodeStr += k + '=' + encodeURIComponent(params[k]);
        }
        return {unencode:unencodeStr, encode:encodeStr};
    };

    /**
     * 对字符串进行签名验证
     * @param {String} str 要验证的参数字符串
     * @param {String} sign 要验证的签名
     * @param {String} publicKey 支付宝公钥
     * @param {String} [signType] 签名类型
     * @returns {Boolean}
     */
    utl.signVerify = function (params) {
        var sign=params['sign'];//签名
        var signType=params['sign_type'];//签名
        var str=utl.processSignVerifyParamsString(params);
        var verify;
        var publicKey=g_alipayConfig.ali_publicKey;
        if(signType === 'RSA2') {
            verify = crypto.createVerify('RSA-SHA256');
        } else {
            verify = crypto.createVerify('RSA-SHA1');
        }
        verify.update(str, 'utf8');
        var result = verify.verify(publicKey, sign, 'base64');
        return result;
    };

    /**
     * 对字符串进行签名
     * @param {String} str 要签名的字符串
     * @param {String} privateKey 商户应用私钥
     * @param {String} [signType] 签名类型
     * @returns {String}
     */
    utl.sign = function (str) {

        var sha;
        var privateKey=g_alipayConfig.privateKey;
        var signType=g_alipayConfig.signType;
        if(signType === 'RSA2') {
            sha = crypto.createSign('RSA-SHA256');
        } else {
            sha = crypto.createSign('RSA-SHA1');
        }
        sha.update(str, 'utf8');
        return sha.sign(privateKey, 'base64');
    }

    /**
     * 处理支付宝返回参数，获得验签的参数字符串
     * @param {String} str 要签名的字符串
     * @param {String} privateKey 商户应用私钥
     * @param {String} [signType] 签名类型
     * @returns {String}
     */
    utl.processSignVerifyParamsString=function(params){
        var keys = [];
        for(var k in params) {
            var v = params[k];
            if (k!=='sign'&&k!=='sign_type'&& params[k] !== undefined && params[k] !== "") 
                keys.push(k);
        }
        keys.sort();
        var decodeStr = "";
        var len = keys.length;
        for(var i = 0; i < len; ++i) {
            var k = keys[i];
            if(i !== 0) {
                decodeStr += '&';
            }
            decodeStr += k + '=' + decodeURIComponent(params[k]);
        }
        return decodeStr;
    }

    /**
     * [barCodeSDKPay  条码支付接口]
     * @Author  mico.wang         2018-12-12T15:36:31+0800  
     * @param   {String}   options.auth_code   扫码获得的授权码 
     * @return  {String}   options.OrderAID    订单号
     * @return  {String}   options.totalAmount 订单金额
     * @return  {String}   options.notify_url  回调地址
     * @param {function}   success 访问成功回调
     * @param {function}   error 访问失败回调
     */
        utl.barCodeSDKPay=function(options){
        try{
            var _biz_content={
                scene:"bar_code", // 固定参数
                auth_code:options.auth_code, // 扫码获得的授权码
                timeout_express:"1m",
                subject: options.orderAID, //订单标题
                body:"",//订单描述 
                out_trade_no: options.orderAID,    // 订单号
                total_amount: options.totalAmount, // 订单总金额
                product_code: "FACE_TO_FACE_PAYMENT" // 固定参数
            }
            var signType=g_alipayConfig.signType;
            var data={
                app_id:g_alipayConfig.app_id,
                method:'alipay.trade.pay',
                charset:'utf-8',
                sign_type:signType,
                sign:"",
                timestamp:moment().format('YYYY-MM-DD HH:mm:ss'),
                version:'1.0',
                notify_url:options.notify_url,
                biz_content:JSON.stringify(_biz_content)
            }
            var sendParas=utl.processParams(data);
            yjREST.get({
                url:  g_alipayConfig.alipayURL + sendParas,
                success:function(data1){
                    var payData = data1['alipay_trade_pay_response'];
                    if((payData['code']=='10000' && payData['msg']=='Success') || payData['sub_code']=='ACQ.TRADE_HAS_SUCCESS'){
                        payData['code']=payData['sub_code']='10000';
                        payData['msg']=payData['sub_msg']='Success';
                        if(options.success){
                            options.success(data1);
                        }
                    }else if(payData['code']=='10003'){
                        setTimeout(function(){
                            utl.barCodeSDKPay(options)
                        },1000*5)
                    }else{
                        if(options.success){
                            //错误信息请查看公共错误码 https://docs.open.alipay.com/api_1/alipay.trade.pay
                            options.success(data1);
                        }
                    }
                },
                error:function(err){
                    console.log("payMoney Fail！！！");
                    if (options.error){
                        options.error(err)
                    }
                }
            });

        }catch(err){
            options.error(err);
        }   
    }
     
    /**
     * alipay.trade.app.pay(app支付接口2.0 SDK调用)
     * @param {String} orderAID 订单支付时传入的商户订单号
     * @param {String} totalAmount 订单支付总额
     * @param {String} notify_url 订单支付回调地址
     * @param {String} product_code 订单支付回调地址
     * @param {function} success 访问成功回调
     * @param {function} error 访问失败回调
     */

    utl.appSDKPay=function(options){
        try{
            var product_code=options.product_code?options.product_code:'QUICK_MSECURITY_PAY';
            var _biz_content={
                // scene:
                // auth_code:
                // 
                timeout_express:"30m",
                subject: options.orderAID,
                body:"",
                out_trade_no: options.orderAID,
                total_amount: options.totalAmount,
                product_code: product_code
            }
            var signType=g_alipayConfig.signType;
            var data={
                app_id:g_alipayConfig.app_id,
                method:'alipay.trade.app.pay',
                charset:'utf-8',
                sign_type:signType,
                timestamp:moment().format('YYYY-MM-DD HH:mm:ss'),
                version:'1.0',
                notify_url:options.notify_url,
                biz_content:JSON.stringify(_biz_content)
            }
            // console.log(data)
            var sendParas=utl.processParams(data);
            options.success(sendParas);
        }catch(err){
            options.error(err);
        }    
    }

    /**
     * alipay.trade.query(统一收单线下交易查询)
     * out_trade_no和trade_no,不能同时为空
     * @param {String} out_trade_no 订单支付时传入的商户订单号
     * @param {String} trade_no 支付宝交易号
     * @param {function} success 访问成功回调
     * @param {function} error 访问失败回调
     */
    utl.tradeQuery=function(options){
        var _biz_content={
            out_trade_no:options.out_trade_no,
            trade_no:options.trade_no
        }
        var signType=g_alipayConfig.signType;
        var data={
            app_id:g_alipayConfig.app_id,
            method:'alipay.trade.query',
            charset:'utf-8',
            sign_type:signType,
            timestamp:moment().format('YYYY-MM-DD HH:mm:ss'),
            version:'1.0',
            biz_content:JSON.stringify(_biz_content)
        }

        var sendParas=utl.processParams(data);
        yjREST.get({
            url:  g_alipayConfig.alipayURL + sendParas,
            success:function(data){
                var code = data.code;
                if (options.success){
                    options.success(data)
                }
            },
            error:function(err){
                if (options.error){
                    options.error(err)
                }
            }
        });
    }

    /**
     * alipay.trade.refund(统一收单交易退款接口)
     * out_trade_no和trade_no,不能同时为空
     * @param {String} out_trade_no 订单支付时传入的商户订单号
     * @param {String} trade_no 支付宝交易号
     * @param {String} refund_amount 需要退款的金额，该金额不能大于订单金额,单位为元，支持两位小数 
     * @param {String} out_request_no 标识一次退款请求，同一笔交易多次退款需要保证唯一，如需部分退款，则此参数必传。
     * @param {String} total_fee 订单总金额，单位为元，
     * @param {function} success 访问成功回调
     * @param {function} error 访问失败回调
     */
    utl.refund=function(options){
        var biz_content = {
                out_trade_no: options.out_trade_no,
                trade_no: options.trade_no,
                //operator_id: options.operatorId,
                refund_amount: options.refund_amount,
                // refund_reason: options.refundReason,
                out_request_no: options.out_request_no,
                // store_id: options.storeId,
                // terminal_id: options.terminalId
            };
        var signType=g_alipayConfig.signType;
        var data={
            app_id:g_alipayConfig.app_id,
            method:'alipay.trade.refund',
            charset:'utf-8',
            sign_type:signType,
            timestamp:moment().format('YYYY-MM-DD HH:mm:ss'),
            version:'1.0',
            biz_content:JSON.stringify(biz_content)
        }

        var sendParas=utl.processParams(data);

        yjREST.get({
            url:  g_alipayConfig.alipayURL + sendParas,
            success:function(data){
                //console.log(data)
                if (data.alipay_trade_refund_response.code=="10000"){
                    options.success(data)
                }else{
                    options.error(data)
                }
            },
            error:function(err){
                console.log(err)
                if (options.error){
                    options.error(err)
                }
            }
        });
    }
    /**
     * alipay.trade.fastpay.refund.query(统一收单交易退款查询接口)
     * out_trade_no和trade_no,不能同时为空
     * @param {String} out_trade_no 订单支付时传入的商户订单号
     * @param {String} trade_no 支付宝交易号
     * @param {String} refund_amount 需要退款的金额，该金额不能大于订单金额,单位为元，支持两位小数 
     * @param {String} out_request_no 标识一次退款请求，同一笔交易多次退款需要保证唯一，如需部分退款，则此参数必传。
     * @param {function} success 访问成功回调
     * @param {function} error 访问失败回调
     */

    utl.refundQuery=function(options){
        var biz_content = {
            out_trade_no: options.out_trade_no,
            trade_no: options.trade_no,
            out_request_no: options.out_request_no
        };
        var signType=g_alipayConfig.signType;
        var data={
            app_id:g_alipayConfig.app_id,
            method:'alipay.trade.fastpay.refund.query',
            charset:'utf-8',
            sign_type:signType,
            timestamp:moment().format('YYYY-MM-DD HH:mm:ss'),
            version:'1.0',
            biz_content:JSON.stringify(biz_content)
        }
        var sendParas=utl.processParams(data);
        yjREST.get({
            url:  g_alipayConfig.alipayURL + sendParas,
            success:function(data){
                if (data.alipay_trade_fastpay_refund_query_response.code=="10000"){
                    options.success(data)
                }else{
                    options.error(data)
                }
            },
            error:function(err){
                if (options.error){
                    options.error(err)
                }
            }
        });
    }
    /**
     * alipay.trade.precreate 统一收单线下交易预创建
     * 收银员通过收银台或商户后台调用支付宝接口，生成二维码后，展示给用户，由用户扫描二维码完成订单支付。
     * @param {String} orderAID 订单号
     * @param {String} totalAmount 订单金额,单位为元，支持两位小数 
     * @param {String} notify_url 支付异步回调地址
     * @param {function} success 访问成功回调
     * @param {function} error 访问失败回调
     * 
     */
    utl.precreate=function(options){
         try{
            var _biz_content={
                timeout_express:"5m",
                subject: options.orderAID, //订单标题
                body:"",//订单描述 
                out_trade_no: options.orderAID,    // 订单号
                total_amount: options.totalAmount
                // , // 订单总金额
                // product_code: "FACE_TO_FACE_PAYMENT" // 固定参数
            }
            var signType=g_alipayConfig.signType;
            var data={
                app_id:g_alipayConfig.app_id,
                method:'alipay.trade.precreate',
                charset:'utf-8',
                sign_type:signType,
                sign:"",
                timestamp:moment().format('YYYY-MM-DD HH:mm:ss'),
                version:'1.0',
                notify_url:options.notify_url,
                biz_content:JSON.stringify(_biz_content)
            }
            var sendParas=utl.processParams(data);
            yjREST.get({
                url:  g_alipayConfig.alipayURL + sendParas,
                success:function(data1){
                    var code = data1.code;
                    if (options.success){
                        options.success(data1)
                    }
                },
                error:function(err){

                    if (options.error){
                        options.error(err)
                    }
                }
            });

        }catch(err){
            options.error(err);
        }   
    }
    return utl;
})();

 





