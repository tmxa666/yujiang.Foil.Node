/**
 * @author mustapha.wang
 * @description <pre>只能在node.js中使用。
 * 简化处理与easyui-datagrid或easyui-treegrid相关的分页查询和批量保存。</pre>
 * @exports yjDBService_easyui
 * @see module:yjDBService_easyui_mysql
 */
var yjDBService_util=require("./yjDBService.util.js");
var path=require("path");
module.exports=yjDBService_util.loadByEngine(path.join(__dirname,"./yjDBService.easyui."));