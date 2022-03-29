/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjCache_redis_upload
 */

/**
 * <pre>上传文件到webserver或bizserver，再上传到文件缓存服务器，如redis
 * 向redis传时，如果一个文件一次传，文件是先放webserver内存，要求内存大；如果多个文件向redis一起传，webserver内存要求更大
 * 要注意本函数与向redis传递的函数，谁先完成，是本函数先完成</pre>
 * @module yjCache_redis_upload
 * @example <pre>
 * var yjCache_redis_upload=yjRequire("yujiang.Foil","yjCache.redis.upload.js");
 * </pre>
 * @see nodejs::yjRequire
 * @param {HTTPRequest} req http请求对象
 * @param {callback_success} success
 * @param {callback_error} error
 */
module.exports = function(req,success,error) {
	// console.log(sender.req.headers);
	var formidable = require("formidable");
	var form = new formidable.IncomingForm();
	//form.encoding = 'utf-8';
	form.keepExtensions = true;
	form.multiples = true;
	
	var yjRedis = require("./yjRedis.js");

	function save(fields,files) {
			if (fields.isGenerateThumbnail=='true'){
				var sharp=require('sharp');
				var width=fields.thumbnailWidth?parseInt(fields.thumbnailWidth):null;
				var height=fields.thumbnailHeight?parseInt(fields.thumbnailHeight):null;
				if (!width && !height){
					width=64;
				}
			}
			var fileReals=[];
			for (var name in files) {
				var file=files[name];
				if (Object.prototype.toString.call(file) === '[object Array]'){
					file.forEach(function(f){
						fileReals.push(f);
					});
				}
				else{
					files[name]=[file];//统一为数组,方便客户端处理
					fileReals.push(file);
				}
			}
			var async=require('async');
			async.eachSeries(fileReals,function(file,callback){				
				var uuid = require("uuid/v1");				
				var path = require("path");
				var key=uuid();
				var ext = path.extname(file.fileRawName);
				file.key = key+ext;
				file.status = "success";
				
				function rollback(){
					var keys=[file.key];
					if (file.thumbnailKey){
						keys.push(file.thumbnailKey);
					}           
					keys.forEach(function(key){
						yjRedis.exec({
							work:function(client,cb){
								client.del(key,cb);
							},
							success : function(data) {
								console.log("delete file from redis: " + data);
							},
							error : function(err) {
								console.log("delete file from redis error:" + err.message);
							}
						});
					})
				}
				
				yjRedis.multi({
					success : function(data) {
						if (file.status == "failed"){
							rollback();
						}
						callback(null);
					},
					error : function(err) {						
						file.status = "failed";
						file.errorMsg = err.message;
						rollback();
						callback(null);
					},
					work : function(client,multi,exec) {
						var chunks=[];
						file.temp_chunks.forEach(function(buf){	
							chunks.push({key:file.key,buf:buf});
						});
						function saveChunks(){
							chunks.forEach(function(chunk){							
								var value = chunk.buf.toString("base64");
								multi.rpush(chunk.key, value, function(err,replies){
									if (err){
										//redis的multi批处理，如果一个失败，后面一个还会继续处理吗？
										file.status = "failed";
										file.errorMsg = err.message;
										//不要每个chunk撤销一次，最后到success中检查status状态决定是否撤销
									}
								});
							});
							exec();
						}
						
						if (fields.isGenerateThumbnail=='true'){
							//把图片的片段拼接成一个完整的buffer，生成缩略图							
							var buf=Buffer.concat(file.temp_chunks);
							sharp(buf).resize(width,height).toBuffer(function(err,thumbnailBuf){
								if (err){
									file.status = "failed";
									file.errorMsg = err.message;
									callback(null);
									return;
								}
								var thumbnailKey=key+'_thumbnail'+ext;
								file.thumbnailKey=thumbnailKey;
								//把缩略图bug放入chunks中
								chunks.push({key:file.thumbnailKey,buf:thumbnailBuf});
								saveChunks();
							});
						}
						else{
							saveChunks();
						}						
					}
				});
			},function(err){
				if (err) {
					if (error) error(err);
				} else {
					//删除临时的属性
					fileReals.forEach(function(partFile){
						delete partFile.temp_chunks;
					});
					
					if (success) success({
						fields:fields,
						files:files
					});				
				}
			});
	}
	//重载onPart方法，不写入到文件，在内存中处理
	form.onPart = function(part) {	
		if (!part.filename) {
			//不是文件，调用预设的处理方法
			form.handlePart(part);
			return;
		}
		var file = {
			status : "success",
			fileRawName : part.filename,
			temp_chunks:[]
		}
		part.addListener('data', function(data) {
			file.temp_chunks.push(data);
		});
		part.addListener('end', function() {
			form.emit('file',part.name,file);
		});
	}
	form.parse(req, function(err, fields                                      , files) {
		if (err){
			error(err);
			return;
		}
		//即使multiples为true时，如果只有一个文件，files['xx']返回的不会是数组
		save(fields, files);
	});
}