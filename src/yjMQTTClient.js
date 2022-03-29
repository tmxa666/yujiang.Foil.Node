/**
 * @fileOverview
 * @author  wh,2019/03/20
 * 创建客户端  MQTTClient
 */
var  mqtt = require('mqtt'); 
var  yjMQTTClient=null
module.exports = {
    init:function(){
        if (yjGlobal.config.mqttBroker) {
            yjMQTTClient = mqtt.connect(yjGlobal.config.mqttBroker); 
            yjMQTTClient.on('connect',(connack) => {            
            });
            yjMQTTClient.on('message',(topic, message, packet) => {
                console.log(topic, message);
            })
            yjMQTTClient.on('packetsend',(packet) => {
            })
            yjMQTTClient.on('packetreceive',(packet) => {
                // console.log("packetreceive");
            })
            yjMQTTClient.on('reconnect',() => {
                // console.log("reconnect");
            })
            yjMQTTClient.on('close',() => {
                // console.log("close");
            })
            yjMQTTClient.on('offline',() => {
                // console.log("offline");
            })
            yjMQTTClient.on('error',(err) => {     
            })
            yjMQTTClient.on('end',() => {  
            })
        }
    },
    /**
     * 订阅主题
     * @param   {string}   topic    is a String topic to subscribe to or an Array of topics to subscribe to
     * @param   {int}   options  qos qos subscription level, default 0
     * @param   {Function} callback function (err, granted) callback fired on suback where:
     * @return  {null}
     */
    subscribe:function(topic,options,callback){
        if(yjMQTTClient&&yjMQTTClient.connected){
            yjMQTTClient.subscribe(topic,options,callback);
       
        }else{
            console.log("MqttClinet not connected!!!");
        }
    },
    /**
     * [publish description]
     * @param   {string|array}   topic    [is the topic to publish to, String]
     * @param   {string|buffer}   payload  [is the message to publish, Buffer or String]
     * @param   {int}   options  [is the options to publish with, including]
     * @param   {Function} callback function (err), fired when the QoS handling completes, or at the next tick if QoS 0. An error occurs if client is disconnecting.
     * @return  {null}
     */
    publish:function(topic,payload,options,callback){
        if(yjMQTTClient&&yjMQTTClient.connected){
            yjMQTTClient.publish(topic,payload,options,callback);
        }else{
            console.log("MqttClinet not connected!!!");
        }
    },
    getClient:function(){
        if(yjMQTTClient&&yjMQTTClient.connected){
            return  yjMQTTClient
        }else{
            yjMQTTClient = mqtt.connect(yjGlobal.config.mqttBroker); 
            yjMQTTClient.on('connect',(connack) => {
                return yjMQTTClient;
            });
        }
    }
}

