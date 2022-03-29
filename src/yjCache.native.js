/**
 * @fileOverview
 * 在本地文件夹中保存上传的文件，如果bizServer和webServer要共享，可以使用共享目录
 * @author mustapha.wang
 * @see module:yjCache_native
 */

var path = require("path");
var fs = require("fs");
/**
 * @module yjCache_native
 * @example <pre>
 * var yjCache_native=yjRequire("yujiang.Foil","yjCache.native.js");
 * </pre>
 * @see nodejs::yjRequire
 */
module.exports = {
	/**
	 * 上传一个或多个文件到缓存服务器。
	 * @param {HTTPRequest} req - http请求元件。客户端form中的field可以传递这4个参数：
	 *   ◾isGenerateThumbnail，boolean，是否生成缩略图，预设false
     *   ◾thumbnailWidth，int，缩略图宽度
     *   ◾thumbnailHeight，int，缩略图高度
     *   ◾desDir，string， 自定义的存储目录  路径是相对于 config中配置的global.yjGlobal.config.cache.connection.defaultDir 计算
     * 宽度和高度只传递一个时，另外一个按比例缩放。如果两个都不传，预设是宽度64。
	 * @param {callback_success} success - 成功后要调用的函数。
	 * 返回的data格式如：<pre>
     * {
     *     fields:{
     *         "UserID":"abc",
     *         "UserName":"爱德华"
     *     },
     *     files:{
     *         "headerPic":[{
     *             status:"success",
     *             fileRawName:"abc.png",
     *             key:"e9f2daec-a8a6-2df0-26f6-0a0539c2b34d.png",
     *             thumbnailKey:"e9f2daec-a8a6-2df0-26f6-0a0539c2b34d_thumbnail.png"}
     *         }],
     *         "familyPic":[{
     *             status:"failed",
     *             fileRawName:"family.png",
     *             key:"edsds33d-a8df-2d2c-2g56-0a0s89c2l64d.png",
     *             thumbnailKey:"edsds33d-a8df-2d2c-2g56-0a0s89c2l64d_thumbnail.png",
     *             errorMsg:"not enought momery"}
     *         }]
     *     }
     * }</pre>
     * @param {callback_error} error - 失败后要调用的函数。
	 */
	upload : function(req, success, error) {
		// var formidable = require("formidable");
		// form.uploadDir = global.yjGlobal.config.cache.connection.dir;
		// form.keepExtensions = true;
		// form.multiples = true;
		var multiparty = require('multiparty');
		var form = new multiparty.Form({
			uploadDir : global.yjGlobal.config.cache.connection.dir
		});
		form.parse(req, function(err, fields, files) {
			// 这里会在redis传送还未完成时执行
			if (err) {
				error(err);
				return;
			}
			//multiparty的fields格式为：{ userID: [ 'ABC' ], userName: [ 'wxh中国' ] }
			//formidable的fields格式为：{ userID: 'ABC', userName: 'wxh中国' }
			//最早使用的是formidable模组，因为它的1.2.1版本还是不能抓住目录不存在等错误，换成multiparty模组，
			//fields统一成formidable的格式
			for(var name in fields){
				if (fields[name].length==1){
					fields[name]=fields[name][0];
				}
			}
			var fileList=[];
			var files2 = {};
			//  自定义上传的
			desDir=fields.desDir;
			for (var name in files) {				
				var file = files[name];
				var file2 = [];
				function pushFile(f){
					//multiparty是f.originalFilename,formidable是f.name
					var decodeName=decodeURI(f.name || f.originalFilename);
					var f2={
						status:"success",
						fileRawName:decodeName,
						key:path.basename(f.path),
						temp_path:f.path
					}
					if(desDir){
							if(!global.yjGlobal.config.cache.connection.dir){
								throw new Error("you must set dir parameter in config");
							}
					    	// 原文件路径
						    var srcPath = f.path;
						    // 目标文件路径
						    var destPath =path.join(global.yjGlobal.config.cache.connection.dir,desDir+"/"+path.basename(f.path));
						    var readableStream = fs.createReadStream(srcPath);
						    var writeableStream = fs.createWriteStream(destPath);
						    // 可以通过使用可读流的函数pipe()接入到可写流中
						    // pipe()是一种很高效的数据处理方式
						    if (readableStream.pipe(writeableStream)) {
						        f2.temp_path=destPath;
						        fs.unlink(srcPath, function(err){
								  if (err) throw err;
								});
						    } else {
						    	// 复制文件失败 此时应该处理异常 
						    	throw new Error("upload error");
						    }
					}
					file2.push(f2);
					fileList.push(f2);
				}
				if (Object.prototype.toString.call(file) === '[object Array]'){
					for (var i=0;i<file.length;i++){
						pushFile(file[i]);
					}
				}
				else{
					//即使multiples为true时，如果只有一个文件，file不会是数组
					//为了客户端访问方便，统一为数组
					pushFile(file);
				}
				files2[name] = file2;
			}
			
			function callSuccess(){
				fileList.forEach(function(f){
					delete f.temp_path;
				});
				success({
					fields : fields,
					files : files2
				});
			}
			
			if (fields.isGenerateThumbnail==='true'||fields.isGenerateThumbnail===true){
				var sharp=require('sharp');
				var width=fields.thumbnailWidth?parseInt(fields.thumbnailWidth):null;
				var height=fields.thumbnailHeight?parseInt(fields.thumbnailHeight):null;
				if (!width && !height){
					width=64;
				}
				var async=require('async');
				async.eachSeries(fileList,function(f,callback){
					var pathObj=path.parse(f.temp_path);
					pathObj.name=pathObj.name+'_thumbnail';
					pathObj.base=null;
					var thumbnail=path.format(pathObj);
					sharp(f.temp_path).resize(width,height).toFile(thumbnail,function(err,info){
						if (err){
							f.status="failed";
							f.errorMsg=err.message;
						}
						else{
							f.thumbnailKey=path.basename(thumbnail);
						}
						callback(null);
					});
				},function(err){
					if (err){
						error(err);
						return;
					}
					callSuccess();
				});
			}
			else{
				callSuccess();
			}
		});
	},
	/**
	 * 从缓存服务器下载文件。
	 * @param {string} key - 需要下载的文件的key，如："e9f2daec-a8a6-2df0-26f6-0a0539c2b34d.png"
	 * @param {HTTPResponse} res - http响应元件，下载的文件会分段写到res，因此success函数中不需要再对res操作。
	 * @param {callback_success} success
	 * @param {callback_error} error
	 * @return {void}
	 */
	download : function(req, res, success, error) {
		//如果用res.sendFile，遇到大文件，如105M的mp4文件，会报ECANCELED错误。
		var key=req.params.key;
		var dir=req.params.dir?path.join(global.yjGlobal.config.cache.connection.dir,req.params.dir):global.yjGlobal.config.cache.connection.dir;
		var fileName = path.join(dir, key);

		const src = fs.createReadStream(fileName);
		src.on("error",function(err){
			if (error) {
				error(err,true);
			}
		});
		src.on("end",function(){
			if (success) {
				success();
			}
		});
		src.pipe(res);
	},
	/**
	 * 从缓存服务器删除一个文件。
	 * @param {string} key - 需要删除的文件的key，如："e9f2daec-a8a6-2df0-26f6-0a0539c2b34d.png"
	 * @param {callback_success} success
	 * @param {callback_error} error
	 * @return {void}
	 */
	"delete" : function(req, success, error) {
		var key=req.params.key;
		var dir=req.params.dir?path.join(global.yjGlobal.config.cache.connection.dir,req.params.dir):global.yjGlobal.config.cache.connection.dir;
		var fileName = path.join(dir, key);
		fs.unlink(fileName, function(err) {
			if (err) {
				if (error) {
					error(err);
				}
			} else {
				if (success) {
					success();
				}
			}
		});
	},
	/**
	 * 保存一个资料到缓存服务器
	 * @param {string} key - 要保存的资料的key，如："e9f2daec-a8a6-2df0-26f6-0a0539c2b34d.png"，一定要是合法的文件名
	 * @param {string} value - 要保存的资料
	 * @param {callback_success} success
	 * @param {callback_error} error
	 * @return {void}
	 */
	write:function(key,value,success,error){
		var fileName = path.join(global.yjGlobal.config.cache.connection.dir, key);
		fs.writeFile(fileName,value,function(err){
			if (err){
				if (error) {
					error(err);
				}
			} else {
				if (success) {
					success();
				}			
			}
		});
	},
	/**
	 * 从缓存服务器读取一个资料
	 * @param {string} key - 要读取的资料的key，如："e9f2daec-a8a6-2df0-26f6-0a0539c2b34d.png"
	 * @param {callback_success} success
	 * @param {callback_error} error
	 * @return {void}
	 */
	read:function(key,success,error){
		var fileName = path.join(global.yjGlobal.config.cache.connection.dir, key);
		fs.readFile(fileName, {encoding:"utf8"},function(err,data) {
			if (err) {
				if (error) {
					error(err);
				}
			} else {
				if (success) {					
					success(data);
				}
			}
		});
	}
}