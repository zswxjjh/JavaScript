
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
        };
      };
  }());

/*
 *模型接口:用于MVC模式的模型
 */
var Model=(function(){
    return {
     //CRUD操作
     insert:function(){},
     read:function(){},
     update:function(){},
     remove:function(){}
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
 *视图接口:显示模型数据
 */
var View=(function(){
 return {
    //更新视图
    update:function(){},
    //渲染视图
    render:function(){} 
  };
}());

/*
 *控制器对象，单例
 */
var Controller=(function(){
  var c={};  
  //初始化，一般绑定事件，最好用事件委托方式
  c.init=function(){};
  //处理事件
  c.on=function(event){};
  //销毁控制器，比如移除事件处理器
  c.destroy=function(){};
  return c;
}());
