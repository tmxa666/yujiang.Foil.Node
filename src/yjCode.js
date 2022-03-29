/**
 * @author mustapha.wang
 * @see module:yjCode
 */
/**
 * @module yjCode
 */
var yjCode={
	minimizeJS:function(str){
		var UglifyJS = require("uglify-js");
		var result= UglifyJS.minify(str, {fromString: true});
		return result.code;
	},
	minimizeHTML:function(str){
		var minifier = require("html-minifier");
		var result= minifier.minify(str,{minifyJS:true});
		return result;
	}
}
module.exports=yjCode;