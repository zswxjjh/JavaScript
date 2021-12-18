
/**
 * @author 江金汉
 * @date  2021/12/17
 */
'use  strict';//严格模式

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
              listener.apply(null,arguments);
            if(listener instanceof Object)
              listener.update.apply(listener,arguments);
          }               
       }
   };
}());

/*
*抽象监听者类：用于监听器模式
*/
var Listener=(function(){
    var Listener=function(){};
    Listener.prototype.update=function(){};
    return Listener;
  }());

/*
*抽象模型类，实现基本功能，负责业务逻辑
*表示表格数据
*/
var  Model=(function(){
   //构造函数，key表示主键字段
   function Model(key)
    {
      //存储表格数据
      this.items=[];
      this.key=key;
    }
   /*
    *追加一个或者多个记录数据
   */
    Model.prototype.add=function()
      {
        for(var i=0;i<arguments.length;i++)
         {
          this.items.push(arguments[i]);
         }
      };
    /*
     *删除一个或者多个记录
     */
    Model.prototype.remove=function()
      {
        var key=this.key;
        for(var i=0;i<arguments.length;i++)
         {
          if(arguments[i][key]===)
          this.items.(arguments[i]);
         }
      };
    /*
     *查询一条或者多条记录
     */
    Model.prototype.get=function()
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

    Model.prototype.update=function(item,key)
      {
        this.items[key]=item;
      };
 }());
