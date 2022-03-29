/**
 * @author mustapha.wang
 */
$.extend($.fn.datagrid.methods, {
    tooltip : function (jq, fields) {
        return jq.each(function () {
            var panel = $(this).datagrid('getPanel');
            if (fields && typeof fields == 'object' && fields.sort) {
                $.each(fields, function () {
                    var field = this;
                    bindEvent($('td[field=' + field + '] .datagrid-cell', panel));
                });
            } else {
                bindEvent($(".datagrid-cell", panel));
            }
        });
 
        function bindEvent(jqs) {
            jqs.mouseover(function () {
                var content = $(this).text();
                if (content){
	                $(this).tooltip({
	                    content : content,
	                    trackMouse : true,
	                    onHide : function () {
	                        $(this).tooltip('destroy');
	                    }
	                }).tooltip('show');
                }
            });
        }
    }
});