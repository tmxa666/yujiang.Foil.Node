/**
 * @author mustapha.wang
 * @description
 * (1)支持数据库编辑，避免把空字符串""给数字型字段（如int），然后报错:[{"errno":1366,"code":"ER_TRUNCATED_WRONG_VALUE_FOR_FIELD","message":"ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: Incorrect integer value: '' for column 'SortNumber' at row 1"}]
 * (2)combotree这种editor时，避免新增时，显示undefined
 */
(function(){
	var editors=$.fn.datagrid.defaults.editors;
	for(var editorType in editors){
		var editor=editors[editorType];		
		(function(editorType,editor){
			function isNumber(target){
				if (editorType=="numberbox"){
					return true;
				}
				else{
					var proc=$(target)[editorType];
					if (proc){
						var op=proc.call($(target),"options");
						return op.isNumber==true;
					}
					else return false;
				}
			}
			var old_getValue=editor.getValue;
			editor.getValue=function(target){
				var value=old_getValue.call(editor,target);
				if (isNumber(target)){
					if (value=="") value=null
					else value=parseFloat(value);
				}		
				return value;
			}
			var old_setValue=editor.setValue;
			editor.setValue=function(target,value){				
				if (isNumber(target)){
					if (value==null||value==undefined) value="";
				}
				return old_setValue.call(editor,target,value);
			}
		})(editorType,editor);
	}
	
	//没有开放手输入，因此增加“clear”按钮重置为空
	//开放手输入，需要严格检查格式
	var datebox_buttons=$.fn.datebox.defaults.buttons;
	datebox_buttons.push({
		text:'clear',
		handler:function(target){
			$(target).datebox("setValue","");
			$(target).datebox("hidePanel");
		}
	});
})();