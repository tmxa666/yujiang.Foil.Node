/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjDirectory
 */
/**
 * @exports yjDirectory
 * @example <pre>
 * var yjDirectory=yjRequire("yujiang.Foil","yjDirectory.js");
 * </pre>
 * @see nodejs::yjRequire
*/
module.exports = {
	/**
	 * 扫描文件夹，找出其中的文件。递归时，深度优先。
	 * @param {string} dirRoot 要扫描的根路径
	 * @param {object} option
	 * @param {boolean} [option.isSort=false] 结果是否排序
	 * @param {boolean} [option.isRecursive=true] 是否递归扫描子目录
	 * @param {function} [option.foundFile] 找到文件时的回调函数：function(fullFileName,fileName,parentDir)
	 * @param {function} [option.foundDir] 找到目录时的回调函数：function(fullDirName,dirName,parentDir)
	 * @param {function} [option.scanedDirSelf] 扫描完一个目录后（不包含子目录）的回调函数：function(dir,files)，files为Object数组，Object结构为：{fullName:xxx,partName:xxx}
	 * @return {object[]} 找到的文件，Object数组，Object结构为：{fullName:xxx,partName:xxx}
	 */
	scanFiles : function(dirRoot, option) {
		var merge = require("merge");

		option = merge({
			isSort : false,
			isRecursive : true,
			foundFile : null,
			foundDir : null,
			scanedDirSelf : null  //扫描完成一个目录，返回这个目录下的文件，不包含子目录
		}, option);

		var fs = require("fs");
		var path = require('path');

		function scanOne(dir) {
			var results = new Array();
			var files = fs.readdirSync(dir);
			if (option.isSort)
				files = files.sort();

			files.forEach(function(file) {
				var fullName = path.join(dir, file);
				if (fs.lstatSync(fullName).isDirectory()) {
					if (option.foundDir)
						option.foundDir(fullName, file, dir);
					if (option.isRecursive)
						//只返回本目录的文件，不要子目录的results.concat(
						scanOne(fullName);
				} else {
					results.push({
						fullName : fullName,
						partName : file
					});
					if (option.foundFile)
						option.foundFile(fullName, file, dir);
				}
			});
			//只返回本目录的文件，不要子目录的
			if (option.scanedDirSelf)
				option.scanedDirSelf(dir, results);
			return results;
		}

		return scanOne(dirRoot);
	}
}