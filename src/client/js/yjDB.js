/**
 * @author mustapha.wang
 * @fileOverview <pre>■在node.js和浏览器中都可使用。
 * 处理数据格式相关。此文件在layout.ejs中被引入。</pre>
 * @see module:yjDB
 */

/**
 * 在browser中引入yjDB.js文件，直接使用变量yjDB
 * @global
 * @name browser::yjDB
 * @type {yjDB}
 */

/**
 * @exports yjDB
 * @description <pre>■在node.js和浏览器中都可使用。
 * 处理数据格式相关。</pre>
 * @example <pre>
 * var yjDB=yjRequire("yujiang.Foil","yjDB.js");
 * 或者在browser中引入yjDB.js文件，直接使用变量yjDB
 * </pre>
 * @see nodejs::yjRequire
 */
var yjDB = {
	/**
	 * 序列化为json字串
	 * @param {array} meta - 资料大纲
	 * @param {array} rows - 资料行
	 */
	stringify : function(meta, rows) {
		return JSON.stringify({
			meta : meta,
			rows : rows
		});
	},

	/**
	 * 把dataset(meta+rows)转换为object阵列,便于数据绑定
	 * @param {array} meta 元数据，大纲。如：[{“name”:“Name”},{“name”:“OID”}]
	 * @param {array} rows 资料行数据，如: [ [“A”,1],[“B”,2] ]
	 * @return {object} 处理后的object阵列，如：[{“Name”:“A”,“OID”:1},{“Name”:“B”,“OID”:2}]
	 * @example <pre>
	 * meta:[{"name":"Name"},{"name":"OID"}]
	 * rows:[["A",1],["B",2]]
	 * return:[{"Name":"A","OID":1},{"Name":"B","OID":2}]</pre>
	 */
	dataSet2ObjectList : function(meta, rows) {
		var a = new Array(rows.length);
		for ( var i = 0; i < rows.length; i++) {
			var r = {};
			for ( var j = 0; j < meta.length; j++) {
				r[meta[j].name] = rows[i][j];
			}
			a[i] = r;
		}
		return a;
	},

	/**
	 * 去掉objectList中的meta,按meta的顺序排列。
	 * @param {array} meta 元数据，大纲。如：[{“name”:“Name”},{“name”:“OID”},{name:”parentOID”}]
	 * @param {array} objectList 要处理的object阵列，如：[{“Name”:“A”,“OID”:1},{“Name”:“B”,“OID”:2}]
	 * @return {array} 处理后的数据阵列，如:[ [“A”,1],[“B”,2] ]
	 */
	objectList2List : function(meta, objectList) {
		var list = new Array(objectList.length);
		for ( var i = 0; i < objectList.length; i++) {
			var obj = objectList[i];
			var row = new Array(meta.length);
			for ( var j = 0; j < meta.length; j++) {
				row[j] = obj[meta[j].name]; 
			}
			list[i] = row;
		}
		return list;
	},
	/**
	 * 把object阵列转化为meta+rows的格式。
	 * @param {array} objectList 如：[{“Name”:“A”,“OID”:1},{“Name”:“B”,“OID”:2}]
	 * @param {boolean} [isSearchMeta=false] 是否遍历搜索meta，对mongodb等数据库，可能objectList中的每个object的属性不完全一致。
	 * @return {array} <pre>处理后的object阵列，如：
	 * {meta: [{“name”:“Name”},{“name”:“OID”}],
	 *  rows: [ [“A”,1],[“B”,2] ]
	 * }</pre>
	 */
	objectList2DataSet : function(objectList,isSearchMeta) {
		var result={
			meta:[],
			rows:[]
		}
		if (objectList.length>0){
			if (isSearchMeta==true){
				var meta={};
				for(var i=0;i<objectList.length;i++){
					for (var field in objectList[i]){
						meta[field]=1;
					}
				}
				for(var field in meta){
					result.meta.push({name:field});
				}
			}
			else{
				for (var field in objectList[0]){
					result.meta.push({name:field});
				}
			}
			result.rows=yjDB.objectList2List(result.meta, objectList);
		}
		
		return result;
	},
	/**
	 * 把dataset(meta+rows)转换为object阵列,然后序列化为json字串
	 */
	stringifyAsObjectList : function(meta, rows) {
		var ol = this.dataSet2ObjectList(meta, rows);
		return JSON.stringify(ol);
	},

	/**
	 * 把dataset的json字串解析为object阵列。
	 * @example <pre>
	 * s:{"meta":[{"name":"Name"},{"name":"OID"}],"rows":[["A",1],["B",2]]}
	 * return:[{"Name":"A","OID":1},{"Name":"B","OID":2}]</pre>
	 */
	parseAsObjectList : function(s) {
		var ds = JSON.parse(s);
		return this.dataSet2ObjectList(ds.meta, ds.rows);
	},
	/**
	 * 把object阵列转化为树形object阵列。
	 */
	objectList2TreeObjectList:function(list,oidColumnName,oidParentColumnName,isEasyuiStyle) {
		var tree = {};
		for ( var i = 0; i < list.length; i++) {
			var node = {
				data : list[i],
				isRoot : true,
				sortIndex:i,
				children : []
			}
			tree[list[i][oidColumnName]] = node;
		}

		for ( var oid in tree) {
			var node = tree[oid];
			var oidParent = node.data[oidParentColumnName];
			var parent = tree[oidParent];
			if (parent && (parent != node)) {
				parent.children.push(node);
				node.isRoot = false;
			}
		}

		function sortNodes(a,b){
			if (a.sortIndex<b.sortIndex) return -1;
			else if (a.sortIndex==b.sortIndex) return 0;
			else return 1;
		}
		
		var result = [];
		for ( var oid in tree) {
			var node = tree[oid];
			if (node.isRoot==true)
				result.push(node);
			delete node.isRoot;
			node.children.sort(sortNodes);
		}
		
		result.sort(sortNodes);
		
		for ( var oid in tree) {
			var node = tree[oid];
			delete node.sortIndex;	
			if (isEasyuiStyle==true){
				for (var key in node.data){
					node[key]=node.data[key];
				}				
				delete node.data;
			}
		}
		
		return result;
	},
	/**
	 * 把object阵列转换成hash表。
	 * @param {list} list - 阵列，数组，列表对象
	 * @param {string} keyName - 键名称
	 * @return {object} - 返回一个hash对象。
	 */
	objectList2Hash:function(list,keyName){
		var hash={};
		function scan(list2){
			for(var i=0;i<list2.length;i++){
				var node=list2[i];			
				hash[node[keyName]]=node;						
				if (node.children){
					scan(node.children);
				}
			}
		}
		scan(list);
		return hash;
	},
	/**
	 * 把dataset(meta+rows)转换为树形object阵列,便于数据绑定。
	 * @param {array} meta - 元数据，大纲。如：[{“name”:“Name”},{“name”:“OID”},{name:”parentOID”}]
	 * @param {array} rows - 资料行数据，如：[ [“A”,1,1],[“B”,2,1] ]
	 * @param {string|int} oidColumn - OID字段在meta中的位置序号
	 * @param {string|int} oidParentColumn - parentOID字段在meta中的位置序号
	 * @param {boolean} isEasyuiStyle=false - 是否输出jquery-easyui的资料格式
	 * @return {array} <pre>处理后的object阵列，如：
	 * [{data:{“Name”:“A”,“OID”:1,”parentOID”:1},
	 *   children:[{data:{“Name”:“B”,“OID”:2,”parentOID”:1},
	 *              children:[]
	 *            }]
	 * }]</pre>
	 */
	dataSet2TreeObjectList : function(meta, rows, oidColumn,oidParentColumn,isEasyuiStyle) {
		var oidColumnName = (typeof(oidColumn)=="string")?oidColumn:meta[oidColumn].name;
		var oidParentColumnName = (typeof(oidParentColumn)=="string")?oidParentColumn:meta[oidParentColumn].name;
		var vList = yjDB.dataSet2ObjectList(meta, rows);
		return this.objectList2TreeObjectList(vList,oidColumnName,oidParentColumnName,isEasyuiStyle);
	},
	/**
	 * @description 把纵向数据集转成横向的表。
	 * @param {object[]} meta - 如：[{“name”:“F1”},{“name”:“F2”},{“name”:”F3”}]
	 * @param {array[]} rows - 如：[ [“a1”,”b1”,”v1”],[“a1”,”b2”,”v2”] ]
	 * @param {object} options
	 * @param {int} options.keyFieldIndex=0 - 键值字段。
	 * @param {int} options.columnFieldsIndex - 要放到横向上的字段。
	 * @param {int} options.valueFieldsIndex='[meta.length-1]' - 值字段。
	 * @param {boolean} options.isToPlain=false - 是否把Object嵌套的属性展开成平面属性。
	 * @param {string} options.propSplitChar=. - Object嵌套的属性展开成平面属性时，上下成属性之间的间隔字符。
	 * @return {array} 处理后的object阵列，如：[{“b1”:[“v1”],“b2”:[“v2”],“F1”:“a1”}]
	 * @example 举例：<br/>
	 * 输入：{meta: [{“name”:“F1”},{“name”:“F2”},{“name”:”F3”},{“name”:”F4”}], rows:[ [“a1”,”b1”,“c1”,”v1”],[“a1”,”b1”,”c2”,”v2”] ]}<br/>
	 * 如图：<img src="img/tm/dataSet2Horizontal/input.png"/><br/>
	 * 不同参数的结果：<table  border="1" bordercolor="#a0c6e5" style="border-collapse:collapse;">
	 * <tr><td>keyFieldIndex</td><td>columnFieldsIndex</td><td>valueFieldsIndex</td><td>isToPlain</td><td>propSplitChar</td><td>[result]</td></tr>
	 * <tr><td>0            </td><td>[1,2]            </td><td>[3]             </td><td>false    </td><td>             </td><td><img src="img\tm\dataSet2Horizontal\1.png"/><br/>[{“F1”:“a1”,“b1”:{“c1”:[“v1”],“c2”:[“v2”]}}]</td></tr>
	 * <tr><td>0            </td><td>[1,2]            </td><td>[3]             </td><td>true     </td><td>.            </td><td><img src="img\tm\dataSet2Horizontal\2.png"/><br/>[{“F1”:“a1”,“b1.c1”:[“v1”],“b1.c2”:[“v2”]}]</td></tr>
	 * <tr><td>0            </td><td>[1,2]            </td><td>[3]             </td><td>true     </td><td>*            </td><td><img src="img\tm\dataSet2Horizontal\3.png"/><br/>[{“F1”:“a1”,“b1 c1”:[“v1”],“b1 c2”:[“v2”]}]</td></tr>
	 * <tr><td>0            </td><td>[2]              </td><td>[3]             </td><td>false    </td><td>             </td><td><img src="img\tm\dataSet2Horizontal\4.png"/><br/>[{“F1”:“a1”,“F2”:“b1”,“c1”:[“v1”],“c2”:[“v2”]}]</td></tr>
	 * <tr><td>0            </td><td>[1]              </td><td>[2,3]           </td><td>false    </td><td>.            </td><td><img src="img\tm\dataSet2Horizontal\5.png"/><br/>[{“b1”:[“c1”,“v1”],“F1”:“a1”}]<br/>特别注意：”c2,v2”这行资料被抛弃。</td></tr>
	 * </table>
	 */
	dataSet2Horizontal:function(meta,rows,options){
		//options包含如下几个属性：keyFieldIndex,columnFieldsIndex,valueFieldsIndex,isToPlain,propSplitChar
		//假设：{meta: [{"name":"F1"},{"name":"F2"},{“name”:”F3”},{“name”:”F4”}],
		//     rows: [["a1",”b1”,“c1”,”v1”],["a1",”b1”,”c2”,”v2”]]}
		if (options==null||options.columnFieldsIndex==null||options.columnFieldsIndex.length==0){
			throw new Error('options.columnFieldsIndex must be a array and has at least one element.');
		}
		var result={};
		if (meta.length<=0){
			return [];
		}
		
		options.keyFieldIndex=options.keyFieldIndex||0;
		options.valueFieldsIndex=options.valueFieldsIndex||[meta.length-1];
		
		//先得到哪些没有指定，可以直接复制的字段
		var otherColumns=[];
		for(var col=0;col<meta.length;col++){
			if (options.columnFieldsIndex.indexOf(col)<0 && 
				col!=options.keyFieldIndex && 
				options.valueFieldsIndex.indexOf(col)<0){
				otherColumns.push({index:col,name:meta[col].name});
			}
		}
		
		for (var row=0;row<rows.length;row++){				
			var key=rows[row][options.keyFieldIndex];
			var obj=result[key];
			if (!obj){
				obj={};
				result[key]=obj;
			}
			//直接复制未指定的字段
			for(var col=0;col<otherColumns.length;col++){				
				obj[otherColumns[col].name]=rows[row][otherColumns[col].index];				
			}
			//把columnFieldsIndex指定的字段值横置
			for(var col=0;col<options.columnFieldsIndex.length;col++){
				var key=rows[row][options.columnFieldsIndex[col]];
				var obj2=obj[key];
				if (!obj2){
					if(col==options.columnFieldsIndex.length-1){
						obj2=[];
						for(var i=0;i<options.valueFieldsIndex.length;i++){
							obj2.push(rows[row][options.valueFieldsIndex[i]]);
						}
					}
					else{
						obj2={};							
					}
					obj[key]=obj2;
				}
				else{
					//value需要覆盖还是用数组增加?抛弃
				}
				obj=obj2;
			}
		}
		//先得到{a1:{b1:{c1:['v1'],c2:['v2']}}}
		if (typeof module !== 'undefined' && module.exports){
			var yjUtils=require("./yjUtils.js");
		}		
		var result2=[];
		for(var key in result){
			var obj=result[key];
			if (options.isToPlain==true){
				obj=yjUtils.object2Plain(obj,options.propSplitChar);
			}
			obj[meta[options.keyFieldIndex].name]=key;
			result2.push(obj);
		}
		//得到[{"F1":"a1","b1":{"c1":["v1"],"c2":["v2"]}}]
		return result2;
	},
	copyField:function(rows,fromField,toField){
		for(var i=0;i<rows.length;i++){
			rows[i][toField]=rows[i][fromField];
		}
	}
}

if (typeof module !== 'undefined' && module.exports) {
	// 如果用module.exports = yjDB;
	// qunit的机制,需要用code:{path:"./source/yjDB.js",namespace:"yjDB"}
	// 如果用exports。yjDB；qunit直接用
	module.exports = yjDB;
}