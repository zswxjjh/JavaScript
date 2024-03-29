
/**
 * @author 江金汉
 * @date  2021/12/17
 */
'use  strict';//严格模式
 
var addEvent,removeEvent;
(function(){
/*
 *跨浏览器的事件追加函数
 *集中管理事件，有效防止内存泄漏
 */
function addEvent(element, type, handler) {
	if (element.addEventListener) {
		element.addEventListener(type, handler, false);
	} else {
		// 附加事件处理函数一个唯一标识符
		if (!handler.$$guid) handler.$$guid = addEvent.guid++;
		// 为元素每个事件创建一个散列表
		if (!element.events) element.events = {};
		// 为元素建立某个事件类型对应处理函             
  //数的散列表
		var handlers = element.events[type];
		if (!handlers) {
			handlers = element.events[type] = {};
			// 把默认的事件处理函数作为第一个事
    //件处理函数作为第一个事件处理函数
			if (element["on" + type]) {
				handlers[0] = element["on" + type];
			}
		}
		// 保存当前的事件处理函数
		handlers[handler.$$guid] = handler;
		// 设置全局事件处理函数为默认事件处
   //理函数
		element["on" + type] = handleEvent;
	}
};
// 唯一标识符发生器
addEvent.guid = 1;

/*
 *移除事件处理函数
 */
function removeEvent(element, type, handler) {
	if (element.removeEventListener) {
		element.removeEventListener(type, handler, false);
	} else {
		// 从散列表删除事件处理函数
		if (element.events && element.events[type]) {
			delete element.events[type][handler.$$guid];
		}
	}
};

/*
 *全局事件处理函数，所有的事件处理函数
 *均委托其进行处理，this指向当前元素
 */
function handleEvent(event) {
	var returnValue = true;
	// 包装事件对象，考虑了框架窗体(IE特殊
//处理) 
	event = event || fixEvent(((this.ownerDocument || this.document || this).parentWindow || window).event);
	// 获取事件处理函数散列表的引用
	var handlers = this.events[event.type];
	// 执行每一个事件处理函数
	for (var i in handlers) {
		this.$$handleEvent = handlers[i];
		if (this.$$handleEvent(event) === false) {
			returnValue = false;
		}
	}
	return returnValue;
};

/*
 *修复IE浏览器的不兼容性
 */
function fixEvent(event) {
	// 转换成W3C事件标准
	event.preventDefault = fixEvent.preventDefault;
	event.stopPropagation = fixEvent.stopPropagation;
event.target=event.target || event.srcElement;
	return event;
};
fixEvent.preventDefault = function() {
	this.returnValue = false;
};
fixEvent.stopPropagation = function() {
	this.cancelBubble = true;
};
})();

/*
 *工具函数：拾取一个或者多个DOM元素，使用CSS选择符
 */
var $=(function(){
  var doc=window.document;
  return function(selector){
      var some=doc.querySelectorAll(selector);
         //如果只有一个元素返回该元素，否则返回多个元素
         return some.length===1?some[0]:some;
   };
}());

/*
*事件类：表示一个自定义的事件，不同于DOM事件，用于监听器模式
*
*/
var Event=(function(){
 function Event()
  {
    this.listeners={};//监听者
    this.guid=0;//监听者的唯一标识符生成器
  }

  Event.prototype.addListener=function(listener)
   {
     var guid=this.guid++;
     this.listeners[guid]=listener;
     return guid;
   };
      
  Event.prototype.removeListener=function(guid)
   {
      delete this.listeners[guid];
   };

  Event.prototype.notify=function()
   {
     var  listeners=this.listeners;
     for(var key in listeners)
       {
         if(listeners.hasOwnProperty(key))
          {
            var listener=this.listeners[key];
            if(listener.constructor==Function)
              //注意回调函数没有主叫对象，可以自由绑定一个对象
              listener.apply(null,arguments);
            if(listener instanceof Object)
              //注意主叫对象是监听器，比如视图
              listener.handle.apply(listener,arguments);
          }               
       }
   };
}());

/*
*监听者接口：用于监听器模式
*用对象表示接口
*/
var Listener=(function(){
    return {
        handle:function(){
          throw new Error("抽象方法！");
        }
      };
  }());

/*
*模型类，实现基本功能，负责业务逻辑
*包含一组具有相同结构的数据
*/
var  GridModel=(function(){
   //构造函数，key表示主键字段
   function Model(key)
    {
      //存储相同结构的数据
      this.items=[];
      this.key=key;
      //事件
      this.onInsert=new Event();
      this.onRemove=new Event();
      this.onUpdate=new Event();
    }
   /*
    *追加一个或者多个记录数据，可变参数，item集合
   */
    GridModel.prototype.insert=function()
      {
        for(var i=0;i<arguments.length;i++)
         {
          this.items.push(arguments[i]);
         }
         //触发事件    
          this.onInsert.notify({source:this,values:arguments});
      };
    /*
     *删除一个或者多个记录，可变参数，key集合
     */
    GridModel.prototype.remove=function()
      {
        var values=this.get(arguments);
        var key=this.key;
        var items=this.items;
        for(var i=0;i<values.length;i++)
         {
           for(var j=0;j<items.length;)
              {
                //考虑items.length是易变的
                if(values[i][key]===items[j][key])
                  {
                  items.splice(j,1);
                  break;
                  }
                else
                  j++;
              }
         }
         //触发事件
          this.onRemove.notify({source:this,values:arguments});
      };
    /*
     *查询一条或者多条记录，可变参数，key集合
     */
    GridModel.prototype.read=function()
      {
        var result=[];
        for(var i=0;i<this.items.length;i++)
          {
           var item=this.items[i];
           var key=item[this.key];
           for(var j=0;j<arguments.length;j++)
            {
              if(key===arguments[j])
                {
                 result.push(item);
                 break;
                }
            }
          }
        return  result;
      };
    /*
     *更新一条或者多条记录，可变参数,item集合
     */
    GridModel.prototype.update=function()
      {
        var key=this.key;
        var items=this.items;
        for(var i=0;i<arguments.length;i++)
         {
           for(var j=0;j<items.length;j++)
              {              
                if(arguments[i][key]===items[j][key])               
                  {
                  items[j]=arguments[i];
                  break;
                  }                
              }
         }
          //
          this.onUpdate.notify({source:this,values:arguments});
      };
 }());

/*
 *控制器接口描述
 *@param selector 组件的边界
 */
var Component=(function(){
 function Component(selector)
 {
  //视图边界DOM元素
  var dElement=$(selector);
  //属性
  this.view=new View(dElement);
  this.model=new Model();
  //绑定监听器
  this.model.onRead.addListener(this.view.read.bind(this.view));
  this.model.onUpdate.addListener(this.view.update.bind(this.view));
  this.model.onInsert.addListener(this.view.insert.bind(this.view));
  this.model.onRemove.addListener(this.view.remove.bind(this.view));
  //注册事件委托
  var self=this;
  addEvent(dElement,"click",function(event){
    self.on(event);
  });
 }
 //方法
 Component.prototype.init=null;
 Component.prototype.on=function(event){};
 Component.prototype.destroy=null;
 Component.prototype.update=null;
}());

/*
 *视图接口描述:显示模型数据
 */
var View=(function(){
 /*
  *定义一个解析path的函数，用以把path转化成元素
  *@param path:string 用于定位元素的路径
  *@param ele:HTMLElement HTML元素，范围
  */
 function $$(path,ele)
 {
  //模式:匹配[""] 或者['']或者[数字]
  var regx=/\\[(.+)\\]/ig;
  var result;//模式匹配的结果
  var current=ele;//当前路径上的元素
  while((result=regx.exec(path))!==null)
  {
   //捕获组匹配的内容
   var groupText=result[1];
   //匹配的子字符串(子路径)
   var childPath=result[0];
   //下一次开始匹配的位置索引
   var nextIndex=regx.lastIndex;
   //以单引号或者双引号开头
   if(groupText.indexOf('"')===0 || groupText.indexOf("'")===0)
    {
     //去掉单引号和双引号
     groupText=groupText.substring(1,groupText.length-1);
     //作为id查询
     var ret=current.querySelectorAll("#"+groupText);
     if(ret && ret.length===0)
      //作为类选择符尝试
      ret=current.querySelectorAll("."+groupText);
     if(ret && ret.length===0)
      //作为name属性选择符
      ret=current.querySelectorAll("[name='"+groupText+"']");
     if(ret && ret.length===0)//作为元素属性名
       {
        ret=current.getAttributeNode(groupText);
        if(ret && nextIndex<path.length-1)//属性只能是终端节点
         throw new Error(ret+":属性名，只能在路径的终端！");
       }
     if(!ret || ret.length===0)//没找到
      throw new Error(path+":非法路径!");
    }
   //groupText是一个数字索性
   else if(/[0-9]+/gi.test(groupText))
    {
     ret=current[parseInt(groupText)];
    }    
   //进行下一次匹配
   if(ret && (ret instanceof NodeList) && nextIndex<path.length-1)//未匹配完
    {
       current=ret[0];
    }
   current=ret;
  }
  return current;
 }
 function View(selector)
 {
  
 }
 //方法
 View.prototype.update=null;
 View.prototype.read=null;
 View.prototype.insert=null;
 View.prototype.remove=null;
}());

/*
 *模型接口描述:用于MVC模式的模型
 *@param data  必须包含on属性，里面放置事件处理方法
 */
var Model=(function(){
 function Model(data)
 {
  //数据，对应视图的状态和事件代码
  this.data=data;
  this.onUpdate=new Event();
  this.onRead=new Event();
  this.onRemove=new Event();
  this.onInsert=new Event();
 }
 /*
  *修改对象的属性
  *@param path:string 用[]分隔的，对象属性导航字符串
  *@param value 新的属性值
  *@return value 返回新的值
  */
 Model.prototype.update=function(path,value){
  //如果path为空，默认this.data
  var value=eval(path?("this.data."+path):"this.data");
  this.onUpdate.notify({path:path,value:value});
  return value;
 };
  /*
  *读取对象的属性
  *@param path:string 用[]分隔的对象属性导航字符串
  *@return value 返回新的值
  */
 Model.prototype.read=function(path){
  //如果path为空，默认this.data
  var value=eval(path?("this.data."+path):"this.data");
  this.onRead.notify({path:path,value:value});
  return value;
 };
  /*
  *删除对象的属性或者数组元素
  *@param path:string 用[]分隔的对象属性导航字符串
  *@param index?:number 可选参数，数组索性
  *@return 返回被删除的值
  */
 Model.prototype.remove=function(path,index){
  //如果path为空，默认this.data
  var value=eval(path?("this.data."+path):"this.data");
  //对象是数组
  if(value.constructor===Array && index)
    {
     value.splice(index,1);
     path+="["+index+"]";
    }
  else
    delete value;
  this.onRead.notify({path:path,value:value});
  return value;
 };
  /*
  *创建对象的属性或者在数组中追加元素
  *@param path:string 用[]分隔的对象属性导航字符串
  *@param value  属性值
  *@param property?:string | number 可选，对象属性或者数组索引
  *@return value 返回新的值
  */
 Model.prototype.insert=function(path,value,property){
  //如果path为空，默认this.data
  var obj=eval(path?("this.data."+path):"this.data");
  //对象是数组
  if(obj.constructor===Array && typeof property==="number")
    {
     property=property || obj.length;
    }
  path+="["+property+"]";
  obj[property]=value;
  this.onInsert.notify({path:path,name:property,value:value});
  return value;
 };
 }());

/*
 *页面执行上下文接口描述:单例，也是一个控制器
 */
var Page=(function(){
 var Page={};
 //方法列表
 Page.init=null;
 Page.on=function(event){};
 Page.destroy=null;
 return Page;
}());
