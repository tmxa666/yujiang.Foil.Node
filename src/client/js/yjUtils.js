/**
 * @author mustapha.wang
 * @fileOverview
 * @description <pre>■在node.js和浏览器中都可使用。
 * 一些功能函数。此文件在layout.ejs中被引入。</pre>
 * @see module:yjUtils
 */
/**
 * 在browser中引入yjUtils.js文件，直接使用变量yjUtils
 * @global
 * @name browser::yjUtils
 * @type {yjUtils}
 */
/**
 * @exports yjUtils
 * @description <pre>■在node.js和浏览器中都可使用。
 * 一些功能函数。</pre>
 * @example <pre>
 * var yjUtils=yjRequire("yujiang.Foil","yjUtils.js");
 * 或者在browser中引入yjUtils.js文件，直接使用变量yjUtils
 * </pre>
 * @see nodejs::yjRequire
 */
var yjUtils = {
	/**
	 * @description 把Ansi字串转成Byte阵列
	 * @param {string} AAnsiStr 要转化的Ansi字串
	 * @return {array} 返回转换后的Byte阵列
	 */
	ansiStr2ByteArray : function(AAnsiStr) {
		var a = new Array(AAnsiStr.length);
		for ( var i in AAnsiStr) {
			a[i] = AAnsiStr[i].charCodeAt();
		}
		return a;
	},

	/**
	 * 把Byte阵列转成Ansi字串
	 * @param {array} AArray 要转化的Byte阵列
	 * @returns {string} 返回转换后的Ansi字串
	 */
	byteArray2AnsiStr : function(AArray) {
		var s = new Array(AArray.length);
		for ( var i in AArray) {
			s[i] = String.fromCharCode(AArray[i]);
		}
		return s.join('');
	},

	/**
	 * 把Unicode字串转成Byte阵列
	 * @param {string} AUnicodeStr 要转化的Unicode字串
	 * @returns {array} 返回转换后的Byte阵列
	 */
	unicodeStr2ByteArray : function(AUnicodeStr) {
		var bytes = new Array(AUnicodeStr.length * 2);
		for (var i = 0; i < AUnicodeStr.length; i++) {
			var c = AUnicodeStr.charCodeAt(i);
			bytes[i * 2] = (c & 0xFF00) >> 8;
			bytes[i * 2 + 1] = c & 0xFF;
		}
		return bytes;
	},

	/**
	 * 把Byte阵列转成Unicode字串
	 * @param {array} AArray 要转化的Byte阵列
	 * @returns {string} 返回转换后的Unicode字串
	 */
	byteArray2UnicodeStr : function(AArray) {
		var s = new Array(AArray.length / 2);
		var i = 0;
		while (i < AArray.length) {
			var c = (AArray[i] << 8) + AArray[i + 1];
			s[i / 2] = String.fromCharCode(c);
			i = i + 2;
		}
		return s.join('');
	},

	/**
	 * 类似c#方式格式化字串,“{0}已经存在于{1}中，需要继续保存{0}吗？”
	 * @param {string} pattern - 字串模板。格式与c#的format一致，使用{x}来表示一个参数，如：”I am a {0},you are a {1},we not all are {0}.”
	 * @param {any} p0 - 第0个参数值。
	 * @param {any} p1 - 第1个参数值。
	 * @param {any} ...
	 * @param {any} pn - 第n个参数值。
	 * @example <pre>var s0="I am a {0},you are a {1},we not all are {0}.";
	 * var s1=yjUtils.formatStr(s0,"Student","Teacher");
     * equal(s1,"I am a Student,you are a Teacher,we not all are Student.");
     * var s1=yjUtils.formatStr(s0,1,2);
     * equal(s1,"I am a 1,you are a 2,we not all are 1.");</pre> 
	 */
	formatStr : function() {
		if (arguments.length == 0)
			return null;

		var str = arguments[0];
		for (var i = 1; i < arguments.length; i++) {
			var re = new RegExp('\\{' + (i - 1) + '\\}', 'gm');
			str = str.replace(re, arguments[i]);
		}
		return str;
	},
	/**
	 * 以单引号包夹字符串。如sql语句拼接时需要用。
	 * @param {string} str - 要处理的字串。如：ab’c
     * @return {string} - 处理后的字串，如：’ab’’c’
	 */
	quotedStr : function(str) {
		if (str===null || str===undefined || str==="")
			return "''"
		else
			//如果str是一个int，需要用toString先转换
			return "'" + str.toString().replace(/'/g, "''") + "'";
	},

	/**
	 * 去掉字符串中最前面和最后面的字符
	 */
	trim : function(s) {
		var tempStr = s.replace(/\s+$/g, '');
		tempStr = tempStr.replace(/^\s+/g, '');
		return tempStr;
	},
	getComment : function(doc) {
		var isComment = true;
		doc = doc.split('\r\n').filter(function(str) {
			if (isComment) {
				if (str) {
					var s = str.match(/(?:\s\/\/)(.*)/);
					if (s == null) {
						isComment = false;
						return false;
					} else {
						return true;
					}
				} else
					return false;
			} else
				return false;
		}).map(function(str) {
			return str.match(/(?:\s\/\/)(.*)/)[1];
		}).join('\r\n');
		return doc;
	},
	/**
	 * 把object的嵌套的属性平面化
	 * @param {object} obj - 属性要平面化的object，如：{“b1”:{“c1”:“v1”,“c2”:“v2”},“F1”:“a1”}
     * @param {string} [propSplitChar=.] - 字段之间的分隔符。
     * @return {object} - 平面化后的object。如：{“b1.c1”:“v1”,“b1.c2”:“v2”,“F1”:“a1”}
	 */	
	object2Plain:function(obj,propSplitChar){
		var result={};
		propSplitChar=propSplitChar||'.';
		function scan(id,obj2){	
			for(var key in obj2){
				var value=obj2[key];
				var id2=(id=='')?key:id+propSplitChar+key;
				if ((typeof value=='object') && (value.constructor==Object)){
					scan(id2,value);
				}
				else{
					result[id2]=value;
				}
			}
		}
		scan('',obj);
		return result;
	},
	int2Hex:function(prefix,intValue,len,isToUpper){
		var s=intValue.toString(16);
		var len0=s.length;
		for (var i=len0;i<len;i++){
			s="0"+s;
		}
		if (isToUpper==true){
			s=s.toUpperCase();
		}
		return prefix+s;
	},
    /**
     * 在排序的列表中通过二分法查找
     * @param {list} list - 排过序的列表
     * @param {function} compare - 比较函数
     * @return {object} - 返回查找结果，如{isFound:false,index:5}
     */
	findInList:function(list,compare){
		var result = {isFound:false,index:-1}; 
		var left = 0; 
		var right= list.length; 
		
		while(left <= right) 
		{ 
			var center = Math.floor((left+right)/2);
			var compareResult=compare(list[center]);
			if(compareResult== 0) 
			{ 
				result.isFound=true;
				left=center;
				break;
			} 
			if(compareResult ==-1) 
			{ 
				right = center - 1; 
			} 
			else 
			{ 
				left = center + 1; 
			} 
		}
		result.index=left;
		return result;
	},
	/**
	 * 重载回调函数，支持两种回调模式：callback或success+error
	 * @options {object} 被拦截的元件，属性上有回调函数,callback或success+error
	 * @newCallback {function} 新的回调函数，形式为function(err,data,oldCallback,isLogError),oldCallback函数的形式为function(err,data,isLogError) 
	 */
	hookCallback:function hookCallback(options,newCallback){
		var callback_old=options.callback;
		var success_old=options.success;
		var error_old=options.error;
		//提供两种回调模式：callback与success+error模式，虽然两种模式结果一样，但是两种模式不是互相调用（死循环），因此必须把两种模式都hook，
		//因此也要求两种模式不要互相调用，如果callback调用success，hook后会出现如下情况，用户代码被执行2次。
		//callback2->usercode->callback->success2->usercode->success
		if (options.callback){
			options.callback=function(err,data,isLogError){
				newCallback(err,data,callback_old,isLogError);
			}
		}
		function callOld(err,data,isLogError){
			if (err){
        		if (error_old){
        			error_old(err,isLogError);
        		}
    		}
    		else{
    			if (success_old){
        			success_old(data);
        		}
    		}
		}
		if (options.success){
	    	options.success=function(data){
	    		newCallback(null,data,function(err,data,isLogError){		        		
	    			callOld(err,data,isLogError);
	    		},true);
	    	};
		}
		if (options.error){
	    	options.error=function(err,isLog){
	    		newCallback(err,null,function(err,data,isLogError){
	        		callOld(err,data,isLogError);
	    		},isLog);
	    	}
		}
	},
	/**
	 * 处理float小数的加减乘除函数
	 * @author hrh
	 * @Datetime 2019年4月29日
	 */
	floatAdd : function(arg1,arg2){
		var r1,r2,m;
	    try{r1=arg1.toString().split(".")[1].length}catch(e){r1=0};
	    try{r2=arg2.toString().split(".")[1].length}catch(e){r2=0};
	    m=Math.pow(10,Math.max(r1,r2));
	    return (arg1*m+arg2*m)/m;
	},
	floatSubtract : function(arg1,arg2){
		var r1,r2,m,n;
	    try{r1=arg1.toString().split(".")[1].length}catch(e){r1=0};
	    try{r2=arg2.toString().split(".")[1].length}catch(e){r2=0};
	    m=Math.pow(10,Math.max(r1,r2));
	    return (arg1*m-arg2*m)/m;
	},
	floatMultiplication : function(arg1,arg2){
		var m=0,s1=arg1.toString(),s2=arg2.toString();
	    try{m+=s1.split(".")[1].length}catch(e){};
	    try{m+=s2.split(".")[1].length}catch(e){};
	    return Number(s1.replace(".",""))*Number(s2.replace(".",""))/Math.pow(10,m);
	},
	floatDivision : function(arg1,arg2){
		var t1=0,t2=0,r1,r2;
	    try{t1=arg1.toString().split(".")[1].length}catch(e){};
	    try{t2=arg2.toString().split(".")[1].length}catch(e){};

	    r1=Number(arg1.toString().replace(".",""));
        r2=Number(arg2.toString().replace(".",""));
        return yjUtils.floatMultiplication((r1/r2),Math.pow(10,t2-t1));
	}
}

if (typeof module !== 'undefined' && module.exports) {
	// 如果用module.exports = yjUtils;
	// qunit的机制,需要用code:{path:"./source/yjUtils.js",namespace:"yjUtils"}
	// 如果用exports。yjUtils；qunit直接用
	module.exports = yjUtils;
}