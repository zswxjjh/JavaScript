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

(function () {
  /*
 * 所有节点类型
 * */
  Node.type = ['group', 'leaf', 'Shape2D', 'attributes-group'];

  /*
  * 定义Node接口(抽象类)
  * type:节点类型
  * id?:可选参数
  * parent?:可选参数
  * */
  function Node(type, id) {
    var _type = type
    var _parent;
    var _id = id;

    this.type = function (type) {
      if (type) {
        _type = type;

      }
      return _type;
    };
    this.parent = function (parent) {
      if (parent) {
        _parent = parent;
      }
      return _parent;
    };
    this.id = function (id) {
      if (id) {
        _id = id;
      }
      return _id;
    };
  }

  /*
  * 定义组接口：Group
  * */
  var Group = function (id) {
    Node.call(this, 'group', id);
    var _children = [];
    var _attributes = {};


    this.attributes = function () {
      return _attributes;
    };
    this.children = function () {
      return _children;
    };
    /*
    * 追加Leaf节点或者Group节点
   * */
    Group.$bind('appendChild', function (child) {
      if (child && !(child instanceof Node)) {
        throw new TypeError('"' + child + '" 不是一个Node或者子类型!');
      }
      //父亲为空
      if (!child.parent()) {
        //当前节点作为父节点
        child.parent(this);
        //继承属性
        if (child instanceof Group)
          child.attributes().extend(this.attributes());
      }
      //第一个儿子
      if(child  instanceof Behavior)
      {
        this.children().unshift(child);
      }
      else
      {
        this.children().push(child);
      }
      return this;
    });

    /*
    * 移除Leaf节点或者Group节点
    * */
    Group.$bind('removedChild', function (child) {
      if (child && !(child instanceof Node)) {
        throw new TypeError('"' + child + '" 不是一个Node或者子类型!');
      }
      var index = this.children().indexOf(child);
      if (index !== -1) {
        this.children().splice(index, 1);
      }
      return this;
    });

    Group.$bind('render', function (ctx, timestamp) {
     //保存模式和背景
      var obj = {};
      for (var key in this.attributes()) {
        var value = this.attributes()[key];
        if (ctx[key]) {
          ctx[key] = value;
        }
      }
      obj.mode = this.attributes().mode || 'stroke';
      if (this.attributes().bg)
        obj.bg = this.attributes().bg.background(ctx);
      if (obj.mode && obj.bg) {
        ctx[obj.mode + 'Style'] = obj.bg;
      }
      //儿子节点
      for (var i = 0; i < this.children().length; i++) {
        var child = this.children()[i];
        if (child instanceof Shape2D) {
          //绘制形状
          if (child.constructor === Image2D) {
             child.render(ctx);
          } else if (child.constructor === Text2D) {
            child[obj.mode](ctx);
          } else {
            ctx.beginPath();
            child.render(ctx);
            ctx.closePath();
            ctx[obj.mode]();
          }
        } else if (child instanceof Behavior) {
          child.execute(timestamp);
        }

      }
     });

  }.extend(Node);

  /*
  * 小工具
  * */
  function validate(regExp, value) {
    if (!regExp.test(value.toString())) {
      throw  new TypeError('"' + value + '"格式非法!');
    }
  }

  /*
  * 变换矩阵
  * */
  function Transform(a, b, c, d, e, f, g) {
    this.a = a || 1.0;
    this.b = b || 0.0;
    this.c = c || 0.0;
    this.d = d || 1.0;
    this.e = e || 0.0;
    this.f = f || 0.0;

    this.save=function(ctx)
    {
      var m = ctx.getTransform();
      this.a = m.a;
      this.b = m.b;
      this.c = m.c;
      this.d = m.d;
      this.e = m.e;
      this.f = m.f;
    };

    Transform.$bind('scale', function (ctx,x, y) {
      //使用当前变换
      ctx.setTransform(this.a,this.b,this.c,this.d,this.e,this.f);
      ctx.scale(x, y);
      //保存变换状态
      this.save(ctx);
      return this;
    });

    Transform.$bind('rotate', function (ctx,angle) {
      //使用当前变换
      ctx.setTransform(this.a,this.b,this.c,this.d,this.e,this.f);
      ctx.rotate(angle);
      //保存变换状态
      this.save(ctx);
      return this;
    });

    Transform.$bind('translate', function (ctx,x, y) {
      //使用当前变换
      ctx.setTransform(this.a,this.b,this.c,this.d,this.e,this.f);
      ctx.translate(x, y);
      //保存变换状态
      this.save(ctx);
      return this;
    });
  }

  /*
* 该类负责绘图变换属性的配置：TransformAttributes
* */
  var TransformGroup = function (id) {
    Group.call(this, 'transformGroup', id);
    //一组变换
    this.transform = new Transform();

  }.extend(Group);


  /*
* 该类负责绘图模式属性的配置：RenderModeAttributes
* */
  var RenderModeGroup = function (id) {
    Node.call(this, 'group', id);

    RenderModeGroup.$bind('mode', function (mode) {
      if (mode) {
        validate(/stroke|fill/g, mode);
        this.attributes().mode = mode;
      }
      return this.attributes().mode;
    });

  }.extend(Group);

  /*
* 该类负责绘制像素属性的配置：PixelAttributes
* */
  var PixelAttributes = function (id) {
    Node.call(this, 'group', id);

    PixelAttributes.$bind('globalAlpha', function (globalAlpha) {
      if (globalAlpha) {
        validate(/0\.\d/g, globalAlpha);
        this.attributes().globalAlpha = globalAlpha;
      }
      return this.attributes().globalAlpha;
    });

    PixelAttributes.$bind('imageSmoothingEnabled', function (imageSmoothingEnabled) {
      if (imageSmoothingEnabled) {
        validate(/true|false/g, imageSmoothingEnabled);
        this.attributes().imageSmoothingEnabled = imageSmoothingEnabled;
      }
      return this.attributes().imageSmoothingEnabled;
    });

  }.extend(Group);

  /*
* 该类负责绘制线属性的配置：LineAttributes
* */
  var LineAttributes = function (id) {
    Node.call(this, 'group', id);

    LineAttributes.$bind('cap', function (cap) {
      if (cap) {
        validate(/butt | round | square/g, cap);
        this.attributes().lineCap = cap;
      }
      return this.attributes().lineCap;
    });

    LineAttributes.$bind('join', function (join) {
      if (join) {
        validate(/bevel | round | miter/g, join);
        this.attributes().lineJoin = join;
      }
      return this.attributes().lineJoin;
    });

    LineAttributes.$bind('join', function (width) {
      if (width) {
        validate(/\d+/g, width);
        this.attributes().lineWidth = width;
      }
      return this.attributes().lineWidth;
    });

  }.extend(Group);

  /*
 * 该类负责绘制背景属性的配置：BackgroundAttributes
 * */
  var BackgroundGroup = function (id) {
    Node.call(this, 'group', id);

    BackgroundGroup.$bind('color', function (color) {
      if (arguments && arguments.length) {
        this.attributes().color = color;
      }
      return this.attributes().bg = color;
    });

    BackgroundGroup.$bind('gradient', function (gradient) {
      if (gradient) {
        this.attributes().gradient = gradient;
      }
      return this.attributes().bg = gradient;
    });

    BackgroundGroup.$bind('pattern', function (pattern) {
      if (pattern) {
        this.attributes().pattern = pattern;
      }
      return this.attributes().bg = pattern;
    });

  }.extend(Group);

  /*
  * 该类负责绘制阴影属性的配置：ShadowAttributes
  * */
  var ShadowAttributes = function (id) {
    Node.call(this, 'ShadowAttributes', id);

    ShadowAttributes.$bind('blur', function (blur) {
      if (blur) {
        validate(/\d+/g, blur);
        this.attributes().shadowBlur = blur;
      }
      return this.attributes().shadowBlur;
    });
    ShadowAttributes.$bind('color', function (color) {
      if (arguments && arguments.length) {
        this.attributes().shadowColor = color.toHexString();
      }
      return this.attributes().shadowColor;
    })

    ShadowAttributes.$bin('offsetX', function (offsetX) {
      if (offsetX) {
        validate(/\d+/g, offsetX);
        this.attributes().shadowOffsetX = offsetX;
      }
      return this.attributes().shadowOffsetX;
    })
    ShadowAttributes.$bin('offsetY', function (offsetY) {
      if (offsetY) {
        validate(/\d+/g, offsetY);
        this.attributes().shadowOffsetY = offsetY;
      }
      return this.attributes().shadowOffsetY;
    })


  }.extend(Group);
  /*
  * 该类负责绘制文本的配置：TextAttributes
  * */
  var TextAttributes = function (id) {
    Node.call(this, 'TextAttributes', id);
    /*
    * 定义常量:align=left | right| center | start | end
    * */
    if (!TextAttributes.ALIGN_LEFT) {
      TextAttributes.static_final('ALIGN_LEFT', 'left');
    }
    if (!TextAttributes.ALIGN_RIGHT) {
      TextAttributes.static_final('ALIGN_RIGHT', 'right');
    }
    if (!TextAttributes.ALIGN_CENTER) {
      TextAttributes.static_final('ALIGN_CENTER', 'center');
    }
    if (!TextAttributes.ALIGN_START) {
      TextAttributes.static_final('ALIGN_START', 'start');
    }
    if (!TextAttributes.ALIGN_END) {
      TextAttributes.static_final('ALIGN_END', 'end');
    }

    /*
    * 定义常量:baseLine ling=top | hanging | middle | alphabetic | ideographic | bottom
    * */
    if (!TextAttributes.BASELINE_TOP) {
      TextAttributes.static_final('BASELINE_TOP', 'top');
    }
    if (!TextAttributes.BASELINE_HANGING) {
      TextAttributes.static_final('BASELINE_HANGING', 'hanging');
    }
    if (!TextAttributes.BASELINE_MIDDLE) {
      TextAttributes.static_final('BASELINE_MIDDLE', 'middle');
    }
    if (!Text2DAttributes.BASELINE_BOTTOM) {
      TextAttributes.static_final('BASELINE_BOTTOM', 'bottom');
    }

    /*
     * get/set font 属性
     * font?:string
     * */
    TextAttributes.prototype.font = TextAttributes.prototype.font || function (font) {
      if (font) {
        validate(/\w\s+\w\s+\w/g, font);
        this.attributes().font = font;
      }
      return this.attributes().font;
    };
    /*
    * get/set align 属性
    * align?:string 文本的对齐属性
    * */
    TextAttributes.$bind('align', function (align) {
      if (align) {
        validate(/left | right| center | start | end/g, align);
        this.attributes().textAlign = align;
      }
      return this.attributes().textAlign;
    })

    /*
        * get/set baseLine2D 属性
        * baseLine2D:string
        * */

    TextAttributes.$bind('baseLine', function (baseLine) {
      if (baseLine) {
        validate(/top | hanging | middle | alphabetic | ideographic | bottom/g, baseLine);
        this.attributes().textBaseLine = align;
      }
      return this.attributes().textBaseLine;
    })
  }.extend(Group);

  /*
  * 定义叶子结点
  * */
  var Leaf = function (id) {
    Node.call(this, 'leaf', id);
  }.extend(Node);

  /*
  * 抽象类：Behavior
  * */
  var Behavior = function (id) {
    Leaf.call(this, id);
    Behavior.$bind('execute', function (timestamp) {
      throw  new Error('抽象方法，无法调用!');
    });
  }.extend(Leaf);

  /*
  * 定义行为类,负责动画，是一个Leaf节点，父节点只能是TransformGroup类型
  * loop：boolean，是否是一个循环
  * reverse：Boolean，是否可以反向运动
  * duration：动画持续的时间
  * */

  var LinearBehavior = function (callback,duration, loop,id) {
    Behavior.call(this, id);
    this.callback = callback;
    this.duration = duration;
    this.loop = loop?true:false;
    this.shouldAnimating=true;
    /*
    * 回调方法
    * timestamp：绘制帧里面的时间戳
    * */
    LinearBehavior.$bind('execute', function (timestamp) {
      if(!this.shouldAnimating)
        return;
      if (!this.startTime) {
        this.startTime = timestamp;
        //是否重新开始循环
        this.again=false;
      }
      var progress = Math.min((timestamp - this.startTime) / this.duration, 1.0);
      var alpha = linearAlpha(progress);
      if (progress < 1.0) {
        //处理alpha
        if(!this.callback(alpha,this.again,this.parent().transform))
        {
          this.shouldAnimating=false;
        }
      } else if (this.loop)/*上一次循环结束*/
      {
        this.startTime = timestamp;
        this.again=!this.again;
        this.shouldAnimating=true;
      }

    });
  }.extend(Behavior);

  /*
  * 定义几何形状（包括图像）:Shape2D
  *
  * */
  var Shape2D = function (id) {
    Node.call(this, 'Shape2D', id);
  }.extend(Leaf);

  /*
  * 定义抽象原生形状：Primitive
  * */
  var Primitive = function (id) {
    Shape2D.call(this, id);

  }.extend(Shape2D);

  /*
  * 定义线段：Line2D
  * */
  var Line2D = function (x1, y1, x2, y2, id) {
    Primitive.call(this, id);
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    Line2D.$bind('scale', function (x, y) {

    });
    Line2D.$bind('render', function (ctx) {
      ctx.moveTo(this.x1, this.y1);
      ctx.lineTo(this.x2, this.y2);
    })
  }.extend(Primitive);

  /*
 * 定义矩形：Rect
 * */
  var Rect2D = function (x, y, width, height, id) {
    Primitive.call(this, id);
    this.x = x;
    this.y = y;
    this.w = width;
    this.h = height;

    //中心点坐标
    this.origin = new Point(x / 2, y / 2);
    Rect2D.$bind('computedBounding', function () {
      return new Circle2D(this.x + this.w / 2, this.y + this.h / 2, Math.min(this.w, this.h) / 2);
    })

    Rect2D.$bind('render', function (ctx) {
      ctx.rect(this.x, this.y, this.w, this.h);

    })

  }.extend(Primitive);

  /*
 * 定义圆：Circle
 * */
  var Circle2D = function (x, y, radius, id) {
    Shape2D.call(this, id);
    this.x = x;
    this.y = y;
    this.r = radius;

    Circle2D.$bind('render', function (ctx) {
      ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    })
    Circle2D.$bind('computedBounding', function () {
      return this;
    })
  }.extend(Primitive);

  /*
 * 定义椭圆：Ellipse
 * */
  var Ellipse2D = function (x, y, radiusX, radiusY, id) {
    Shape2D.call(this, id);
    this.x = x;
    this.y = y;
    this.rx = radiusX;
    this.ry = radiusY;
    Ellipse2D.$bind('render', function (ctx) {

    })

  }.extend(Primitive);

  /*
 * 定义图像：Image2D
 * x:必须的，画布上的图像的x坐标
 * y：必须的，画布上的图像的y坐标
 * width?:可选的
 * height?:可选的
 * sx?:可选的，源图像的x坐标(裁剪)
 * sy?:可选的，源图像的y坐标(裁剪)
 * sWidth?:可选的，源图像的宽度(裁剪)
 * sHeight?:可选的，源图像的高度(裁剪)
 * */
  var Image2D = function (image, x, y, width, height, sx, sy, sWidth, sHeight, id) {
    Shape2D.call(this, id);
    this.image = image;
    this.x = x;
    this.y = y;
    this.w = image.width || width;
    this.h = image.height || height;
    this.sx = sx || 0;
    this.sy = sy || 0;
    this.sw = sWidth || image.width;
    this.sh = sHeight || image.height;
    //中心点坐标
    this.origin = new Point(x / 2, y / 2);
    Image2D.$bind('render', function (ctx) {
      ctx.drawImage(this.image, this.sx, this.sy, this.sw, this.sh, this.x, this.y, this.w, this.h);
    })
    Image2D.$bind('computedBounding', function () {
      return new Circle2D(this.x + this.w / 2, this.y + this.h / 2, Math.min(this.w, this.h) / 2);
    })


  }.extend(Primitive);

  /*
* 定义文本：Text2D
* */
  var Text2D = function (string, x, y, id) {
    Shape2D.call(this, id);
    this.text = string;
    this.x = x;
    this.y = y;

    Text2D.$bind('stroke', function (ctx) {
      ctx.strokeText(this.text, this.x, this.y);
    })
    Text2D.$bind('fill', function (ctx) {
      ctx.fillText(this.text, this.x, this.y);
    })

  }.extend(Primitive);

  /*
  * 复杂形状：Path
  * 子节点只允许是：Shape2D
  * */
  var Path2D = function (x, y, closed) {
    Shape2D.call(this, 'path');
    var children = [];//存储Primitive
    /*
    * 追加一个简单Shape2D
    * */
    Path2D.$bind('add', function (primitive) {
      if (primitive && !(primitive instanceof Primitive)) {
        throw new TypeError('"' + primitive + '" 不是一个Primitive子类型!');
      }
      children.push(primitive);
    })

    /*
   * 移除一个简单Shape2D
   * */
    Path2D.$bind('remove', function (primitive) {
      if (primitive && !(primitive instanceof Primitive)) {
        throw new TypeError('"' + primitive + '" 不是一个Primitive子类型!');
      }
      var index = children.indexOf(primitive);
      if (index !== -1) {
        children.splice(index, 1);
      }
    })

    Path2D.$bind('render', function (ctx) {
      for (var i = 0; i < children.length; i++)
        children[i].render(ctx);
    })
  }.extend(Shape2D);

  /*
  * 定义场景类作为根节点:Scene
  * */
  var Scene = function () {
    Group.call(this, null, 0);
    /*
    * render方法
    * */
    if (!Scene.prototype.hasOwnProperty('render'))
      Scene.prototype.render = function (ctx, timestamp)/*绘图上下文对象*/ {
        //广度优先搜索
        var queue = [];
        queue.push(this);
        do {
          //移除头部元素
          var e = queue.shift();
          //调用父类方法处理
          if (e instanceof Group) {

            Group.prototype.render.call(e, ctx, timestamp);
            //把儿子节点放入队列
            for (var i = 0; i < e.children().length; i++) {
              {
                var child = e.children()[i];
                queue.push(child);
              }

            }
          }
        } while (queue.length);
      };
  }.extend(Group);

  /*
  * 应用类：stage
  * ele:'#div'//一个CSS选择符或者一个元素
  * conf={
  *     opaque;true,
  *     resized:false,
  *     antialias:false,
  *     width:600,
  *     height:400
  * }
  * };
  * */
  function Stage(ele, conf) {
    if (!ele) {
      throw Error('缺少属性:ele,该属性是一个HTML元素的引用！');
    }
    var opaque = (conf && conf.opaque) || false;
    var antialias = (conf && conf.antialias) || false;
    //ele是一个选择符
    if (typeof ele === 'string')/*选择符*/
    {
      ele = document.querySelector(ele);
    }

    this.ctx = ele.getContext('2d', {opaque: opaque, antialias: antialias});
    ele.width = (conf && conf.width) || ele.width || window.innerWidth;
    ele.height = (conf && conf.height) || ele.height || window.innerHeight;
    /*
    * 随着窗口自动放缩
    * */
    if (conf && conf.resized) {
      var scaleX = window.innerWidth / this.ctx.canvas.width;
      var scaleY = window.innerHeight / this.ctx.canvas.height;

      var scaleToFit = Math.min(scaleX, scaleY);
      var scaleToCover = Math.max(scaleX, scaleY);

      this.ctx.canvas.style.transformOrigin = '0 0'; //scale from top left
      this.ctx.canvas.style.transform = 'scale(' + scaleToFit + ')';
    }
    /*
    * 设置：Scene
    * */
    Stage.$bind('setScene', function (scene) {
      this._scene = scene;
      return this;
    });
    /*
    * 计算舞台的尺寸
    * */
    Stage.$bind('getSize', function () {
      return this.ctx.canvas.getBoundingClientRect();
    });

    /*
    * 动画循环函数
    * */
    function loop(timestamp) {
      var self = this;
      var size=this.getSize();
      this.ctx.save();
      this.ctx.setTransform(1,0,0,1,0,0);
      this.ctx.clearRect(0,0,size.width,size.height);
      this.ctx.restore();
      this._scene.render(this.ctx, timestamp);
     if (this.animating) {
        window.requestAnimationFrame(function (timestamp) {
             loop.call(self,timestamp);
        });
      }
    }

    /*
   * 开始动画循环
   * */
    this.start = function () {
      this.animating = true;
      this._id = window.requestAnimationFrame(loop.bind(this));
    };

    /*
   * 结束动画循环
   * */
    this.stop = function () {
      this.animating = false;
      window.cancelAnimationFrame(this._id);
    };
  }

  //工具类

  /*
  * 接口
  * */
  function Background() {
    /*
    * 抽象方法
    * */
    Background.$bind('background', function () {
      throw new Error('Background.prototype.background:抽象方法不能调用!');
    });

  }

  var Gradient = function (colorStops) {
    this._colorStops = colorStops || [];

    Gradient.$bind('addColorStop', function (alpha, color) {
      validate(/0\.\d/g, alpha);
      this._colorStops.push(alpha);
      this._colorStops.push(color);
      return this;
    });

  }.extend(Background);

  /*
  *  repetition= repeat|repeat-x|repeat-y|no-repeat
  * */

  var Pattern = function (image, repetition) {
    validate(/repeat|repeat-x|repeat-y|no-repeat/g, repetition);
    this.image = image;
    this.repetition = repetition;

    if (!Pattern.REPEAT) {
      Pattern.static_final('REPEAT', 'repeat');
    }

    if (!Pattern.REPEAT_X) {
      Pattern.static_final('REPEAT_X', 'repeat-x');
    }

    if (!Pattern.REPEAT_Y) {
      Pattern.static_final('REPEAT_Y', 'repeat-y');
    }

    if (!Pattern.NO_REPEAT) {
      Pattern.static_final('NO_REPEAT', 'no-repeat');
    }

    /*
    * 转换成绘图上下文Pattrn
    * */
    Pattern.$bind('background', function (ctx) {
      return ctx.createPattern(this.image, thhis.repetition);
    });

  }.extend(Background);

  var LineGradient = function (line) {
    Gradient.call(this, []);
    this.line = line;

    /*
    * 覆盖抽象方法
    * */
    Gradient.$bind('background', function (ctx/*绘图上下文*/) {
      var g = ctx.createLinearGradient(this.line.p0.x, this.line.p0.y, this.line.p1.x, this.line.p1.y);
      for (var i = 0; i < this._colorStops.length; i += 2) {
        var dot = this._colorStops[i];
        var color = this._colorStops[i + 1];
        g.addColorStop(dot, color.toHexString());
      }
      return g;
    });

  }.extend(Gradient);

  var RadialGradient = function (circle0, circle1) {
    Gradient.call(this, []);
    this.circle0 = circle0;
    this.circle1 = circle1;

    /*
   * 覆盖抽象方法
   * */
    RadialGradient.$bind('background', function (ctx/*绘图上下文*/) {
      var g = ctx.createRadialGradient(this.circle0.x, this.circle0.y, this.circle0.r, this.circle1.x, this.circle1.y, this.circle1.r);
      for (var i = 0; i < this._colorStops.length; i += 2) {
        var dot = this._colorStops[i];
        var color = this._colorStops[i + 1];
        g.addColorStop(dot, color.toHexString());
      }
      return g;
    });

  }.extend(Gradient);

  function Circle(x, y, r) {
    this.x = x;
    this.y = y;
    this.r = r;
  }

  function Point(x, y) {
    this.x = x;
    this.y = y;
  }

  function Line(p0, p1) {
    this.p0 = p0;
    this.p1 = p1;
  }

  function Color(r, g, b, a) {
    this.r = r | 0;
    this.g = g | 0;
    this.b = b | 0;
    this.a = a | 0;

    Color.$bind('toString', function () {
      if (this.a) {
        return 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' + this.a + ')';
      } else {
        return 'rgb(' + this.r + ',' + this.g + ',' + this.b + ')';
      }
    });

    Color.$bind('toHexString', function () {
      return '#' + r.toString(16) + g.toString(16) + b.toString(16);
    });
    /*
   * 覆盖抽象方法
   * */
    Color.$bind('background', function (ctx/*绘图上下文*/) {
      return this.toString();
    });

  }
  Color.extend(Background);

  /*
  * 动画部分：Alpha函数
  * */

  //线性Alpha：y=x
  function linearAlpha(progress) {
    return progress;
  }

  //由慢到快 :y=x^i
  function easeIn(i) {
    return function (progress) {
      return Math.pow(progress, i);
    };
  }

  //由快到慢：y=1-(1-x)^i
  function easeOut(i) {
    return function (progress) {
      return 1 - Math.pow(1 - progress, i);
    };
  }

  j2d.Color = Color;
  j2d.Group = Group;
  j2d.Shape2D = Shape2D;
  j2d.Line2D = Line2D;
  j2d.Rect2D = Rect2D;
  j2d.Circle2D = Circle2D;
  j2d.Ellipse2D = Ellipse2D;
  j2d.Image2D = Image2D;
  j2d.Text2D = Text2D;
  j2d.Path2D = Path2D;
  j2d.Scene = Scene;
  j2d.LinearBehavior = LinearBehavior;
  j2d.TransformGroup = TransformGroup;
  j2d.RenderModeGroup = RenderModeGroup;
  j2d.PixelAttributes = PixelAttributes;
  j2d.LineAttributes = LineAttributes;
  j2d.Stage = Stage;
  //密封
  Object.freeze(j2d);
}());
