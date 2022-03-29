/**
 * @fileOverview
 * @author wxh，2018/12/21
 * @description 测试用例脚本解析器。解析测试用例脚本，配合qunit执行测试用例。
 * @see module:yjTestcase
 */
var yjBizService=yjRequire("yujiang.Foil","yjBizService.js");
var yjDBService_util=yjRequire("yujiang.Foil","yjDBService.util.js");
var yjLogin=yjRequire("yujiang.Foil","yjApp.middle.login.js");
var yjDB=yjRequire("yujiang.Foil","client/js/yjDB.js");
var util=require("util");
var async=require("async");

/**
 * @description 单元测试用例。
 * @exports yjTestcase
 * @example <pre>
 * var yjTest=yjRequire("yujiang.Foil","yjTestcase.js");
 * </pre>
 * @see nodejs::yjRequire
 */
module.exports={
    /**
     * 解析运行一个测试用例脚本
     * @param {object} options 测试用例脚本
     * @param {object} assert qunit的assert元件
     * @example
     * <pre>
     * var yjTestcase=yjRequire("yujiang.Foil","yjTestcase.js");
     * QUnit.test("order:submit order下订单",function(assert){
     *     var options=require('./testcase_submitOrder.config.js');
     *     yjTestcase.run(options,assert);
     * });
     * </pre>
     * @example
     * 测试用例脚本文件testcase_submitOrder.config.js,类似这样：
     * <pre>
     * var CommodityOIDs=['15428a70-b32e-11e8-adf0-97df910bb809'];
     * module.exports={
     *     token:{
     *         payload:{}
     *     },
     *     steps:[
     *         {
     *             type:"db",
     *             name:"先查询库存占用",
     *             times:1,//并发调用次数，预设1
     *             input:{
     *                 sql:" select CommodityOID,PrePaymentCount,AfterPaymentCount"+
     *                     " from StockUseStatus"+
     *                     " where CommodityOID in (?)",
     *                 parameters:CommodityOIDs
     *             },
     *             output:{
     *                 name:"before.StockUseStatus",
     *                 array:{
     *                     is2Object:true,
     *                     key:'CommodityOID'    //结果是数组时，用这个key转成object
     *                 }
     *             }
     *         },
     *         {
     *             type:"biz",
     *             name:"调用下订单服务",
     *             times:5,//并发调用次数
     *             input:{
     *                 method:"post",
     *                 params:["APPService","commodityInfo","submitOrder"],
     *                 query:{},
     *                 data:{
     *                     CustomerOID:"bfd683f0-03ed-11e9-bfe8-337bad352fc0_wxh",
     *                     ProvinceOID:150000,
     *                     CityOID:150500,
     *                     CountyOID:150525,
     *                     Address:'不是不到你家附近',
     *                     Consignee:'王行华',
     *                     Phone:'13818928505',
     *                     ExpendCredits:0,
     *                     CommodityOIDList:[{
     *                         CommodityOID:CommodityOIDs[0],
     *                         Count:1,
     *                         Price:0.27,
     *                         Points:0//积分
     *                     }],
     *                     Value:0.27,
     *                     //DeliveryAddressOID:"b868cf60-b622-11e8-9917-a3c5d83a88b7",
     *                     Remarks:"qunit测试下单",
     *                     Type:2
     *                 }
     *             },
     *             output:{
     *                 name:"target"
     *             }
     *         },
     *         {
     *             type:"assert",
     *             name:"判断订单服务返回结果",
     *             input:{
     *                 asserts:[
     *                     "outputs['target'][0].status==1",
     *                     "outputs['target'][1].status==1",
     *                     "outputs['target'][2].status==1",
     *                     "outputs['target'][3].status==1",
     *                     "outputs['target'][4].status==1"
     *                 ],
     *                 isFaultContinue:false //有断言失败时是否继续下面的step
     *             }
     *         },
     *         {
     *             type:'db',
     *             name:"从数据库查询订单",
     *             input:{
     *                 sql:" select m.Status,m.Value,"+
     *                     "   d.CommodityOID,d.Count,d.UnitPrice"+
     *                     " from Orders as m"+
     *                     " left outer join OrderDetails as d on d.OrderOID=m.OrderOID"+
     *                     " where m.OrderOID=?",
     *                 parameters:[{
     *                     value:"outputs['target'][0].data.OrderOID",
     *                     isNeedEval:true
     *                 }]
     *             },
     *             output:{
     *                 name:'after.Order'
     *             }
     *         },
     *         {
     *             type:"assert",
     *             name:"判断数据库订单是否正确",
     *             input:{
     *                 asserts:[
     *                     "outputs['after.Order'][0][0].Status==0",
     *                     "outputs['after.Order'][0][0].Value==0.27"
     *                 ]
     *             }
     *         },
     *         {
     *             type:"db",
     *             name:"再次查询库存占用",
     *             input:{
     *                 sql:" select CommodityOID,PrePaymentCount,AfterPaymentCount"+
     *                     " from StockUseStatus"+
     *                     " where CommodityOID in (?)",
     *                 parameters:CommodityOIDs
     *             },
     *             output:{
     *                 name:'after.StockUseStatus',
     *                 array:{
     *                     is2Object:true,
     *                     key:'CommodityOID'
     *                 }
     *             }
     *         },
     *         {
     *             type:"assert",
     *             name:"比对库存占用是否正确",
     *             input:{
     *                 asserts:[
     *                     "outputs['before.StockUseStatus'][0]['"+CommodityOIDs[0]+"'].PrePaymentCount+5==outputs['after.StockUseStatus'][0]['"+CommodityOIDs[0]+"'].PrePaymentCount",
     *                     "outputs['before.StockUseStatus'][0]['"+CommodityOIDs[0]+"'].AfterPaymentCount==outputs['after.StockUseStatus'][0]['"+CommodityOIDs[0]+"'].AfterPaymentCount"
     *                 ]
     *             }
     *         }
     *     ]
     * }</pre>
     */
    run:function(options,assert){
        var token='';
        if (options.token && options.token.payload){
            token=yjLogin.getToken(options.token.payload);
        }
        var done=assert.async();
        var isDone=false;
        var outputs={};
        
        function do_db(step,cb){
            var parameters=[];
            if (step.input.parameters){
                step.input.parameters.forEach(function(p){
                    //计算参数值
                    if (p.isNeedEval==true){
                        parameters.push(eval(p.value));
                    }
                    else parameters.push(p.value || p);
                });
            }
            if (step.input.engine){
                var yjDBService=yjRequire("yujiang.Foil","yjDBService.engine."+step.input.engine+".js");
            }
            else 
                var yjDBService=yjRequire("yujiang.Foil","yjDBService.js");
            var connectionOptions=null;
            if (step.input.connectionOptions){
                var connectionOptions=yjDBService_util.extractConnectionOptions(step.input.connectionOptions);
            }
            function main(cb2){
                yjDBService.exec({
                    connectionOptions:connectionOptions,
                    sql:step.input.sql,
                    parameters:parameters,
                    rowsAsArray:false,
                    success:function(data){
                        if (step.output.array && step.output.array.is2Object==true){
                            data=yjDB.objectList2Hash(data,step.output.array.key);
                        }
                        //console.log(step.output.name);
                        //console.log(data);
                        if (!isDone){
                            assert.ok(true,step.name+','+step.type+'返回:'+util.inspect(data));
                        }
                        cb2(null,data);
                    },
                    error:function(err){
                        cb2(err);
                    }
                });
            }
            var tasks=[];
            for (var i=0;i<(step.times || 1);i++){
                tasks.push(main);
            }
            async.parallel(tasks,function(err,data){
                if (!err){
                    //console.log(step.output.name);
                    //console.log(data);
                    outputs[step.output.name]=data;
                }
                cb(err);
            });
        }
        //zcl
        function do_deepCopy(obj) {
            var result = Array.isArray(obj)?[]:{};
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (typeof obj[key] === 'object') {
                        if(!obj[key].isNeedEval){
                            result[key] = do_deepCopy(obj[key]);   //递归复制
                        }else{
                            result[key] = eval(obj[key].value);
                        }
                    }else{
                        result[key] = obj[key];
                    }
                }
            }
            return result;
        }
        
        function do_biz(step,cb){
            var q=step.input.query;
            var body=step.input.data;
            if (!q) q={};
            //zcl
            q=do_deepCopy(q);
            body=do_deepCopy(body);
            q.access_token=token;
            function main(cb2){            
                yjBizService[step.input.method]({          
                    params:step.input.params,
                    query:q,
                    data:body,
                    success:function(data){
                        if (step.output.array && step.output.array.is2Object==true){
                            data=yjDB.objectList2Hash(data,step.output.array.key);
                        }
                        //console.log(data);
                        if (!isDone){
                            assert.ok(true,step.name+','+step.type+'返回:'+util.inspect(data));
                        }
                        cb2(null,data);
                    },
                    error:function(err){
                        cb2(err);
                    }                    
                });
            }
            var tasks=[];
            for (var i=0;i<(step.times || 1);i++){
                tasks.push(main);
            }
            async.parallel(tasks,function(err,data){
                if (!err){
                    //console.log(step.output.name);
                    //console.log(data);
                    outputs[step.output.name]=data;
                }
                cb(err);
            });
        }

        /*
            zcl 增加类型run，通用处理函数
            parameters:参数，会通过eval处理
            run：function,执行方法,需要把结果return
        */
        function do_run(step,cb){
            try{
                var p=step.input.parameters;
                if (!p) p={};
                p=do_deepCopy(p);
                // console.log(p);
                var run=step.input.run;
                var data=run(p);
                assert.ok(true,step.name+','+step.type+'返回:'+util.inspect(data));
                outputs[step.output.name]=data;
            }catch(err){
                cb(err);
                return;
            }
            cb(null);
        }
        async.eachSeries(options.steps,function(step,cb){
            switch (step.type){
            case "db":
                do_db(step,cb);
                break;
            case "biz":
                do_biz(step,cb);
                break;
            case "run":
                do_run(step,cb);
                break;
            case "assert":
                var isAllOK=true;
                assert.ok(true,step.name+'=====================');
                step.input.asserts.forEach(function(a){
                    var isOK=eval(a);
                    if (!isOK) isAllOK=false;
                    assert.ok(isOK,'断言:'+a);
                });
                if (!isAllOK && step.input.isFaultContinue==false){
                    cb('断言失败，并且step.input.isFaultContinue是false，测试中断。');
                }
                else cb(null);
                break;
            }},
            function(err){
                if (err) assert.ok(false,util.inspect(err));
                done();
                isDone=true;
            }
        );
    }
}