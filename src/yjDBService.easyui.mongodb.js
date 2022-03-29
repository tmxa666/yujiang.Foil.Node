/**
 * @author mustapha.wang
 * @module yjDBService_easyui_mongodb
 * @see module:yjDBService_easyui_mysql
 */
var yjDBService = global.yjRequire("yujiang.Foil",'yjDBService.js');
var yjUtils=yjRequire("yujiang.Foil",'./client/js/yjUtils.js');
var async = require('async');
var ObjectID = require('mongodb').ObjectID;
var yjDB= global.yjRequire("yujiang.Foil",'./client/js/yjDB.js');
var merge=require("merge");
var g_ops={
	equal:function(value){
	 	return value;
	 },
	notequal:function(value){
	 	return {"$ne":value};
	 },
	less:function(value){
	 	return {"$lt":value};
	},
	lessorequal:function(value){
	 	return {"$lte":value};
	},
	greater:function(value){
	 	return {"$gt":value};
	},
	greaterorequal:function(value){
	 	return {"$gte":value};
	},
	contains:function(value){
	 	return new RegExp(value);
	}
};

var g_orders={
	asc:1,
	desc:-1
}

function getPipe_sort(options){
	var sort={};
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
			sort[sortField]=g_orders[orders[i]];
		}
		if (orders.length>0){
			lastOrder=orders[orders.length-1];
		}
	}
	if (isFoundKeyField==false){
		//如果排序字段值都一样，就无法分页，所以必须加上一个值一定不一样的字段
		sort[options.keyFieldName]=g_orders[lastOrder];
	}
	return sort;
}

function getPipe_match_query(match,options){
	if (options.req.query.q && options.req.query.q!=""){
		//点击id节点展开
		match[options.queryField]=new RegExp(Regoptions.req.query.q);
	}
}
function getPipe_match_filter(match,options){
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
				var obj0=match[field];				
				var obj2=g_ops[fr[i].op](fr[i].value);
				if (obj0){
					match[field]=merge(obj0,obj2);
				}
				else{
					match[field]=obj2;
				}
			}
		}
	}
}

function getPipe_project(options){
	var fields={};
	if (options.fields){
		for(var i=0;i<options.fields.length;i++){
			fields[options.fields[i]]=1;
		}
		fields["_id"]=0;
	}

	return fields;
}

function getPipe_skip_limit(options){
	var skipCount=0;
	var pageRowCount=-1;
	//每页显示个数
	if (options.req.query.rows!=-1){
		pageRowCount=parseInt(options.req.query.rows);
		var pageIndex=parseInt(options.req.query.page);
		//easyui的分页器的页面是从1开始
		if (pageIndex>0){
			pageIndex=pageIndex-1;	
		}
		skipCount=pageIndex*pageRowCount;
	}
	return {skip:skipCount,limit:pageRowCount}
}

function selectData(options){
	yjUtils.hookCallback(options,function(err,db,oldCallback){
		console.time("BBB");
		if (err){
			oldCallback(err);
			return;
		}
		var pipes=[];
		
		//先处理外部的pipes
		if (options.pipes_begin){
			pipes=pipes.concat(options.pipes_begin);
		}
		
		var match={};
		//处理parent/children用到的lookup
		var lookups2=[];
		//处理parent/children用到的match，如抓取根节点parentCount=0
		var match2={};
		//sort后添加了parent/children字段
		var project0=getPipe_project(options);
		if (options.pipes){
			//把外部lookup放入，可能后面的match或sort会用到
			for (var i=0;i<options.pipes.length;i++){
				var lk=options.pipes[i]['$lookup'];
				if (lk){
					project0[lk.as]=1;
				}
			}
		}
		//最后过滤的字段
		var project1=getPipe_project(options);

		var sort=getPipe_sort(options);
		var sl=getPipe_skip_limit(options);
		//console.log(options.req.query);
		if (options.OIDField && options.OIDParentField &&
			(!options.req.query.q) &&
			(isHasFilter(options)==false)){			
			//按树查询，页面上每次只展开一层			
			if (options.req.query.isLoadChildren!="false"){
				//排除OID与OIDParent相同的情况
				lookups2.push({$lookup:{from:options.tableName,localField:options.OIDField,foreignField:options.OIDParentField,as:"children"}});
				project0.children=1;
				project0.childrenCount={$ceil:{$subtract:[{"$size":"$children"},{$cond:[{$eq:['$'+options.OIDField,'$'+options.OIDParentField]},1,0]}]}};
				//最后带回childrenCount这个字段
				project1.childrenCount=1;
			}
			if (options.req.query.id){
				if (options.req.query.isLoadChildren=="true"){
					//只查询这个节点下的全部子节点，不分页
					match[options.OIDParentField]=options.req.query.id;
					//剔除自己，避免OID=OIDParent的情况
					match[options.OIDField]={$ne:options.req.query.id};
				}
				else{
					//可能只是刷新这个节点内容，不分页
					match[options.OIDField]=options.req.query.id;
				}
				sl.limit=0;
			}
			else if (sl.limit>0){
				//只查询根节点，要分页
				//排除OID与OIDParent相同的情况
				lookups2.push({$lookup:{from:options.tableName,localField:options.OIDParentField,foreignField:options.OIDField,as:"parent"}});
				project0.parent=1;
				project0.parentCount={$ceil:{$subtract:[{"$size":"$parent"},{$cond:[{$eq:['$'+options.OIDField,'$'+options.OIDParentField]},1,0]}]}};
				match2.parentCount=0;
			}
		}
		else{
			if (options.req.query.id){
				match[options.keyFieldName]=options.req.query.id;
				sl.limit=0;
			}
			else{
				//按grid查询,没有childrenCount，要分页
				getPipe_match_query(match,options);
				getPipe_match_filter(match,options);
			}
		}

		//console.log(match);		
		if (JSON.stringify(match)!='{}'){
			pipes.push({$match:match});
		}
		//不能先$project,因为sort可能用到$lookup中的字段
		//console.log(sort);
		if (JSON.stringify(sort)!='{}'){
			pipes.push({$sort:sort});
		}
		
		//加上处理parent/children的lookup
		for (var i=0;i<lookups2.length;i++){
			pipes.push(lookups2[i]);
		}		
		//加上处理parent/children的字段,match会用到parentCount
		if (JSON.stringify(project0)!='{}'){
			pipes.push({$project:project0});
		}
		//加上处理parent/children的match，主要是限制parentCount为0，抓取根节点
		if (JSON.stringify(match2)!='{}'){
			pipes.push({$match:match2});
		}
		//最后重新筛选字段
		if (JSON.stringify(project1)!='{}'){
			pipes.push({$project:project1});
		}		
		
		//再出来外部的pipes，可能需要最后再lookup一些资料
		if (options.pipes_end){
			pipes=pipes.concat(options.pipes_end);
		}
		
		//因为要获取总记录条数,没办法用skip+limit
		//console.log(pipes);	
		console.timeEnd("BBB");	
		db.collection(options.tableName).aggregate(pipes,function(err,docs){
			//console.log(docs);
			if(err){
				oldCallback(err);
				return;
			};
			var total=docs.length;
			//分页
			if (sl.limit>0){
				docs=docs.slice(sl.skip,sl.skip+sl.limit);
				oldCallback(null,{total:total,rows:docs});
			}			
			else{
				oldCallback(null,docs);
			}
		});
	});

	yjDBService.getConnection(options);
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

/**
 * @description <pre>只能在node.js中使用。
 * 简化处理与easyui-datagrid或easyui-treegrid相关的分页查询和批量保存。
 * 适应于mongodb数据库。</pre>
 * @exports yjDBService_easyui_mongodb
 * @example <pre>
 * var yjDBService_easyui_mongodb=yjRequire("yujiang.Foil","yjDBService.easyui.mongodb.js");
 * </pre>
 * @see nodejs::yjRequire
 */

module.exports ={
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
		var delta=options.delta;
		var results={
			updated:[],
			inserted:[],
			deleted:[]
		}
		async.waterfall([function(cb){
			yjUtils.hookCallback(options,function(err,db,oldCallback){
				if (err){
					cb(err,oldCallback);
					return;
				}
				var collection=db.collection(options.tableName);
				cb(null,oldCallback,collection);
			});
			yjDBService.getConnection(options);
		},function(oldCallback,collection,cb){
			if (!delta.updated){
				cb(null,oldCallback,collection);
				return;
			}
			async.each(delta.updated,function(row,cb2){
				var oid=row[options.keyFieldName];
				delete row[options.keyFieldName];
				var filter={};
				filter[options.keyFieldName]=oid;
				collection.updateOne(filter,{"$set":row},cb2);							
			},function(err,data){
				cb(err,oldCallback,collection);
			});			
		},function(oldCallback,collection,cb){
			if (!delta.inserted){				
				cb(null,oldCallback,collection);
				return;
			}
			//生成新的OID,用原生的_id作为记录的OID，新增查询处理需要在ObjectID与string之间转换太麻烦
			if (options.keyFieldName){
				for(var i=0;i<delta.inserted.length;i++){
					var oid=new ObjectID().toString();
					delta.inserted[i][options.keyFieldName]=oid;
					results["inserted"].push({OID:oid});
				}
			}
			
			collection.insertMany(delta.inserted,function(err,insertResult){
				//console.log(err);
				//console.log(insertResult);
				if (err){
					cb(err,oldCallback);
					return;
				}
			    /*for(var i=0;i<insertResult.insertedIds.length;i++){
					var Result={OID:insertResult.insertedIds[i].toString()};
					results["inserted"].push(Result);
				}*/
				cb(null,oldCallback,collection);	
			});
		},function(oldCallback,collection,cb){
			if (!delta.deleted){
				cb(null,oldCallback,collection);
				return;
			}				
			async.each(delta.deleted,function(row,cb2){
				var oid=row[options.keyFieldName];
				var filter={};
				filter[options.keyFieldName]=oid;
				collection.deleteOne(filter,function(err,deleteResult){
					if(err){
						cb2(err);
						return;
					}
					var affectedRows={"affectedRows":deleteResult.deletedCount};
					results["deleted"].push(affectedRows);
					cb2(null);
				});
			},function(err,data){
				cb(err,oldCallback,collection);
			});			
		}],function(err,oldCallback,data){
			//console.log(err);
			//console.log(results);
			oldCallback(err,results);
		});	
	},
	/**
	 * @method
	 * @param {object}   options
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
     * @param {boolean} [options.fetchTotalCount=true] - true：返回总记录数；false：不返回总记录数
     * @param {boolean} [options.rowsAsArray=true] - True:返回的行的值采用数组，如: [2，'A','B'];<br/>False:返回的行的值采用object格式，如：{OID:2,AID:'A',Name:'B'}
     * @param {string}  [options.OIDField] 节点OID字段，如果提供了OIDField和OIDParentField，按树形结构处理
     * @param {string}  [options.OIDParentField] 节点的父亲的OID字段名
     * @param {object}  [options.filterFieldMapping] 过滤器的字段映射表。当有join时把字段映射到正确的表上。
     * @param {object}  [options.sortFieldMapping] 排序字段的映射表
     * @param {array}   [options.pipes_begin]
     * @param {array}   [options.pipes]
     * @param {array}   [options.pipes_end]
     * @param {Function(err,data)} options.callback 回调函数，如果有优先使用，否则使用success+error
     * @param {callback_success} options.success - 成功后的回调函数。Data格式：{pageIndex:x,pageRowCount:x,meta:[],rows:[],total:x}
     * @param {callback_error} options.error - 失败后的回调函数。
     * @example
     * /yujiang.Foil.Node.BizServer/biz/system/authority2/org/getOrgs/getOrgs.db.mongodb.js
     * <pre>
     * var yjUtils=yjRequire("yujiang.Foil","client/js/yjUtils.js");
     * var yjDBService_easyui = global.yjRequire("yujiang.Foil","yjDBService.easyui.js");
     * var yjDBService = global.yjRequire("yujiang.Foil","yjDBService.js");
     * var util=require("util");
     * module.exports = function(sender) { 
     *     sender.tableName="Orgs";
     *     sender.OIDField="OrgOID";
     *     sender.OIDParentField="OrgOIDParent";
     *     sender.keyFieldName="OrgOID";
     *     sender.fields=["OrgOID","OrgOIDParent","OrgAID","Name","OrgTypeOID","Address",
     *         "Contactor","ContactorMobile","ContactorEMail",
     *         "VI_Name","VI_Description","VI_Logo","VI_Banner",
     *         "Description","SortNumber"];
     *                 
     *     var joins={
     *         "OrgTypeOID":{$lookup:{from:"AllTypes",localField:"OrgTypeOID",foreignField:"TypeOID",as:"OrgType"}}
     *     }
     *     var pipe_match={};
     *     var pipe_joins={};
     *     var fr=sender.req.query.filterRules;
     *     if (fr){
     *         if (typeof(fr)=="string"){
     *             fr=JSON.parse(fr);
     *         }
     *         for(var i=0;i&lt;fr.length;i++){
     *             //前端的OrgType使用lookup显示的TypeName，特殊处理
     *             if (fr[i].field=="OrgTypeOID"){             
     *                 pipe_joins["OrgTypeOID"]=joins["OrgTypeOID"];
     *                 pipe_match.OrgType={$elemMatch:{TypeName:new RegExp(fr[i].value)}};
     *                 fr[i].isHandled=true;
     *             }
     *         }
     *         sender.req.query.filterRules=fr;
     *     }
     *         
     *     if (sender.req.query.sort=="OrgTypeOID"){
     *         pipe_joins["OrgTypeOID"]=joins["OrgTypeOID"];       
     *     }
     *     var pipes=[];
     *     for(var key in pipe_joins){
     *         pipes.push(pipe_joins[key]);
     *     }
     * 
     *     if (JSON.stringify(pipe_match)!='{}'){
     *         pipes.push({$match:pipe_match});
     *     }
     *     sender.pipes_begin=pipes;
     *     //sort时需要
     *     sender.sortFieldMapping={
     *         "OrgTypeOID":"OrgType.TypeName"
     *     }
     * 
     *     yjDBService_easyui.selectData(sender);  
     * }</pre>
	 */
	selectData:selectData
}