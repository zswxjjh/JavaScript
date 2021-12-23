var j2d=function(){};
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
