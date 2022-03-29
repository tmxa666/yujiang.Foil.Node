/**
 * @author mustapha.wang
 * @fileOverview
 * @see module:yjTest
 */

/**
 * @description 单元测试。
 * @exports yjTest_qunit_inner
 * @example <pre>
 * var yjTest=yjRequire("yujiang.Foil","yjTest.qunit.inner.js");
 * </pre>
 * @see nodejs::yjRequire
 */
var path = require("path");
var util=require("util");
module.exports = {
	/**
	 * 执行单元测试。在当前进程中执行。只使用qunit模组(不需要修改)，不是用node-qunit模组(需要修改log.js获得测试报告)。
	 * 执行的测试结果返回到浏览器中显示。
	 * @param {object[]} files 文件
	 * @param {object[]} files.[i].deps 依赖项。指明测试用例中用到的一些变量名称，而且这些名称在测试用例中没有为它指明来源。<br/>
	 * 如：测试用例是要兼容浏览器和node.js两个环境，因此可能没有为某些变量名称使用require引入。
	 * @param {string|string[]} files.[i].tests 测试用例，可以是数组或字串。
	 * @param {obejct} sender model的sender
	 * @example <pre>写一个Model调用测试用例：test_yjDBService.{m}.js
	 * module.exports = function(sender) {
	 *     var yjTest = global.yjRequire("yujiang.Foil",'yjTest.qunit.inner.js');
	 *     var path = require("path");
	 *     yjTest.test({
	 *         deps : [
	 *             {
	 *                 path : path.join(_dirname,"/../../../src/yjDBService.js"),
	 *                 namespace : "yjDBService"
	 *             },
	 *             {
	 *                 path : path.join(_dirname,"/../../../src/client/js/yjUtils.js"),
	 *                 namespace : "yjUtils"
	 *             }],
	 *         tests : _dirname + "/../../testcase/testCase_yjDBService.js"
	 *     }, sender);
	 * }</pre>
	 */
	test : function(files, sender) {
	    //删除QUnit引用，等于每次初始化
	    var localQUnitPath=require.resolve("qunit");  
	    delete require.cache[localQUnitPath];	         
	    var QUnit=require(localQUnitPath);
	    global["QUnit"]=QUnit;
	    
	    var report = {
	        assertions: [],
	        tests: [],
	        summaries: [],
	        coverages: []
	    };
	    var currentModule;
	    QUnit.testStart(function(data) {	        
            //console.log(data);
	        currentModule = data.module
        });
	    
	    QUnit.log(function(data) {
	        //console.log(data);
	        data.test=data.name;
	        data.module = currentModule;
	        report.assertions.push(data);
        });
	    
	    QUnit.testDone(function(data) {
	        //console.log(data);
	        data.module = data.module || currentModule;
	        report.tests.push(data);
        });
	    
	    QUnit.done(function(data) {
	        //console.log(data);
	        report.summaries.push(data);
	        if (!sender["view"])
                sender["view"] = path.join(__dirname,"../test/node.js/view_QUnit.ejs");
	        //console.dir(report);
	        sender.success(report);
	    });
	    
	    if (Array.isArray(files.deps)){
	        files.deps.forEach(function(dep){
	            global[dep.namespace]=require(dep.path);
	        });
	    }
	    else if (files.deps){
	        global[files.deps.namespace]=require(files.deps.path);
	    }
	    
	    if (Array.isArray(files.code)){
	        files.code.forEach(function(code){
	            global[code.namespace]=require(code.path);
	        });	        
	    }
	    else if (files.code){
	        global[files.code.namespace]=require(files.code.path);
	    }

	    if (Array.isArray(files.tests)){
	        files.tests.forEach(function(test){
	            delete require.cache[test];
	            require(test);
	        });
	    }
	    else{
	        delete require.cache[files.tests];
            require(files.tests);
	    }
	        
	    QUnit.start();	   	 
	}
}