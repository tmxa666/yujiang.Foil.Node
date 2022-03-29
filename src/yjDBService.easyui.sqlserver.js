/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjDBService_easyui_mysql
 */

// var yjDBService = global.yjRequire("yujiang.Foil",'yjDBService.js');
var yjDBService = global.yjRequire("yujiang.Foil",'yjDBService.easyui.sqlserver.js');
var yjUtils=yjRequire("yujiang.Foil",'./client/js/yjUtils.js');
var yjError=require("./yjError.js");
var util=require('util');

function getSQL_Where_Query(options){
	//在combogrid这种editor中边打边找的参数值
	var sql="";
	var q=options.req.query.q;
	if (q && q!=""){
		var queryField=options.queryField;
		sql=sql+" and "+queryField+" like "+yjUtils.quotedStr('%'+q+'%');
	}
	return sql;
}

var g_ops={
	'equal':"=",
	'notequal':"<>",
	'less':"<",
	'lessorequal':"<=",
	'greater':">",
	'greaterorequal':">=",
	'contains':" like ",
	'not contains':" not like ",
	'in':' in ',
	'is':' is ',
	'is not':' is not '
};

function getOneFilter(field,op,value){
	if (op=="contains"){
		value="%"+value+"%";
	}
	if (op=="not contains"){
		value="%"+value+"%";
	}
	if (op!='in'){
		value=yjUtils.quotedStr(value);
	}
	if (field && (field.indexOf("(")<0)){			
		field=yjDBService.escapeId(field);
	}
	if(op=="is"||op=="is not"){
		value=null;
	}
	return field+g_ops[op]+value;
}

function getSQL_Where_Filter(options){
	var sql="";

	var fr=options.req.query.filterRules;
	if (fr){
		if (typeof(fr)=="string"){
			fr=JSON.parse(fr);
		}
		for (var i=0;i<fr.length;i++){
			if (fr[i].isHandled!=true){
				var field=fr[i].field;
				if (options.filterFieldMapping){
					var field2=options.filterFieldMapping[field];
					if (field2) {
						field=field2;
					}
				}
				
				sql=sql+" and "+getOneFilter(field,fr[i].op,fr[i].value);
			}
		}
	}
	return sql;
}

function getSQL_OrderBy(options){
	var isFoundKeyField=false;
	var orderBy="";
	var lastOrder="asc";
	if (options.req.query.sort){ 		
		var sorts=options.req.query.sort.split(",");
		var orders=options.req.query.order.split(",");
		
		for (var i=0;i<sorts.length;i++){
			var sortField=sorts[i];
			if (sortField==options.keyFieldName){
				isFoundKeyField=true;
			}
			if (options.sortFieldMapping){
				var field2=options.sortFieldMapping[sortField];
				if (field2) {
					sortField=field2;
				}
			}
			
			//options.req.query.sort可能是一个语句，如:hex(DataID)
			if (sortField && (sortField.indexOf("(")<0)){			
				sortField=yjDBService.escapeId(sortField);
			}
			orderBy=orderBy+","+sortField+" "+orders[i];
		}
		if (orders.length>0){
			lastOrder=orders[orders.length-1];
		}
	}
	if ((isFoundKeyField==false) && options.keyFieldName){		
		//如果排序字段值都一样，就无法分页，所以必须加上一个值一定不一样的字段
		orderBy=orderBy+","+yjDBService.escapeId(options.keyFieldName)+" "+lastOrder;
	}
	if (orderBy!=""){
		orderBy=orderBy.substr(1);
	}
	return orderBy;
}

function isHasFilter(options){
	var isHasFilter=false;
	var fr=options.req.query.filterRules;
	if (fr){
		if (typeof(fr)=="string"){
			fr=JSON.parse(fr);				
		}
		if (fr.length>0) isHasFilter=true;
	}
	return isHasFilter;
}

function getSQL_Where_Filter_Lookup(options,filterLookupFieldMapping){
	var sql_where="";
	var fr=options.req.query.filterRules;
	if (fr){
		if (typeof(fr)=="string"){
			fr=JSON.parse(fr);
		}
		for (var i=0;i<fr.length;i++){
			var field=filterLookupFieldMapping[fr[i].field];
			if (field){
				sql_where=sql_where+" and "+getOneFilter(field,fr[i].op,fr[i].value);
				fr[i].isHandled=true;
			}
		}
		options.req.query.filterRules=fr;
	}
	return sql_where;
}

function getSQL_Where_TreeGrid(options){
	var sql_where="";
	var OID=options.req.query.id;
	if (OID!=null){
		//点击id节点展开
		if (options.req.query.isLoadChildren=="true"){
			//查询这个节点下的子节点
			sql_where=sql_where+" and t1.{1}='"+OID+"' and t1.{0}<>'"+OID+"'";
		}
		else{
			//可能只是刷新这个节点内容
			sql_where=sql_where+" and t1.{0}='"+OID+"'";
		}
		//查询这个节点下的全部节点（不包含子子节点）
		//不需要分页，pageRowCount给-1
		options.req.query.page=null;
		options.req.query.rows=-1;
	}
	else{
		if ((options.req.query.q && options.req.query.q!="") || 
			(isHasFilter(options)==true)) {
			//有filter过滤条件时，就是从全部资料查，不是只查根节点					
			var fr=options.req.query.filterRules;
			if (fr){
				if (typeof(fr)=="string"){
					fr=JSON.parse(fr);
				}
				for(var i=0;i<fr.length;i++){
					fr[i].field="t1."+fr[i].field;
				}
				options.req.query.filterRules=fr;
			}
			sql_where=sql_where+getSQL_Where_Query(options);
			sql_where=sql_where+getSQL_Where_Filter(options);
		}
		else{
			//只查询根节点
			sql_where=sql_where+ 
				  " and not exists (select {0}"
		    	+ "                   from {2} as t2"
		    	+ "                   where t2.{0}=t1.{1} and t2.{1}<>t2.{0})";		
		}
	}
	return yjUtils.formatStr(sql_where,options.OIDField,options.OIDParentField,options.tableName);
}

function getSQL_Where_DataGrid(options){
	var sql_where="";
	if (options.req.query.id){
		sql_where=sql_where+" and "+options.keyFieldName+"='"+options.req.query.id+"'";
		//不需要分页，pageRowCount给-1
		options.req.query.page=null;
		options.req.query.rows=-1;
	}
	else {
		//有options.req.query.id后，表示是单独查询这行资料，如新增后刷新autoinc+default，这时不需要加入filter
		sql_where=sql_where+getSQL_Where_Query(options);
		sql_where=sql_where+getSQL_Where_Filter(options);
	}
	return sql_where;
}

/**
 * @description <pre>只能在node.js中使用。
 * 简化处理与easyui-datagrid或easyui-treegrid相关的分页查询和批量保存。
 * 适应于mysql数据库。</pre>
 * @exports yjDBService_easyui_mysql
 * @example <pre>
 * var yjDBService_easyui_mysql=yjRequire("yujiang.Foil","yjDBService.easyui.mysql.js");
 * </pre>
 * @see nodejs::yjRequire
 */
module.exports ={
	/**
	 * 获取树形查询sql语句。
	 * @param {object} options
	 * @param {boolean} [options.isGetWhereClause=true] 是否生成where子句
	 * @param {boolean} [options.isGetGroupByClause=true] 是否生成group by子句
	 * @param {array} [options.fields] 查询子句select选出的字段
	 * @param {string} options.OIDField 节点OID字段
	 * @param {string} options.OIDParentField 节点的父亲的OID字段名
	 * @param {string} options.tableName 表名
	 * @see #selectData
	 */
	getTreeGridSQL:function(options){
		//{0}:OID
		//{1}:OIDParent
		//{2}:TableName
		var sql= 
			 " select {3},sum(case when t3.Number is null then 0 else t3.Number end) as childrenCount"
			+" from {2} as t1"
			+" left outer join (select {0},{1},1 as Number from {2}) as t3 on t1.{0}=t3.{1} and t1.{1}<>t3.{1}";
		if (options.isGetWhereClause!=false){

			var sql_where=getSQL_Where_TreeGrid(options);
			if (sql_where!=""){
				sql=sql+" where 1=1 "+sql_where;
			}
		}
		if (options.isGetGroupByClause!=false){
			sql=sql+" group by {3}";//有sum函数时，sqlsver要求group的字段和select字段一致
		}
		var fields='t1.*';
		if (options.fields){
			for (var i=0;i<options.fields.length;i++){
				options.fields[i]='t1.'+options.fields[i];
			}
			fields=options.fields.join();
		}
		sql=yjUtils.formatStr(sql,options.OIDField,
			options.OIDParentField,options.tableName,fields);
		return sql;
	},
	/**
	 * 获取非树形sql查询语句。
	 * @see #selectData
	 * @param {object} options
	 */
	getDataGridSQL:function(options){		
		var sql="select {0} from {1}";
		var fields='*';
		if (options.fields){
			fields=options.fields.join();
		}
		sql=yjUtils.formatStr(sql,fields,options.tableName);
		if (options.isGetWhereClause!=false){
			var sql_where=getSQL_Where_DataGrid(options);
			if (sql_where!=""){
				sql=sql+" where 1=1 "+sql_where;
			}
		}
		return sql;
	},
	/**
	 * 批量保存数据。
	 * @param {object} options
	 * @param {string} options.tableName - 数据表名称
	 * @param {string} options.keyFieldName - 表的主键字段名称
	 * @param {object[]} options.delta.inserted - 新增的资料
     * @param {object[]} options.delta.deleted - 删除的资料
     * @param {object[]} options.delta.updated - 修改的资料
     * @param {callback_success} options.success - 成功后的回调函数
     * @param {callback_error} options.error - 失败后的回调函数
	 */
	saveDelta:function(options){
		//对增、删、改一起保存。
		//需要transaction，避免部分成功
		var CNST_tableName=options.tableName;
		var CNST_keyFieldName=options.keyFieldName;
		var delta=options.delta;
		var totalCount=0;
		if (delta.updated){
			totalCount+=delta.updated.length;
		}
		if (delta.inserted){
			totalCount+=delta.inserted.length;
		}
		if (delta.deleted){
			totalCount+=delta.deleted.length;
		}
		
		if (totalCount==0){
			yjError.handleResult(options,null,null);
			return;
		}
		
		var finishedCount=0;
		var errors=[];
		var results={
			updated:[],
			inserted:[],
			deleted:[]
		}
		
		function checkResult(){
			if (finishedCount==totalCount){
				if (errors.length>0){
				    var err=null;
				    if (errors.length==1){
				        err=errors[0];
				    }
				    else{
				        err=new Error(util.inspect(errors));
				    }
					yjError.handleResult(options,err);
				}
				else{
					yjError.handleResult(options,null,results);
				}
			}
		}
		
		function saveDB(sql,params,method,result,index){
			yjDBService[method]({
				connectionOptions:options.connectionOptions,
				sql : sql,
				parameters:params,
				success : function(data){
					finishedCount++;
					result[index]=data;
					checkResult();
				},
				error : function(err){
					errors.push(err);
					finishedCount++;
					checkResult();
				}
			});
		}
		
		if (delta.updated){
			for (var i=0;i<delta.updated.length;i++){
				var row=delta.updated[i];
				var sql = " update "+yjDBService.escapeId(CNST_tableName)+" set ";
				var params=[];
				for(var fieldName in row){
					if (fieldName!=CNST_keyFieldName){
						sql+=yjDBService.escapeId(fieldName)+"=?,";
						params.push(row[fieldName]?row[fieldName]:(row[fieldName]===0?0:null));
					}
				}
				sql=sql.substr(0,sql.length-1);
				sql+=" where "+yjDBService.escapeId(CNST_keyFieldName)+"=?";
				
				params.push(row[CNST_keyFieldName]);
				
				results.updated.push(null);
				saveDB(sql,params,"exec",results.updated,i);
			}
		}
		
		if (delta.inserted){
			for (var i=0;i<delta.inserted.length;i++){
				var row=delta.inserted[i];
				var sql = " insert into "+yjDBService.escapeId(CNST_tableName)+"( ";
				var params=[];
				var fieldCount=0;
				for(var fieldName in row){
					//easyui-datagrid的特殊地方，最好是客户端解决
					if (fieldName!="isNewRecord"){
						sql+=yjDBService.escapeId(fieldName)+",";
						params.push(row[fieldName]?row[fieldName]:(row[fieldName]===0?0:null));
						fieldCount++;
					}
				}
				sql=sql.substr(0,sql.length-1);
				sql+=") values(";
				for (var j=0;j<fieldCount;j++){
					sql+="?,";
				}
				sql=sql.substr(0,sql.length-1);
				sql+=")";
				results.inserted.push(null);
				saveDB(sql,params,"insertData",results.inserted,i);
			}
		}
		
		if (delta.deleted){
			for (var i=0;i<delta.deleted.length;i++){
				var row=delta.deleted[i];
				if (options.OIDField && options.OIDParentField){
					var sql=
						" delete t1"+
						" from {2} as t1"+
						" left outer join {2} as t2 on t2.{1}=t1.{0} and t2.{1}<>t2.{0}"+
			    	    " where t1.{0}="+"'{3}' and t2.{0} is null";		
					sql=yjUtils.formatStr(sql,options.OIDField,options.OIDParentField,CNST_tableName,row[CNST_keyFieldName]);
				}
				else{
					var sql = 
						" delete from {2}"+
				        " where {0}='"+"{1}'";
					sql=yjUtils.formatStr(sql,CNST_keyFieldName,row[CNST_keyFieldName],CNST_tableName);
				}
				results.deleted.push(null);
				saveDB(sql,[],"exec",results.deleted,i);
			}
		}			
	},
	/**
	 * 获取where子句
	 * @see #selectData
	 * @param {object} options
	 */
	getSQL_Where:function(options){
		if (options.OIDField && options.OIDFieldParent &&
			(!options.req.query.q) &&
			(isHasFilter(options)==false)){
			return getSQL_Where_TreeGrid(options);
		}
		else{
			return getSQL_Where_DataGrid(options);
		}
	},
	/**
	 * 获取sql语句
	 * @see #selectData
	 * @param {object} options
	 */
	getSQL:function(options){
		if (options.OIDField && options.OIDParentField &&
			(options.req.query.rows>0) &&
			(!options.req.query.q) &&
			(isHasFilter(options)==false)){
			//没有边打边找的条件，没有过滤条件，且提供了OID/OIDParent字段名称
			//按树形查，保证树结构的完整性
			var sql=module.exports.getTreeGridSQL(options);
		}
		else{
			var sql= module.exports.getDataGridSQL(options);
		}
		return sql;
	},
	/**
	 * 分页查询数据。
	 * @param {object} options
	 * @param {int}     [options.req.query.page=0] - easyui标准。页码，从0开始为第一页
     * @param {int}     [options.req.query.rows=20] - easyui标准。每页记录条数，-1表示全部（0就是0，可能用户只要schema）
     * @param {string}   options.req.query.sort - easyui标准。排序字段	
     * @param {string}   options.req.query.order - easyui标准。升序：asc；降序：desc
     * @param {string}   options.req.query.queryField easyui标准。查询字段
     * @param {string}   options.req.query.q - easyui标准。查询值
     * @param {array}    options.req.query.filterRules easyui标准。过滤条件，item格式为{field:x,op:x,value:x}
     * @param {string}   options.req.query.id easyui标准。树形展开节点的直接点时，id值是本节点的key
     * @param {string}  [options.req.query.isLoadChildren=false] 当query.id存在时，是否载入子节点
     * @param {string}   options.tableName 表名
     * @param {string}   options.keyFieldName - 表的主键字段名称
     * @param {array}   [options.fields] 查询子句select选出的字段
     * @param {string}  [options.sql] - Sql语句，如：select col1,col2 from TableName where col3 = ? And col4 = ?。如果不给sql语句，自动产生sql语句。
     * @param {array}   [options.parameters] - Sql语句的参数，如：[p1,p2]
     * @param {boolean} [options.fetchTotalCount=true] - true：返回总记录数；false：不返回总记录数
     * @param {boolean} [options.rowsAsArray=true] - True:返回的行的值采用数组，如: [2，'A','B'];<br/>False:返回的行的值采用object格式，如：{OID:2,AID:'A',Name:'B'}
     * @param {boolean} [options.isGetWhereClause=true] 是否产生where子句
     * @param {boolean} [options.isGetGroupByClause=true] 是否生成group by子句
     * @param {string}  [options.OIDField] 节点OID字段，如果提供了OIDField和OIDParentField，按树形结构处理
     * @param {string}  [options.OIDParentField] 节点的父亲的OID字段名
     * @param {object}  [options.filterFieldMapping] 过滤器的字段映射表。当有join时把字段映射到正确的表上。
     * @param {object}  [options.sortFieldMapping] 排序字段的映射表
     * @param {Function(err,data)} options.callback 回调函数，如果有优先使用，否则使用success+error
     * @param {callback_success} options.success - 成功后的回调函数。Data格式：{pageIndex:x,pageRowCount:x,meta:[],rows:[],total:x}
     * @param {callback_error} options.error - 失败后的回调函数。
     * @example
     * /tm.utils.uom/biz/getUOMs.{m}.js
     * <pre>
     * module.exports = function(sender) {
     *   var yjDBService_easyui = global.yjRequire("yujiang.Foil","yjDBService.easyui.js");
     *   
     *   sender.tableName = "tmUOMs"
     *   sender.keyFieldName="UOMOID";
     *   sender.sql=
     *       " select u.*"+
     *       " from tmUOMs as u"+
     *       " left outer join tmUOMSystems as s on s.UOMSystemOID=u.UOMSystemOID"+
     *       " left outer join tmUOMCategories as c on c.UOMCategoryOID=u.UOMCategoryOID";
     *   
     *   var fr=sender.req.query.filterRules;
     *   if (fr){
     *       fr=JSON.parse(sender.req.query.filterRules);
     *       for (var i=0;i&lt;fr.length;i++){
     *           fr[i].field="u."+fr[i].field;
     *       }
     *       sender.req.query.filterRules=fr;
     *   }
     *   //只适合mysql
     *   sender.filterFieldMapping={
     *       "u.DataID_Hex":"lpad(hex(u.DataID),4,'0')"
     *   }
     *   sender.sortFieldMapping={
     *       "DataID_Hex":"lpad(hex(u.DataID),4,'0')",
     *       "UOMSystemOID":"s.Name",
     *       "UOMCategoryOID":"c.Name"       
     *   }
     *   
     *   yjDBService_easyui.selectData(sender);
     * }</pre>
     * @example
     * /yujiang.Foil.Node.BizServer/biz/system/authority2/org/getOrgTypes_lookup.{m}.js
     * <pre>
     * module.exports = function(sender) {
     *     var yjDBService_easyui = global.yjRequire("yujiang.Foil","yjDBService.easyui.js");
     *     sender.tableName="AllTypes";
     *     sender.keyFieldName="TypeOID";
     *     sender.fields=["TypeOID","TypeName"];
     *     //这个查询逻辑是属于企业逻辑，不由客户端决定。客户端可决定排序、是否分页
     *     sender.req.query.filterRules=[{
     *         field:"Category",
     *         op:"equal",
     *         value:"OrgType"
     *     }];
     *     yjDBService_easyui.selectData(sender);
     * }
	 */
	selectData:function(options){
		var sql=options.sql;
		if (!sql){
			sql=module.exports.getSQL(options);
		}
		else if (options.isGetWhereClause!=false){
			var sql_where=module.exports.getSQL_Where(options);
			if (sql_where){
				sql=sql+" where 1=1 "+sql_where;
			}
		}

		if (options.req.query.page){
			var pageIndex=parseInt(options.req.query.page);
			//easyui的分页器的页面是从1开始
			if (pageIndex>0){
				pageIndex=pageIndex-1;	
			}
			if (!options.fetchTotalCount){
				options.fetchTotalCount=true;
			}
		}
		else{
			//不分页，比如新增后刷新该行。
			//抓取节点的子节点，不分页但是还是要排序
			options.pageRowCount = -1;
		}
		var sql_OrderBy=getSQL_OrderBy(options);
		// console.info(sql);
		yjDBService.selectData({
			connectionOptions:options.connectionOptions,
			sql : sql,
			parameters:options.parameters,			
			pageIndex: pageIndex,
			pageRowCount : parseInt(options.req.query.rows),
			orderBy: sql_OrderBy,
			fetchTotalCount:options.fetchTotalCount,
			rowsAsArray:options.rowsAsArray,
			callback:options.callback,
			success : options.success,
			error : options.error
		});
	},
	/**
	 * 获取where子句的filter部分，用于lookup，不分页。
	 * @see #selectData
	 * @method
	 * @param {object} options
	 */
	getSQL_Where_Filter_Lookup:getSQL_Where_Filter_Lookup
}
