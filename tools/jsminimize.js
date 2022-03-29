if (process.argv.length < 3)
	throw "need a third parameter as a to be minimize file name in command line.";

var compressor = require('yuicompressor');
var fileRaw= process.argv[2];
fileRaw.replace(/\\/g,"/");
var fs=require("fs");
var path=require("path");
var files=[];
var fileIndex=0;
if (fs.lstatSync(fileRaw).isDirectory()){
	var dirRoot=fileRaw;
	var yjDirectory=require("../src/yjDirectory.js");
	files=yjDirectory.scanFiles(dirRoot);
	if (files.length>0){
		fileIndex=0;
		//一个一个执行，因为是异步，全部一起执行，会报错：java heap xxx
		minimizeOneFile(files[0].fullName);
	}
}
else{
	minimizeOneFile(fileRaw);
}

function minimizeOneFile(fileRaw){
	console.log(fileRaw);
	var ext = path.extname(fileRaw);			
	var fileNew=fileRaw.substr(0,fileRaw.length-ext.length);
	fileNew=fileNew+".min"+ext;
	if (fs.existsSync(fileNew)){
		console.log(fileNew+",alreay exists.canceled.");
		return false;
	}
	compressor.compress(fileRaw, {
	    charset: 'utf8',
	    //type: 'js',
	    nomunge: true,
	    'line-break': 800
	}, function(err, data, extra) {
		if (err){
			console.log(fileRaw+","+err.message);
			console.log(extra);
		}
		else{						
			console.log(fileNew);			
			var fd = fs.openSync(fileNew, "w");
			fs.writeSync(fd, data);
			fs.closeSync(fd);
		}
		fileIndex++;
		if (fileIndex<files.length){
			minimizeOneFile(files[fileIndex].fullName);
		}		
	});
}