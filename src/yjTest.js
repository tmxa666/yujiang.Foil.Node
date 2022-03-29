/**
 * @author mustapha.wang
 * @fileOverview
 * @see module:yjTest
 */

/**
 * @description 单元测试。
 * @exports yjTest
 * @example <pre>
 * var yjTest=yjRequire("yujiang.Foil","yjTest.js");
 * </pre>
 * @see nodejs::yjRequire
 */
var path = require("path");
module.exports = {
	/**
	 * 执行单元测试。在子进程中执行，参数config.unitTest.start指定的文件作为子进程的测试环境的启动文件。
	 * 使用qunit和node-qunit模组。
	 * 执行的测试结果返回到浏览器中显示。
	 * @param {object[]} files 文件
	 * @param {object[]} files.[i].deps 依赖项。指明测试用例中用到的一些变量名称，而且这些名称在测试用例中没有为它指明来源。<br/>
	 * 如：测试用例是要兼容浏览器和node.js两个环境，因此可能没有为某些变量名称使用require引入。
	 * @param {string|string[]} files.[i].tests 测试用例，可以是数组或字串。
	 * @param {obejct} sender model的sender
	 * @example <pre>写一个Model调用测试用例：test_yjDBService.{m}.js
	 * module.exports = function(sender) {
	 *     var yjTest = global.yjRequire("yujiang.Foil",'yjTest.js');
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
		var testrunner = require("node-qunit");
		// /不要在cmd的console显示
		testrunner.options.log.assertions = false;
		testrunner.options.log.errors = false;
		testrunner.options.log.tests = false;
		testrunner.options.log.summary = false;
		testrunner.options.log.globalSummary = false;
		testrunner.options.log.coverage = false;
		testrunner.options.log.globalCoverage = false;
		testrunner.options.log.testing = false;
		testrunner.options.coverage = false;

		// /清除测试报告，如果不清除，会一直累加
		testrunner.log.reset();

		function generateStartFile() {
			// qunit执行测试用例用了另一个进程,所以需要start.js启动
			var yjUnitTest_Start = {
                path : yjGlobal.config.unitTest.start,
                namespace : "yjUnitTest_Start"
            };
			
			var testCase = null;

			if (files instanceof Array)
				testCase = files[0];
			else
				testCase = files;
			
			//code和deps两个地方都要加上
			if (!testCase.code) {
				// node-qunit，要求code文件不能是空
				testCase.code = yjUnitTest_Start;
			}
			
			if (testCase.deps) {
				if (testCase.deps instanceof Array) {
					testCase.deps.unshift(yjUnitTest_Start);
				} else {
					var deps = [];
					deps.push(yjCrossProcessGlobal);
					deps = deps.concat(testCase.deps);
					testCase.deps = deps;
				}
			} else
				testCase.deps = yjUnitTest_Start;			
		}

		generateStartFile();					
		
		testrunner.run(files, function(err, report) {
		    //console.dir(report);
		    //console.dir(testrunner.log.data());
			if (err){
				sender.error(err);
			}
			else {
				var testResult = testrunner.log.data();
				if (!sender["view"])
					sender["view"] = path.join(__dirname,"../test/node.js/view_QUnit.ejs");
				sender.success(testResult);
			}
		});			
	}
}