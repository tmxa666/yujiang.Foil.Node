/**
 * @author mustapha.wang
 * @fileOverview
 * @description <pre>■在node.js和浏览器中都可使用。
 * 处理日期相关内容。此文件在layout.ejs中被引入。
 * 注意：
 * （1）node.js的JSON.stringify()会把时间当成本地时间，然后转成世界时间格式：2014-11-04T11:07:07.198Z
 * </pre>
 * @see module:yjDateTime
*/

/**
 * 在某些浏览器中,如firefox，直接使用if (module && module.exports)判断会直接引起例外错误。
 */ 
if (typeof module!="undefined" && module.exports) {	
	var moment = require("moment");
}

/**
 * @exports yjDateTime
 * @description <pre>■在node.js和浏览器中都可使用。
 * 处理日期相关内容。</pre>
 * @example <pre>
 * var yjDateTime=yjRequire("yujiang.Foil","yjDateTime.js");
 * 或者在browser中引入yjDateTime.js文件，直接使用变量yjDateTime
 * </pre>
 * @see nodejs::yjRequire
 */
var yjDateTime = {
	/**
	 * <pre>解析一个字串为Date类型的时间。 
	 * Date对象本身不能表明自己是哪个时区的时间，Javascript当成本地时间。 
	 * 字串能表明自己是哪个时区的时间，如：
	 *  ■ “2014-02-03 04:05:06 Z”：世界时间（0时区）
	 *  ■ “2014-02-03 04:05:06 +00:00”：世界时间（0时区）
	 *  ■ “2014-02-03 04:05:06 GMT”：格林威治时间，可以等同于世界时间
	 *  ■ “2014-02-03 04:05:06 +08:00”：东8区的本地时间
	 * 但是，字串“2014-02-03 04:05:06”就没有表明自己是哪个时区的时间。</pre>
	 * @param {string} str 日期字串，如：2013-15-05 12:23:34
	 * @param {string} pattern 解析格式，如：YYYY-MM-DD HH:mm:ss
	 * @param {boolean} isFromUTC=false str是否是世界时间。如果str不能表明str是哪个时区，isFromUTC才有效
	 * @return {date} 解析结果
	 * @example <pre>举例（本地时区为东8区）：<code>
	 * str                             pattern                 isFromUTC   [result]
	 * “2014-02-03 04:05:06”                                               2014-02-03 04:05:06 +08:00
	 * “2014-02-03 04:05:06”                                   true        2014-02-03 12:05:06 +08:00
	 * “2014-02-03 04:05:06 Z”                                             2014-02-03 12:05:06 +08:00
	 * “2014-02-03 04:05:06 GMT”                                           2014-02-03 12:05:06 +08:00
	 * “2014-02-03 04:05:06 +08:00”                                        2014-02-03 04:05:06 +08:00
	 * “2014-02-03 04:05:06”           “YYYY-MM-DD”                        2014-02-03 00:00:00 +08:00
	 * “2014-02-03 04:05:06”           “YYYY-MM-DD HH:mm:ss”               2014-02-03 04:05:06 +08:00
	 * “2014-02-03 04:05:06”           “YYYY-MM-DD HH:mm:ss Z”             2014-02-03 12:05:06 +08:00
	 * “2014-02-03 04:05:06 +08:00”    “YYYY-MM-DD HH:mm:ss Z”             2014-02-03 04:05:06 +08:00
	 * “2014-02-03 04:05:06”           “YYYY-MM-DD HH:mm:ss”   true        2014-02-03 12:05:06 +08:00
	 * </code></pre>
	 */
	parse : function(str, pattern, isFromUTC) {
		if (!str) return null;
		if (isFromUTC==true){
			var md=moment.utc(str, pattern);
			return md._d;
		}
		else{
			var md=moment(str, pattern);
			return md._d;
		}
	},
	/**
	 * 格式化一个日期或字串为字串。
	 * @param {date|string} dateOrString - Date类型，当成本地时间；日期字串，如：2013-15-05 12:23:34
	 * @param {string} toPattern=“YYYY-MM-DDTHH:mm:ssZ” - 转化格式，如：YYYY-MM-DD HH:mm:ss
	 * @param {boolean} isToUTC=false - 是否转为世界时间
	 * @return {string}
	 * @example <pre>举例（本地时区为东8区）：<code>
	 * dateOrString                 toPattern               isToUTC [result]
	 * 2014-02-03 04:05:06 +08:00                                   “2014-02-03T04:05:06+08:00”
	 * 2014-02-03 04:05:06 +08:00                           true    “2014-02-02T20:05:06+00:00”
	 * 2014-02-03 04:05:06 +08:00   “YYYY-MM-DD HH:mm:ss”           “2014-02-03 04:05:06”
	 * 2014-02-03 04:05:06 +08:00   “YYYY-MM-DD HH:mm:ss”   true    “2014-02-02 20:05:06”
	 * 2014-02-03 04:05:06 +08:00   “YYYY-MM-DD HH:mm:ss Z”         “2014-02-03 04:05:06 +08:00”
	 * 2014-02-03 04:05:06 +08:00   “YYYY-MM-DD HH:mm:ss Z” true    “2014-02-02 20:05:06 +00:00”
	 * “2014-02-03 04:05:06”        “YYYY-MM-DD HH:mm:ss Z”         “2014-02-03 04:05:06 +08:00”
	 * “2014-02-03 04:05:06”        “YYYY-MM-DD HH:mm:ss Z” true    “2014-02-02 20:05:06 +00:00”
	 * “2014-02-03 04:05:06 Z”      “YYYY-MM-DD HH:mm:ss Z”         “2014-02-03 12:05:06 +08:00”
	 * “2014-02-03 04:05:06 Z”      “YYYY-MM-DD HH:mm:ss Z” true    “2014-02-03 04:05:06 +00:00”
	 * “2014-02-03 04:05:06 +02:00” “YYYY-MM-DD HH:mm:ss Z”         “2014-02-03 10:05:06 +08:00”
	 * “2014-02-03 04:05:06 +02:00” “YYYY-MM-DD HH:mm:ss Z” true    “2014-02-03 02:05:06 +00:00”
	 * </code></pre>
	 */
	format : function(dateOrString,toPattern,isToUTC){
		if (dateOrString==null){
			return "";
		}
		if (isToUTC==true){
			return moment.utc(dateOrString).format(toPattern);
		}
		else{
			return moment(dateOrString).format(toPattern);
		}
	},
	/**
	 * 格式化一个日期或字串为字串。
	 * @param {date|string} dateOrString - Date类型，当成本地时间；日期字串，如：2013-15-05 12:23:34
	 * @param {string} fromPattern=“YYYY-MM-DDTHH:mm:ssZ” - dateOrString参数为string时，它的格式，如：YYYY-MM-DD HH:mm:ss
	 * @param {boolean} isFromUTC=false - 如果dateOrString和fromPattern都无法判断时区，isFromUTC生效。
	 * @param {string} toPattern=“YYYY-MM-DDTHH:mm:ssZ” - 转化的格式
	 * @param {boolean} isToUTC=false - 是否转为世界时间
	 * @return {string}
	 */
	formatAny : function(dateOrString, fromPattern, isFromUTC, toPattern, isToUTC) {
		if (dateOrString==null){
			return "";
		}
		var md=null;
		if (isFromUTC==true){
			md= moment.utc(dateOrString,fromPattern);
		}
		else{
			md= moment(dateOrString,fromPattern);
		}
		if (isToUTC==true){
			return md.format(toPattern);
		}
		else{
			return md.local().format(toPattern);
		}
	},
	/**
	 * 把一个时间当成世界时间，按本机时区转成本地时间。
	 * @param {date} date - 日期，如：2013-15-05 12:23:34
	 * @return {date}
	 */
	toLocal:function(date){
		return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
	},
	/**
	 * 把一个日期当成本地时间，按本机时区转成世界时间。
	 * @param {date} date - 日期，如：2013-15-05 12:23:34
	 * @return {date}
	 */
	toUTC:function(date){
		return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
	},
	/**
	 * 把一个本地时间转成utc时间戳
	 */
	toUTCTimestamp:function(date){
		return date.getTime() + date.getTimezoneOffset() * 60000;
	},
	/**
	 * <pre>有两个地方使用到：
	 * 1.推送初始资料时，按当前时间，用scope计算整体区间[B,E)的B；并按当前时间，用dataPointInterval计算实际区间[B,C)的C
	 * 2.推送实时资料时，按当前时间，用dataPointInterval计算新的区间[L,C)的C，要求这个区间的时间都已经过去，即资料都应该成为了历史，所以可以查询推送出去了。L指上一次查询区间的量子化结束时间。
	 * </pre>
	 * @param {int} ts 要量子化的时间戳
	 * @param {int} value 量子化间隔
	 * @param {string} unit 量子化单位：Y,M,D,h,m,s,ms
	 * @param {int} destTimeZone 目标时区，单位：毫秒
	 * @return {int} <pre>返回量子化的时间戳。
	 * ts              value   unit    B               [B,E)
	 * 06-12 00:03     1       D       06-12 00:00     [06-12 00:00,06-13:00)
	 * 06-12 01:03     1       D       06-12 00:00     [06-12 00:00,06-13:00)
	 * 
	 * 假设dataPointInterval是{value:2,unit:'h'}，即2小时，查询区间[L,C)序列应该是：[00:00,02:00,04:00,06:00,08:00...22:00,00:00)
	 * ts              value  unit   C                    [L,C)                     映射      公式
	 * 06-12 00:03     1      h      06-12 00:00:00.000   [06-12 00,06-12 00)重叠无效 0->0     floor(h/value)*value
	 * 06-12 01:03     1      h      06-12 01:00:00.000   [06-12 00,06-12 01)       1->1
	 * 06-12 02:03     1      h      06-12 02:00:00.000   [06-12 01,06-12 02)       2->2
	 *                                                    
	 * 06-12 00:03     2      h      06-12 00:00:00.000   [06-12 00,06-12 00)重叠无效	0->0    floor(h/value)*value
	 * 06-12 01:03     2      h      06-12 00:00:00.000   [06-12 00,06-12 00)重叠无效	1->0
	 * 06-12 02:03     2      h      06-12 02:00:00.000   [06-12 00,06-12 02)       2->2
	 * 06-12 03:03     2      h      06-12 02:00:00.000   [06-12 00,06-12 02)       3->2
	 * 06-12 04:03     2      h      06-12 04:00:00.000   [06-12 02,06-12 04)       4->4
	 *                                                    
	 * 06-01 01:03     1      D      06-01 00:00:00.000   [06-01,06-01)重叠无效       1->1     1+floor((D-1)/value)*value
	 * 06-02 01:03     1      D      06-02 00:00:00.000   [06-01,06-02)             2->2
	 * 06-03 01:03     1      D      06-03 00:00:00.000   [06-02,06-03)             3->3
	 *                                                    
	 * 06-01 01:03     2      D      06-01 00:00:00.000   [06-01,06-01)重叠无效       1->1     1+floor((D-1)/value)*value
	 * 06-02 01:03     2      D      06-01 00:00:00.000   [06-01,06-01)重叠无效       2->1
	 * 06-03 01:03     2      D      06-03 00:00:00.000   [06-01,06-03)             3->3
	 * 06-04 01:03     2      D      06-03 00:00:00.000   [06-01,06-03)             4->3
	 * 06-05 01:03     2      D      06-05 00:00:00.000   [06-03,06-05)             5->5
	 *                                                    
	 * 06-01 01:03     3      D      06-01 00:00:00.000   [06-01,06-01)重叠无效       1->1     1+floor((D-1)/value)*value
	 * 06-02 01:03     3      D      06-01 00:00:00.000   [06-01,06-01)重叠无效       2->1
	 * 06-03 01:03     3      D      06-01 00:00:00.000   [06-01,06-01)重叠无效       3->1
	 * 06-04 01:03     3      D      06-04 00:00:00.000   [06-01,06-04)             4->4
	 * 06-05 01:03     3      D      06-04 00:00:00.000   [06-01,06-04)             5->4
	 * </pre>
	 */
	quantumTimestampToZone:function(ts,value,unit,destTimeZone){
		ts=ts+new Date().getTimezoneOffset()*60000-destTimeZone;
		var now=new Date(ts);
		var n=null;
		switch (unit){
			case 'Y':
				var Y=now.getFullYear();
				Y=Math.floor(Y/value)*value;
				n= new Date(Y,0,1).getTime();
				break;
			case 'M':
				var M=now.getMonth();
				M=Math.floor(M/value)*value;
				now.setMonth(M);
				now.setDate(1);
				now.setHours(0,0,0,0);
				n=now.getTime();
				break;
			case 'D':
				var D=now.getDate();
				/**
				 * 注意：日是从1开始。按公式，先减一天，再加一天，数字应该不会超过这个月的总天数。
				 * @ignore
				 */
				D=1+Math.floor((D-1)/value)*value;
				now.setDate(D);
				now.setHours(0,0,0,0);
				n=now.getTime();
				break;
			case 'h':
				var h=now.getHours();
				h=Math.floor(h/value)*value;
				now.setHours(h,0,0,0);
				n=now.getTime();
				break;
			case 'm':
				var m=now.getMinutes();
				m=Math.floor(m/value)*value;
				now.setMinutes(m,0,0);
				n=now.getTime();
				break;
			case 's':
				var s=now.getSeconds();
				s=Math.floor(s/value)*value;
				now.setSeconds(s,0);
				n=now.getTime();
				break;
			case 'ms':
				var ms=now.getMilliseconds();
				ms=Math.floor(ms/value)*value;
				now.setMilliseconds(ms);
				n=now.getTime();
				break;
			default:
				console.log('Unknown unit:'+unit);
				return null;
		}
		n=n-now.getTimezoneOffset()*60000+destTimeZone;
		return n;
	},
	/**
	 * <pre>根据ts量子化时间，获得下一个量子化的时间。查询区间每次交替：[B,E1),[E1,E2),[E2,E3)...
	 * 本函数是根据B获取E1，根据E1获取E2，根据E2获取E3...</pre>
	 * @param {int} ts 当前量子化时间
	 * @param {int} value 量子化值
	 * @param {int} unit 量子化单位：Y,M,D,h,m,s,ms
	 * @param {int} destTimeZone 目标时区，单位：毫秒
	 */
	getNextQuantumTimestamp:function(ts,value,unit,destTimeZone){
		switch(unit){
			case 'Y':
				/**
				 * 每年天数不一样，所以不能简单用除法
				 * @ignore
				 */
				ts=ts+new Date().getTimezoneOffset()*60000-destTimeZone;
				var now=new Date(ts);
				var Y=now.getFullYear();
				Y=Y+value;
				return new Date(Y,0,1).getTime()-now.getTimezoneOffset()*60000+destTimeZone;
			case 'M':
				/**
				 * 每月天数不一样，所以不能简单用除法，
				 * @ignore
				 */
				ts=ts+new Date().getTimezoneOffset()*60000-destTimeZone;
				var now=new Date(ts);
				var Y=now.getFullYear();
				var M=now.getMonth();
				M=M+value;
				if (M>11){
					M=M-12;
					Y=Y+1;
				}
				return new Date(Y,M,1).getTime()-now.getTimezoneOffset()*60000+destTimeZone;
			case 'D':
				return ts+24*60*60*1000*value;
			case 'h':
				return ts+60*60*1000*value;
			case 'm':
				return ts+60*1000*value;
			case 's':
				return ts+1000*value;
			case 'ms':
				return ts+1*value;
			default:
				console.log('Unknown unit:'+unit);
				return null;
		}
	},
	/**
     * 根据ts量子化时间，获得上一个量子化的时间。
     * @param {int} ts 当前量子化时间
     * @param {int} value 量子化值
     * @param {int} unit 量子化单位：Y,M,D,h,m,s,ms
     * @param {int} destTimeZone 目标时区，单位：毫秒
	 */
	getPriorQuantumTimestamp:function(ts,value,unit,destTimeZone){
		switch(unit){
			case 'Y':
				/**
				 * 每年天数不一样，所以不能简单用除法
				 * @ignore
				 */
				ts=ts+new Date().getTimezoneOffset()*60000-destTimeZone;
				var now=new Date(ts);
				var Y=now.getFullYear();
				Y=Y-value;
				return new Date(Y,0,1).getTime()-now.getTimezoneOffset()*60000+destTimeZone;
			case 'M':
				/**
				 * 每月天数不一样，所以不能简单用除法。javascript的月从0开始。
				 * @ignore
				 */
				ts=ts+new Date().getTimezoneOffset()*60000-destTimeZone;
				var now=new Date(ts);
				var Y=now.getFullYear();
				var M=now.getMonth();
				M=M-value;
				if (M<0){
					M=M+12;
					Y=Y-1;
				}
				return new Date(Y,M,1).getTime()-now.getTimezoneOffset()*60000+destTimeZone;
			case 'D':
				return ts-24*60*60*1000*value;
			case 'h':
				return ts-60*60*1000*value;
			case 'm':
				return ts-60*1000*value;
			case 's':
				return ts-1000*value;
			case 'ms':
				return ts-1*value;
			default:
				console.log('Unknown unit:'+unit);
				return null;
		}
	},
    /**
     * <pre>调整查询左闭点（等于的点）的量子化时间在x轴上的显示位置。
     * 时分秒是从0开始的，点的显示从1开始。
	 * </pre>
	 * @param {int} x 本地时间戳
	 * @param {string} unit 量子化的单位：Y,M,D,h,m,s,ms
	 * @param {int} destTimeZone 目标时区
	 * @return {int}
	 * @example
	 * <pre>
     * x                    unit    return                  x-label
     * 2017-06-24 13:12:00  s       2017-06-24 13:12:01     2017-06-24 13:12:01
     * 2017-06-24 13:12:00  m       2017-06-24 13:13:00     2017-06-24 13:13
     * 2017-06-24 13:00:00  h       2017-06-24 14:00:00     2017-06-24 14
     * 2017-06-24 00:00:00  D       2017-06-24 00:00:00     2017-06-24
     * 2017-06-01 00:00:00  M       2017-06-01 00:00:00     2017-06
     * 2017-01-01 00:00:00  Y       2017-01-01 00:00:00     2017
	 * </pre>
     */
	adjustNextQuantumTimestamp:function(x,unit,destTimeZone){
		if (unit=='h' || unit=='m' || unit=='s' || unit=='ms'){
			x=yjDateTime.getNextQuantumTimestamp(x,1,unit,destTimeZone);
		}
		return x;
	},
	/**
	 * <pre>调整查询右开点（小于的点）的量子化时间在x轴上的显示位置。
	 * 因为年月日显示时是从1开始的，如2017-06-12，显示在2017-06-11位置。</pre>
     * @param {int} x 时间戳
     * @param {string} unit 量子化的单位：Y,M,D,h,m,s,ms
     * @param {int} destTimeZone 目标时区	 
     * @return {int}
     * @example
     * <pre>
     * x                    unit    return                  x-label
     * 2017-06-24 13:12:00  s       2017-06-24 13:12:00     2017-06-24 13:12:00
     * 2017-06-24 13:12:00  m       2017-06-24 13:12:00     2017-06-24 13:12
     * 2017-06-24 13:00:00  h       2017-06-24 13:00:00     2017-06-24 13
     * 2017-06-24 00:00:00  D       2017-06-23 00:00:00     2017-06-23
     * 2017-06-01 00:00:00  M       2017-05-01 00:00:00     2017-05
     * 2017-01-01 00:00:00  Y       2016-01-01 00:00:00     2016
     * </pre>     
     */
	adjustPriorQuantumTimestamp:function(x,unit,destTimeZone){
		if (unit=='Y' || unit=='M' || unit=='D'){
			x=yjDateTime.getPriorQuantumTimestamp(x,1,unit,destTimeZone);
		}
		return x;
	},
	/**
	 * 产生区间[fromTimestamp,toTimestamp)内的数据点
	 * @param {int} fromTimestamp 区间左闭点
	 * @param {int} toTimestamp 区间右开点
     * @param {int} value 量子化值
     * @param {int} unit 量子化单位：Y,M,D,h,m,s,ms
     * @param {int} destTimeZone 目标时区，单位：毫秒
	 */
	generateQuantumTimestamps:function(fromTimestamp,toTimestamp,value,unit,destTimeZone){
        var data=[];
        while (fromTimestamp<toTimestamp){
            //console.log('x1:'+yjDateTime.format(new Date(fromTimestamp),'YYYY-MM-DD HH:mm:ss'));
            var x=yjDateTime.adjustNextQuantumTimestamp(fromTimestamp,unit,destTimeZone);
            //console.log('x2:'+yjDateTime.format(new Date(x),'YYYY-MM-DD HH:mm:ss'));
            data.push([x,null]);
            fromTimestamp=yjDateTime.getNextQuantumTimestamp(fromTimestamp,value,unit,destTimeZone);
        }
        return data;
    }
}
if (typeof module!="undefined" && module.exports) {
	module.exports = yjDateTime;
}
/**
 * 在browser中引入yjDateTime.js文件，直接使用变量yjDateTime
 * @global
 * @name browser::yjDateTime
 * @type {yjDateTime}
 * @see yjDateTime
 */