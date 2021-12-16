/**

 * @author 江金汉

 * @date  2021/4/12

 */
'use  strict';

var j2d = {};
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
  Object.freeze(j2d);
}());
