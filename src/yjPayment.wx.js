/**
 * @fileOverview
 * 操纵微信API工具类
 * @author zcl
 */

var crypto = require('crypto');
var X2JS=require("x2js");
var yjREST=require("./yjREST.js");

 

module.exports=(function(){
    var utl =  {};
    var g_wxPayConfig=null;
    // config有配置支付账户参数, 默认使用config配置的支付账号信息
    if(global.yjGlobal.config.payment&&global.yjGlobal.config.payment.wx){
        g_wxPayConfig=global.yjGlobal.config.payment.wx;
    }
    /*
        调用此方法 设置支付账户信息
        不调此方法 将默认使用config配置的微信支付账户信息
        options:{
                //2、交易类型
                //JSAPI--JSAPI支付（或小程序支付）、
                //NATIVE--Native支付、
                //APP--app支付，
                //MWEB--H5支付
                APP:{
                    appid:"wx0654f3f79f7b4d24",//调用接口提交的应用ID
                    appsecret:"e9ff968ef9e8……",//微信开放平台应用ID的appsecret
                    mch_id:"1498896572",//调用接口提交的商户号
                    mchkey:"xiaohuang……",//商户平台配置的安全秘钥
                    notify_url:"https://www.fgems.net/biz/APPService/payment/wxpay/wxGateway"//支付回调url
                },
                JSAPI:{
                    appid:"wxe7096d104487ea93",//调用接口提交的应用ID
                    appsecret:"1c5dc5fcabd……",//微信开放平台应用ID的appsecret
                    mch_id:"1498896572",//调用接口提交的商户号
                    mchkey:"xiaohuangy……",//商户平台配置的安全秘钥
                    notify_url:"https://www.fgems.net/biz/APPService/payment/wxpay/wxGateway"//支付回调url
                },
                wechatAppId:"wxe7096d104487ea93",
                wechatSecret:"1c5dc5fcabd5d0db7b58ee0fb101ab32",
        }
     */
    utl.setAccountInfo=function(options){
        g_wxPayConfig=options;
    };
    /**微信付款码支付
     * 支付失败之后请更换单号哦；
     * 提交支付请求后微信会同步返回支付结果。当返回结果为“系统错误”时，商户系统等待5秒后调用【查询订单API】，查询支付实际交易结果；
     * 当返回结果为“USERPAYING”时，商户系统可设置间隔时间(建议10秒)重新查询支付结果，直到支付成功或超时(建议30秒)；
     * 例子：
     *  var pay=yjRequire("yujiang.Foil","yjPayment.wx.js");
        pay.scanCodePay({
            body:'付款码支付测试',
            out_trade_no:'201901072132asdwrewrw23423422303',
            spbill_create_ip:'190.168.11.136',
            auth_code:'134674095613791927',
            total_fee:1,
            success:function(data){
                console.log(data)
            },
            error:function(err){
                console.log(err)
            }
        })
     * @param {String} auth_code 授权码
     * @param {String} body 商品信息
     * @param {String} out_trade_no 商户订单号，编号32位，自定义的
     * @param {String} spbill_create_ip 终端IP
     * @param {String} total_fee 订单总金额，单位为元
     * @param {function} success 访问成功回调
     * @param {function} error 访问失败回调
     */
    utl.scanCodePay=function(options){
        var trade_type=options.trade_type?options.trade_type:"APP";
        var wxPayConfig=g_wxPayConfig[trade_type];
        var appid=wxPayConfig.appid;
        var mch_id=wxPayConfig.mch_id;
        var ret = {
            appid: appid,
            auth_code:options.auth_code,
            body:options.body,
            mch_id:mch_id,
            nonce_str: utl.createNonceStr(),
            out_trade_no: options.out_trade_no,
            spbill_create_ip:options.spbill_create_ip,
            total_fee:options.total_fee
        };
        var sign=utl.sign(ret,wxPayConfig.mchkey);
        var formData="<xml>";
            formData+='<appid>'+ret.appid+'</appid>';
            formData+='<auth_code>'+ret.auth_code+'</auth_code>';
            formData+='<body>'+ret.body+'</body>';
            formData+='<mch_id>'+ret.mch_id+'</mch_id>';
            formData+='<nonce_str>'+ret.nonce_str+'</nonce_str>';
            formData+='<out_trade_no>'+ret.out_trade_no+'</out_trade_no>';
            formData+='<spbill_create_ip>'+ret.spbill_create_ip+'</spbill_create_ip>';
            formData+='<total_fee>'+ret.total_fee+'</total_fee>';
            formData+='<sign>'+sign+'</sign>';
            formData+="</xml>";
        yjREST.post({
            engine:"remote.superagent",
            isTextPlain:true,
            data:formData,
            url:'https://api.mch.weixin.qq.com/pay/micropay',
            success:function(data){
                var x2js = new X2JS();
                var body = x2js.xml2js(data);
                if(body.xml.result_code=='FAIL'){
                    if(body.xml.err_code=='USERPAYING'){
                        var delayTime=60;
                        var excuteTime=0;
                        setInterval(function(){
                            var that=this;
                            utl.orderquery({
                                out_trade_no:options.out_trade_no,
                                success:function(result){
                                    if(result['trade_state']=='SUCCESS' || excuteTime==delayTime || result['trade_state'] == "PAYERROR"){
                                        clearInterval(that);
                                        if(options.success){
                                            options.success(result)
                                        }
                                    }else{
                                        excuteTime+=5;
                                    }
                                },
                                error:function(err){
                                    excuteTime+=5;
                                    if(excuteTime==delayTime){
                                        clearInterval(that);
                                        if(options.error){
                                            options.error(err)
                                        }
                                    }
                                }
                            })
                        },1000*5)
                    }else if(options.error){
                        options.error(new Error(body.xml.err_code_des))
                    }
                }else{
                    setTimeout(function(){
                        utl.orderquery({
                            out_trade_no:options.out_trade_no,
                            success:function(result){
                                if(result['trade_state']=='SUCCESS'){
                                    if(options.success){
                                        options.success(result)
                                    }
                                }
                            },
                            error:function(err){
                                if(options.error){
                                    options.error(err)
                                }
                            }
                        })
                    },1000*5)
                }
            },
            error:function(err){
                if(options.error){
                    options.error(err)
                }
            }
        });
    }
    /**撤销订单
     * 在调用查询接口返回后，如果交易状况不明晰，请调用【撤销订单API】，此时如果交易失败则关闭订单，该单不能再支付成功；如果交易成功，则将扣款退回到用户账户。
     * 当撤销无返回或错误时，请再次调用。注意：请勿扣款后立即调用【撤销订单API】,建议至少15秒后再调用。撤销订单API需要双向证书。
     * 例子：
        var pay=yjRequire("yujiang.Foil","yjPayment.wx.js");
        pay.revokeOrder({
            out_trade_no:'201901072132asdwrewrw23423422301',
            success:function(data){
                console.log(data)
            },
            error:function(err){
                console.log(err)
            }
        })
     * @param {String} out_trade_no 商户订单号，编号32位，自定义的
     * @param {function} success 访问成功回调
     * @param {function} error 访问失败回调
     */
    utl.revokeOrder=function(options){
        var trade_type=options.trade_type?options.trade_type:"APP";
         var wxPayConfig=g_wxPayConfig[trade_type];
        var appid=wxPayConfig.appid;
        var mch_id=wxPayConfig.mch_id;
        var ret = {
            appid: appid,
            mch_id:mch_id,
            nonce_str: utl.createNonceStr(),
            out_trade_no: options.out_trade_no
        };
        var sign=utl.sign(ret,wxPayConfig.mchkey);
        var formData="<xml>";
            formData+='<appid>'+ret.appid+'</appid>';
            formData+='<mch_id>'+ret.mch_id+'</mch_id>';
            formData+='<nonce_str>'+ret.nonce_str+'</nonce_str>';
            formData+='<out_trade_no>'+ret.out_trade_no+'</out_trade_no>';
            formData+='<sign>'+sign+'</sign>';
            formData+="</xml>";
        yjREST.post({
            engine:"remote.superagent",
            isTextPlain:true,
            data:formData,
            cert:wxPayConfig.cert,
            key:wxPayConfig.key,
            url:'https://api.mch.weixin.qq.com/secapi/pay/reverse',
            success:function(data){
                var x2js = new X2JS();
                var body = x2js.xml2js(data);
                if(body.xml.return_code!="SUCCESS"){
                    var err =new Error(body.xml.return_msg)
                    if(options.error){
                        options.error(err)
                    }
                    return;
                }
                if(body.xml.result_code!="SUCCESS"){
                    var err =new Error(body.xml.err_code_des)
                    if(options.error){
                        options.error(err)
                    }
                    return;
                }
                if(options.success){
                    options.success(body.xml)
                }
            },
            error:function(err){
                if(options.error){
                    options.error(err)
                }
            }
        });
    }
    /**
     * 统一下单
     * @param {String} out_trade_no 订单支付时传入的商户订单号
     * @param {String} money 订单支付总额
     * @param {String} notify_url 订单支付回调地址
     * @param {String} commodityDes 商品描述交易字段格式根据不同的应用场景按照以下格式：
     * APP——需传入应用市场上的APP名字-实际商品名称，天天爱消除-游戏充值。
     * @param {String}spbill_create_ip 客户端ip
     * @param {function} success 访问成功回调
     * @param {function} error 访问失败回调
     */
    utl.unifiedorder=function(options){
        //终端IP
        var trade_type=options.trade_type?options.trade_type:"APP";
        var wxPayConfig=g_wxPayConfig[trade_type];
        var spbill_create_ip=options.spbill_create_ip;
        var appid=wxPayConfig.appid;
        var mch_id=wxPayConfig.mch_id;
        var nonce_str=utl.createNonceStr();
        var notify_url=options.notify_url;
        //商户系统内部订单号，要求32个字符内，
        //只能是数字、大小写字母_-|*且在同一个商户号下唯一
        var out_trade_no=options.out_trade_no;
        var total_fee=utl.getmoney(options.money);
        var trade_type=options.trade_type;
        var openid=options.openid;
        var product_id=options.product_id;
        var body=options.commodityDes;
        var ret = {
            appid: appid,
            mch_id: mch_id,
            nonce_str: nonce_str,
            body: body,
            notify_url: notify_url,
            out_trade_no: out_trade_no,
            spbill_create_ip: spbill_create_ip,
            total_fee: total_fee,
            trade_type: trade_type,

        };
        if(trade_type=="JSAPI"){
            ret["openid"]=openid;
        }
        if(trade_type=="NATIVE"){
            ret["product_id"]=product_id
        }
        var sign=utl.sign(ret,wxPayConfig.mchkey);  
        //组装xml数据
        var formData  = "<xml>";
        formData  += "<appid>"+appid+"</appid>";  //appid
        formData  += "<body><![CDATA["+body+"]]></body>";
        formData  += "<mch_id>"+mch_id+"</mch_id>";  //商户号
        formData  += "<nonce_str>"+nonce_str+"</nonce_str>"; //随机字符串，不长于32位。
        formData  += "<notify_url>"+notify_url+"</notify_url>";
        formData  += "<out_trade_no>"+out_trade_no+"</out_trade_no>";
        formData  += "<spbill_create_ip>"+spbill_create_ip+"</spbill_create_ip>";
        formData  += "<total_fee>"+total_fee+"</total_fee>";
        formData  += "<trade_type>"+trade_type+"</trade_type>";
        if(trade_type=="JSAPI"){
             formData  += "<openid>"+openid+"</openid>";
        }
        if(trade_type=="NATIVE"){
            formData  += "<product_id>"+product_id+"</product_id>";
        }

        formData  += "<sign>"+sign+"</sign>";
        formData  += "</xml>";
        yjREST.post({
            engine:"remote.superagent",
            isTextPlain:true,
            data:formData,
            url:'https://api.mch.weixin.qq.com/pay/unifiedorder',
            success:function(data){
                var x2js = new X2JS();
                var body = x2js.xml2js(data);
                if(body.xml.return_code!="SUCCESS"){
                    var err =new Error(body.xml.return_msg)
                    options.error(err);
                    return;
                }
                if(body.xml.result_code!="SUCCESS"){
                    var err =new Error(body.xml.err_code_des)
                    options.error(err);
                    return;
                }
                var prepay_id = body.xml.prepay_id;
                var code_url=body.xml.code_url;
                //将预支付订单和其他信息一起签名后返回给前端
                var timestamp=utl.createTimeStamp();
                var result={
                    appid:appid,
                    partnerid:mch_id,
                    prepayid:prepay_id,
                    noncestr:nonce_str,
                    timestamp:timestamp,
                    package:'Sign=WXPay',
                    
                }
                if(trade_type=="JSAPI"){
                    result={
                        appId:appid,
                        signType:"MD5",
                        package:"prepay_id="+prepay_id,
                        nonceStr:nonce_str,
                        timeStamp:timestamp,                };
                }
                if(trade_type=="NATIVE"){
                    result={
                        appid:appid,
                        prepayid:prepay_id,
                        code_url:code_url
                    }
                }

                var finalsign = utl.sign(result,wxPayConfig.mchkey);
                result.sign=finalsign;
                if (options.success){
                    options.success(result)
                }
               
            },
            error:function(err){
                if (options.error){
                    options.error(err)
                }
            }
        });
    }
    //查询订单
    utl.orderquery=function(options){
        var trade_type=options.trade_type?options.trade_type:"APP";
         var wxPayConfig=g_wxPayConfig[trade_type];
        var appid=wxPayConfig.appid;
        var mch_id=wxPayConfig.mch_id;
        //商户系统内部订单号，要求32个字符内，
        //只能是数字、大小写字母_-|*且在同一个商户号下唯一
        var out_trade_no=options.out_trade_no;
        var nonce_str=utl.createNonceStr();

        var ret = {
            appid: appid,
            mch_id: mch_id,
            nonce_str: nonce_str,
            out_trade_no: out_trade_no
        };

        var sign=utl.sign(ret,wxPayConfig.mchkey);
        

        //组装xml数据
        var formData  = "<xml>";
        formData  += "<appid>"+appid+"</appid>";  //appid
        formData  += "<mch_id>"+mch_id+"</mch_id>";  //商户号
        formData  += "<nonce_str>"+nonce_str+"</nonce_str>"; //随机字符串，不长于32位。
        formData  += "<out_trade_no>"+out_trade_no+"</out_trade_no>";
        formData  += "<sign>"+sign+"</sign>";
        formData  += "</xml>";
        yjREST.post({
            engine:"remote.superagent",
            isTextPlain:true,
            data:formData,
            url:'https://api.mch.weixin.qq.com/pay/orderquery',
            success:function(data){
                var x2js = new X2JS();
                var body = x2js.xml2js(data);
                if(body.xml.return_code!="SUCCESS"){
                    var err =new Error(body.xml.return_msg)
                    options.error(err);
                    return;
                }
                if(body.xml.result_code!="SUCCESS"){
                    var err =new Error(body.xml.err_code_des)
                    options.error(err);
                    return;
                }
                if (options.success){
                    options.success(body.xml)
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
     * 下载对账单
     * @param {String} bill_date 对账单日期 如：20140603
     * @param {String} bill_type 
            ALL，返回当日所有订单信息，默认值 
            SUCCESS，返回当日成功支付的订单 
            REFUND，返回当日退款订单 
            RECHARGE_REFUND，返回当日充值退款订单
     * @param {function} success 访问成功回调
     * @param {function} error 访问失败回调
     */
    utl.downloadbill=function(options){
        var trade_type=options.trade_type?options.trade_type:"APP";
         var wxPayConfig=g_wxPayConfig[trade_type];
        var appid=wxPayConfig.appid;
        var mch_id=wxPayConfig.mch_id;
        var bill_date=options.bill_date;
        var bill_type=options.bill_type;
        var nonce_str=utl.createNonceStr();
        var ret = {
            appid: appid,
            mch_id: mch_id,
            nonce_str: nonce_str,
            bill_date: bill_date,
            bill_type:bill_type
        };
        var sign=utl.sign(ret,wxPayConfig.mchkey);
        //组装xml数据
        var formData  = "<xml>";
        formData  += "<appid>"+appid+"</appid>";  //appid
        formData  += "<mch_id>"+mch_id+"</mch_id>";  //商户号
        formData  += "<nonce_str>"+nonce_str+"</nonce_str>"; //随机字符串，不长于32位。
        formData  += "<bill_date>"+bill_date+"</bill_date>";
        formData  += "<bill_type>"+bill_type+"</bill_type>";
        formData  += "<sign>"+sign+"</sign>";
        formData  += "</xml>";
        yjREST.post({
            engine:"remote.superagent",
            isTextPlain:true,
            data:formData,
            url:'https://api.mch.weixin.qq.com/pay/downloadbill',
            success:function(data){
                var x2js = new X2JS();
                var body = x2js.xml2js(data);
                if(body.xml&&body.xml.return_code!="SUCCESS"){
                    var err =new Error(body.xml.return_msg)
                    options.error(err);
                    return;
                }
                if(body.xml&&body.xml.result_code!="SUCCESS"){
                    var err =new Error(body.xml.err_code_des)
                    options.error(err);
                    return;
                }
                if (options.success){
                    if(bill_type=="ALL"){
                        //data=data.replace(/[\r\n]/g,"");
                        var bill=[];
                        var result=data.split('\r\n');
                        if(result[result.length-1]==""){
                            //slice,不影响原来的数据，返回新的数组
                            //result.slice(0,result.length-1);
                            result=result.slice(0,result.length-1);
                        }
                        billtemp=result.slice(0,result.length-2);
                        var summary=result.slice(result.length-2,result.length);
                       
                        for(var i=1;i<billtemp.length;i++){
                            var d=billtemp[i].replace(/`/g,"").split(',');
                            var billData={
                                tradetime:d[0],
                                ghid:d[1],
                                mchid:d[2],
                                submch:d[3],
                                deviceid:d[4],
                                wxorder:d[5],
                                bzorder:d[6],
                                openid:d[7],
                                tradetype:d[8],
                                tradestatus:d[9],
                                bank:d[10],
                                currency:d[11],
                                totalmoney:d[12],
                                redpacketmoney:d[13],
                                wxrefund:d[14],
                                bzrefund:d[15],
                                refundmoney:d[16],
                                redpacketrefund:d[17],
                                refundtype:d[18],
                                refundstatus:d[19],
                                productname:d[20],
                                bzdatapacket:d[21],
                                fee:d[22],
                                rate:d[23],
                                ordermoney:d[24],
                                refundmoneyready:d[25],
                                ratenote:d[26]
                            }
                            bill.push(billData);
                        }
                        var s=summary[1].replace(/`/g,"").split(',')
                        var bills={
                            bill:bill,
                            //总交易单数,应结订单总金额,退款总金额,充值券退款总金额,手续费总金额,订单总金额,申请退款总金额
                            summary:{
                                billscount:s[0],
                                billsAmount:s[1],
                                billsRefoundAmount:s[2],
                                redpacketMoneys:s[3],
                                feesMoney:s[4],
                                ordersAmount:s[5],
                                billsReadyRefoundAmount:s[6],
                            }
                        }
                        //console.log(bills);
                        options.success(bills)
                    }else{
                        options.success(body.xml)
                    }
                }
               
            },
            error:function(err){
                //console.log(err)
                if (options.error){
                    options.error(err)
                }
            }
        });
    }
    /**
     * 申请退款
     * out_trade_no和trade_no,不能同时为空
     * @param {String} out_trade_no 订单支付时传入的商户订单号
     * @param {String} trade_no 交易号
     * @param {String} refund_amount 需要退款的金额，该金额不能大于订单金额,单位为元，支持两位小数 
     * @param {String} out_request_no 标识一次退款请求，同一笔交易多次退款需要保证唯一，如需部分退款，则此参数必传。
     * @param {String} total_fee 订单总金额，单位为元，
     * @param {function} success 访问成功回调
     * @param {function} error 访问失败回调
     */
    utl.refund=function(options){
        var trade_type=options.trade_type?options.trade_type:"APP";
         var wxPayConfig=g_wxPayConfig[trade_type];
        var appid=wxPayConfig.appid;
        var mch_id=wxPayConfig.mch_id;
        //商户系统内部的退款单号，商户系统内部唯一，
        //只能是数字、大小写字母_-|*@ ，同一退款单号多次请求只退一笔。
        var out_refund_no=options.out_request_no;
        var transaction_id=options.trade_no;
        //订单总金额，单位为分，只能为整数，详见支付金额
        var total_fee=utl.getmoney(options.total_fee);
        //退款总金额，订单总金额，单位为分，只能为整数，详见支付金额
        var refund_fee=utl.getmoney(options.refund_amount);
       
        var nonce_str=utl.createNonceStr();

        var ret = {
            appid: appid,
            mch_id: mch_id,
            nonce_str: nonce_str,
            transaction_id: transaction_id,
            out_refund_no:out_refund_no,
            total_fee:total_fee,
            refund_fee:refund_fee
        };
        var sign=utl.sign(ret,wxPayConfig.mchkey);
        
        
        //组装xml数据
        var formData  = "<xml>";
        formData  += "<appid>"+appid+"</appid>";  //appid
        formData  += "<mch_id>"+mch_id+"</mch_id>";  //商户号
        formData  += "<nonce_str>"+nonce_str+"</nonce_str>"; //随机字符串，不长于32位。
        formData  += "<transaction_id>"+transaction_id+"</transaction_id>";
        formData  += "<out_refund_no>"+out_refund_no+"</out_refund_no>";
        formData  += "<total_fee>"+total_fee+"</total_fee>";
        formData  += "<refund_fee>"+refund_fee+"</refund_fee>";
        formData  += "<sign>"+sign+"</sign>";
        formData  += "</xml>";
        yjREST.post({
            engine:"remote.superagent",
            isTextPlain:true,
            data:formData,
            cert:wxPayConfig.cert,
            key:wxPayConfig.key,
            url:'https://api.mch.weixin.qq.com/secapi/pay/refund',
            success:function(data){
                var x2js = new X2JS();
                var body = x2js.xml2js(data);
                if(body.xml.return_code!="SUCCESS"){
                    var err =new Error(body.xml.return_msg)
                    options.error(err);
                    return;
                }
                if(body.xml.result_code!="SUCCESS"){
                    var err =new Error(body.xml.err_code_des)
                    options.error(err);
                    return;
                }
                if (options.success){
                    options.success(body.xml)
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

    //退款查询
    utl.refundQuery=function(options){
        var trade_type=options.trade_type?options.trade_type:"APP";
        var wxPayConfig=g_wxPayConfig[trade_type];
        var appid=wxPayConfig.appid;
        var mch_id=wxPayConfig.mch_id;
        //商户系统内部的退款单号，商户系统内部唯一，
        //只能是数字、大小写字母_-|*@ ，同一退款单号多次请求只退一笔。
        var out_refund_no=options.out_request_no;
        var transaction_id=options.trade_no;
       
        var nonce_str=utl.createNonceStr();

        var ret = {
            appid: appid,
            mch_id: mch_id,
            nonce_str: nonce_str,
            transaction_id: transaction_id,
            out_refund_no:out_refund_no
        };
        var sign=utl.sign(ret,wxPayConfig.mchkey);
        //组装xml数据
        var formData  = "<xml>";
        formData  += "<appid>"+appid+"</appid>";  //appid
        formData  += "<mch_id>"+mch_id+"</mch_id>";  //商户号
        formData  += "<nonce_str>"+nonce_str+"</nonce_str>"; //随机字符串，不长于32位。
        formData  += "<transaction_id>"+transaction_id+"</transaction_id>";
        formData  += "<out_refund_no>"+out_refund_no+"</out_refund_no>";
        formData  += "<sign>"+sign+"</sign>";
        formData  += "</xml>";
        yjREST.post({
            engine:"remote.superagent",
            isTextPlain:true,
            data:formData,
            cert:wxPayConfig.cert,
            key:wxPayConfig.key,
            url:'https://api.mch.weixin.qq.com/pay/refundquery',
            success:function(data){
                var x2js = new X2JS();
                var body = x2js.xml2js(data);
                if(body.xml.return_code!="SUCCESS"){
                    var err =new Error(body.xml.return_msg)
                    options.error(err);
                    return;
                }
                // 如果没有发生退款，result_code=='FAIL'
                // if(body.xml.result_code!="SUCCESS"){
                //     var err =new Error(body.xml.err_code_des)
                //     options.error(err);
                //     return;
                // }
                if (options.success){
                    options.success(body.xml)
                }
            },
            error:function(err){
                if (options.error){
                    options.error(err)
                }
            }
        });
    }
    //把金额转为分
    utl.getmoney=function (money) {
       return Math.round(Math.abs(money) * 100, 10);
    }

    // 随机字符串产生函数
    utl.createNonceStr=function () {
        return Math.random().toString(36).substr(2, 15);
    }

    // 时间戳产生函数  
    utl.createTimeStamp=function () {
        return parseInt(new Date().getTime() / 1000) + '';
    }

    //签名加密算法
    utl.sign=function(param,mchkey){
        var string = raw(param);
        string = string + '&key=' + mchkey;
        return crypto.createHash('md5').update(string, 'utf8').digest('hex').toUpperCase();
    }
    /**
     * 签名验证
     * @param {obj} 要验证的参数字符串
     * @returns {Boolean}
     */
    utl.signVerify = function (params,mchkey) {
        var sign=params['sign'];//签名 
        var str=utl.sign(params,mchkey);
        if(sign==str){
            return true;
        }else{
            return false;
        }
    };


    function raw(args) {
        var keys = Object.keys(args);
        keys = keys.sort()
        var newArgs = {};
        keys.forEach(function (key) {
            if (key!='sign'&& args[key]!= undefined && args[key]!= "")
                newArgs[key] = args[key];
        });
        var string = '';
        for (var k in newArgs) {
            string += '&' + k + '=' + newArgs[k];
        }
        string = string.substr(1);
        return string;
    }


    return utl;
})();


