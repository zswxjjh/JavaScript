/**

 * @author 江金汉

 * @date  2021/4/12

 */
'use  strict';//严格模式

/*定义一个命名空间函数*/
var $$ = function(){};

/*
 *在对象中通过prototype属性获取当前对象的原型
 */
Object.defineProperty(Object.prototype,{
  //不可枚举
  enumerable:false,
  //不可删除
  configurable:false,
  get:function(){
       return this.getPrototype();
      }
});

/*
 *工具函数：通过对象获取对象的原型
 */
Object.prototype.getPrototype=function()
{
var prototype=null;
if(Object.getPrototypeOf)
   prototype=Object.getPrototypeOf(this);
else if(this.constructor)
   prototype=this.constructor.prototype;
return prototype;
};

/*
 *工具函数：通过对象在对象原型中添加方法
 */
Object.prototype.method=function(name,func){
 if(typeof func!=="function")
  throw new TypeError(func+":不是一个函数！");
 var prototype=this.getPrototype();
 //不允许重复添加
 if(prototype && !prototype.hasOwnProperty(name))
  prototype[name]=func;
 else
  throw new TypeError("添加函数:("+func+")失败！");
};

/*
 *克隆对象里面自定义的属性，参数是一个
 *或者多个对象，返回一个新对象
 */
function  deepClone()
{
  var  newObj={};
  for(var i=0;i<arguments.length;i++)
     {
       var obj=arguments[i];
      //获取所有非原型的属性集合名，包括
     //不可枚举的属性
       var names=Object.getOwnPropertyNames(obj);
       for(var j=0;j<names.length;j++)
         {
          var  key=names[j];
          var  value=obj[key];
          //属性值是对象类型
          if(value instanceof  Object)
            {               
            newObj[key]=deepClone(value);
            }
         //属性值是数组类型
         else if(value instanceof  Array) 
            {
               var array=newObj[key]=[];
               for(var n=0;n<value.length;n++)
             {
               var val=value[n];
               //元素值是对象
               if(val instanceof  Object)                
                   array.push(deepClone(val));                
              else                
                   array.push(val);                
             }
            }
          else//基本类型或者函数类型
              newObj[key]=value;         
         }
     }
   return   newObj;
}

/*
 *工具函数：对象继承
 *@param son:表示儿子对象
 *@param parent:表示父亲对象
 *@return 新的儿子对象
 */
function  extend(son,parent)
{
   /*为了让新对象复制儿子对象中已有的属性，我们需要改造son
     *使其具有这种形式:{a:属性描述符对象,b:属性描述符对象}
     *注意Object.getOwnPropertyNames(son)返回所有自有(非继承)属性，包括不可枚举的
     */
    var names = Object.getOwnPropertyNames(son);
    var obj={};//复制son的临时对象
    for (var i = 0; i < names.length; i++) {
       obj[names[i]]=Object.getOwnPropertyDescriptor(son, names[i]);
    }
    //创建新的对象，以parent作为原型
    return Object.create(parent,obj);   
}

/*
* 定义:extend,用于类继承
* 参数:父类型，可以是对象或者构造函数
* 返回值：升级版的子类,比如:A'=A.extend(B);
* */
Function.prototype.extend = function (parent) {
  if(this._super)
    {
     throw new Error("超类已经存在，不可重复继承！");
    }
  var Parent = parent || Object;
  //父类是个object
  if(typeof Parent==="object")
    {
     //临时函数
     var F=function(){};
     F.prototype=Parent;
     F.prototype.constructor=F;
     Parent=F;
    }
  if (typeof Parent === 'function') {
  //生成升级版的子类构造函数
    var prototype=extend(this.prototype,Parent.prototype);
    //保存父类的原型
    Object.defineProperty(this,"_super",{
    value:Parent.prototype,
    writable:true,
    enumerable:false,
    configurable:false
  });
    //修改原型的constructor属性，为this
    prototype.constructor = this;
    this.prototype = prototype;
    return this;
  } else {
    throw  new TypeError('参数：' + p + '类型不合法!');
  }
};

/*
* 在函数原型里绑定方法
* */
Function.prototype.method = function (name, func) {
  if (!this.prototype.hasOwnProperty(name)) {
    this.prototype[name] = func;
  }
};

/*
* 在函数中定义常量,只读
* */
Function.prototype.static_final = function (key, value) {
  Object.defineProperty(this, key, {
    writable: false,
    configurable: false,
    enumerable: false,
    value: value
  });
};

/*
* 对象继承，复制自有的属性
* */
Object.prototype.extend = function (parentObj) {
  if (typeof parentObj !== 'object') {
    throw new TypeError('参数必须是对象!');
  }
    return extend(this,parentObj); 
};

/*
*定义一个函数Class，用来定义一个类
*第一个参数是一个对象，包含定义类的内容，包括：
*1，构造函数_constructor
*2，原型方法列表
*第二个参数可选，表示父类构造函数,缺省就是Object
*返回值是子类构造函数
*/
var Class=function(def,parent){
   //共享的临时构造函数，避免每次继承都使用不同的临时
   //构造函数，多耗费点内存
    var  F=function(){};
    //如果没有定义构造函数，生成子类构造函数
    var Child=function(){
        //调用父类的构造函数
        if(Child.parent&&Child.parent.hasOwnProperty("_constructor"))
          {
           Child.parent.apply(this,arguments);
          }     
        
      };
        //新的构造函数，如果def包含构造函数，直接返回
         Child=def._constructor || Child;

        //继承
       parent=parent || Object;
       F.prototype=parent.prototype;
       Child.prototype=new F();
       //保存父类的原型
       Child.parent=parent.prototype;
       //修改构造函数指针
       Child.prototype.constructor=Child;

       //添加原型方法，包括了构造函数
        for(var key in def)
          {
           if(def.hasOwnProperty(key)&&key!=="_constructor")
             {
                 Child.prototype[key]=def[key];
             }
          }

          //返回新的Class
           return Child;
};
  //密封
  Object.freeze($$);

