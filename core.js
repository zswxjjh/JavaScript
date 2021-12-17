/**

 * @author 江金汉

 * @date  2021/4/12

 */
'use  strict';//严格模式

/*定义一个命名空间函数*/
var $$ = function(){};


/*
* 定义:extend,用于类继承
* 参数:父类型
* 返回值：升级版的子类,比如:A'=A.extend(B);
* */
Function.prototype.extend = function (parent) {
  var p = parent || Object;
  if (typeof p === 'function') {
    //创建新的原型对象，以parent的原型或者Object原型作为原型
    var prototype = Object.create(p.prototype);
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
Function.prototype.$bind = function (name, func) {
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
  //以parentObj作为原型创建一个空对象
  var newObj = Object.create(parentObj);
  //返回所有的自有的对象属性名
  var names = Object.getOwnPropertyNames(this);
  for (var i = 0; i < names.length; i++) {
    //var value=this[names[i]];
    Object.defineProperty(newObj, names[i], Object.getOwnPropertyDescriptor(this, names[i]))
  }
  return newObj;
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

/*
* 跨平台的优化的requestAnimationFrame函数和cancelRequestAnimationFrame函数
*
* */
(function () {
  var prefixes = ['ms', 'o', 'webkit', 'moz'];
  for (var i = 0; i < prefixes.length && !window.requestAnimationFrame; i++) {
    var prefix = prefixes[i];
    window.requestAnimationFrame = window[prefix + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[prefix + 'CancelAnimationFrame'];
  }

  //寻找一个刷新的替代品，使用定时器
  if (!window.requestAnimationFrame) {
    var lasttime = 0;//下一次回调的期望时间戳
    window.requestAnimationFrame = function (callback, element/*HtmlCanvasElement*/) {
      //获取当前的时间戳
      var current = new Date().getTime();
      //帧刷新的频率
      var callToTime = Math.max(0, 1000 / 60 - (current - lasttime));
      var id = window.setTimeout(function () {
        //Firefox需要的参数时间戳
        callback(current + callToTime);
      }, callToTime);
      //更新时间戳lasttime
      lasttime = current + callToTime;
      return id;
    };
    //提供替代品
    window.cancelRequestAnimationFrame = function (id) {
      clearTimeout(id);
    };
  }
}());

  //密封
  Object.freeze($$);
}());
