/**
 * @module yjApp_middle_theme
 * @author mustapha.wang
 * @description
 * 中间件。按配置的theme引入静态资源。
 */
var path=require('path');

var dir='';
if (yjGlobal.config.theme && yjGlobal.config.theme.dir){
	dir=yjGlobal.config.theme.dir;
}
else{
	dir=path.join(__dirname,'../../yujiang.Foil.Node.WebServer/themes');
}
var layoutDir="classic";
if (yjGlobal.config.theme && yjGlobal.config.theme.layout){
	layoutDir=yjGlobal.config.theme.layout.foil;
}
layoutDir=path.join(dir,"layout/"+layoutDir);
global.yjGlobal.theme_layout_dir=layoutDir;
var path=require('path');
//引入主题的静态文件
var style="classic";
if (yjGlobal.config.theme && yjGlobal.config.theme.style && yjGlobal.config.theme.style.foil){
	style=yjGlobal.config.theme.style.foil;
}
yjStatic(path.join(dir,"style/"+style));