/**
 * @author mustapha.wang,2019/7/11
 */
var WebSocket=require("ws");
var url=require("url");
var yjPusher=require("./yjPusher.ws.js");
/**
 * @exports yjPusher_broker
 * @description <pre>在webserver中接收bizserver的推送，转发推送给browser。
 * 或者在bizserver中的两个不同的房间之间转发。有断线重连。</pre>
 * @param {string} options.fromRoom 从BizServer的哪个房间
 * @param {string} options.toRoom 推送到WebServer/BizServer的哪个房间
 * @returns {object} 返回timer
 */
module.exports.broker=function(options){
    // console.log(yjGlobal.layer);
    //在biz端（web+biz部署在同一个进程）且两个房间号相同，就不需要中转了
    if (yjGlobal.layer.indexOf('biz')>=0 && options.fromRoom==options.toRoom) return;
    var urlObject = url.parse(yjGlobal.config.biz_Connection.connection.url, true);
    // console.log(urlObject);
    var urlObject2={
        protocol:urlObject.protocol=='http:'?'ws:':'wss:',
        host:urlObject.host,
        slashes:true
    }
    var bizUrl=url.format(urlObject2);
    // console.log(bizUrl);
    var isOpened=false;
    var isConnecting=false;
    //断线后自动重连接
    return setInterval(function(){
        if (isOpened || isConnecting) return;
        isConnecting=true;
        var ws = new WebSocket(bizUrl);
        ws.on('open', function() {
            isConnecting=false;
            isOpened=true;
            console.log('yjPusher.broker: open,"'+options.fromRoom+'"▶"'+options.toRoom+'"');
            ws.send(JSON.stringify({
                cmd:"subscribe",
                room : options.fromRoom
            }));
        });
    
        ws.on('close', function() {
            isConnecting=false;
            isOpened=false;
            console.log('yjPusher.broker: close,"'+options.fromRoom+'"▶"'+options.toRoom+'"');
        });
    
        ws.on('error', function(err) {
            console.log('yjPusher.broker: error,"'+options.fromRoom+'"▶"'+options.toRoom+'"\n'+err.toString());
            //console.log(err);
        });
    
        ws.on('message',function(data){
            //console.log("yjPusher.broker: message:"+data);
            yjPusher.push(options.toRoom,data);
        });
    },1000);
}