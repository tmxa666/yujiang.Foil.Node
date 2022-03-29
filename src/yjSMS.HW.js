
module.exports = {

    /*  
     * @param options.appKey  
     * @param options.appSecret
     * @param options.sender
     * @param options.templateId
     * @param options.signature   国内短信需要传，国际/港澳台传'';
     * @param options.receiver    接收短信的号码  全局号码格式(包含国家码),示例:+8615123456789,多个号码之间用英文逗号分隔
     * @param options.templateParas  模板变量,替换模板中的变量,给多个手机发，是多个值,多个值之间用英文逗号分开
     * @param callback_success} options.success - 成功后的回调函数。
     * @param {callback_error} options.error - 失败后的回调函数。
     * @return 成功： {status:200} 失败：{"SMS send error":e.message}
     */
    send:function(options){
        options=options?options:{};
        var https = require('https'); //引入https模块
        var url = require('url'); //引入url模块
        var querystring = require('querystring'); // 引入querystring模块
        
        //必填,请参考"开发准备"获取如下数据,替换为实际值
        var realUrl ='https://api.rtc.huaweicloud.com:10443/sms/batchSendSms/v1'; //APP接入地址+接口访问URI https://api.rtc.huaweicloud.com:10443
        var appKey = options.appKey?options.appKey:'Lz7QmAdFohh4L1SkEc85UrYw6o6Q'; //APP_Key:Lz7QmAdFohh4L1SkEc85UrYw6o6Q
        var appSecret = options.appSecret? options.appSecret:'6e8RiWu8Hw2XC8K4Z4ER1lS117Qo'; //APP_Secret:6e8RiWu8Hw2XC8K4Z4ER1lS117Qo
        var sender =options.sender?options.sender:'isms0000000083'; //国内短信签名通道号或国际/港澳台短信通道号 isms0000000083
        var templateId = options.templateId?options.templateId:'b50565559f7743b98cf3dcf83a69117e'; //模板ID:b50565559f7743b98cf3dcf83a69117e
        
        //条件必填,国内短信关注,当templateId指定的模板类型为通用模板时生效且必填,必须是已审核通过的,与模板类型一致的签名名称
        //国际/港澳台短信不用关注该参数
        var signature = options.signature?options.signature:''; //签名名称
        
        //必填,全局号码格式(包含国家码),示例:+8615123456789,多个号码之间用英文逗号分隔
        // var receiver = '+886987134521'; //短信接收人号码
        var receiver=options.receiver?options.receiver:"+8615102967291"
        //选填,短信状态报告接收地址,推荐使用域名,为空或者不填表示不接收状态报告
        var statusCallBack = '';
        

        /**
         * 选填,使用无变量模板时请赋空值 var templateParas = '';
         * 单变量模板示例:模板内容为"您的验证码是${NUM_6}"时,templateParas可填写为'["369751"]'
         * 双变量模板示例:模板内容为"您有${NUM_2}件快递请到${TXT_32}领取"时,templateParas可填写为'["3","人民公园正门"]'
         * 查看更多模板格式规范:常见问题>业务规则>短信模板内容审核标准
         */
        
        var templateParas = '["'+(options.templateParas?options.templateParas:'123456')+'"]'; //模板变量

        
        /*
         * 
         * 
         * @param sender
         * @param receiver
         * @param templateId
         * @param templateParas
         * @param statusCallBack
         * @param signature | 签名名称,使用国内短信通用模板时填写
         * @returns
         */
        function buildRequestBody(sender, receiver, templateId, templateParas, statusCallBack, signature){
            if (null !== signature && signature.length > 0) {
                return querystring.stringify({
                    'from': sender,
                    'to': receiver,
                    'templateId': templateId,
                    'templateParas': templateParas,
                    'statusCallback': statusCallBack,
                    'signature': signature
                });
            }
        
            return querystring.stringify({
                'from': sender,
                'to': receiver,
                'templateId': templateId,
                'templateParas': templateParas,
                'statusCallback': statusCallBack
            });
        }
        
        /*
         * 构造X-WSSE参数值
         * 
         * @param appKey
         * @param appSecret
         * @returns
         */
        function buildWsseHeader(appKey, appSecret){
            var crypto = require('crypto');
            var util = require('util');
            var time = new Date(Date.now()).toISOString().replace(/.[0-9]+\Z/, 'Z'); //Created
            var nonce = crypto.randomBytes(64).toString('hex'); //Nonce
            var passwordDigestBase64Str = crypto.createHash('sha256').update(nonce + time + appSecret).digest('base64'); //PasswordDigest
            return util.format('UsernameToken Username="%s",PasswordDigest="%s",Nonce="%s",Created="%s"', appKey, passwordDigestBase64Str, nonce, time);
        }
        
        var urlobj = url.parse(realUrl); //解析realUrl字符串并返回一个 URL对象
        
        
        var https = require('https'); //引入https模块
        var ops = {
            host: urlobj.hostname, //主机名
            port: urlobj.port, //端口
            path: urlobj.pathname, //URI
            method: 'POST', //请求方法为POST
            headers: { //请求Headers
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'WSSE realm="SDP",profile="UsernameToken",type="Appkey"',
                'X-WSSE': buildWsseHeader(appKey, appSecret),
            },
            rejectUnauthorized: false
            //为防止因HTTPS证书认证失败造成API调用失败,需要先忽略证书信任问题
        };
        // 请求Body,不携带签名名称时,signature请填null
        var body = buildRequestBody(sender, receiver, templateId, templateParas, statusCallBack, signature);
        var req = https.request(ops, (res) => {
           res.setEncoding('utf8'); //设置响应数据编码格式
           res.on('data', (d) => {
                    options.success({status:res.statusCode});
               }); 
           });
           req.on('error', (e) => {
             options.error({"SMS send error":e.message});
               console.error(e.message); //请求错误时,打印错误信息
           });
           req.write(body); //发送请求Body数据
           req.end(); //结束请求
        }       
}




