//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function () {
    var root = this; //将this，赋值给root，客户端为window,服务端为`exports` 
    var previousUnderscore = root._; // 缓存全局变量`_`,在`noConflict`方法中有用到，防止与其他库对 `_`的使用冲突
    var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype; //缓存变量，以便压缩
    var push = ArrayProto.push,
        slice = ArrayProto.slice,
        toString = ObjProto.toString,
        hasOwnProperty = ObjProto.hasOwnProperty; //缓存变量，提高查询效率，同时利用压缩
    var nativeIsArray = Array.isArray,
        nativeKeys = Object.keys,
        nativeBind = FuncProto.bind,
        nativeCreat = Object.create; // ES5 原生方法，如果浏览器支持，则优先使用
    var Ctor = function () { }; //空函数
    var _ = function (obj) { //构造函数
        if (obj instanceof _) return obj; //如果obj是_实例，直接返回
        if (!(this instanceof _)) { //如果不是实例,需要返回实例化对象
            return new _(obj);
        }
        this._wrapped = obj; //将obj赋值给_wrapped属性，供后面_.mixin方法调用
    };
    if (typeof exports !== 'undefined') { //_暴漏给全局对象，客户端：window._ = _, 服务端： exports._ = _
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = _;
        }
        exports._ = _;
    } else {
        root._ = this;
    }
    _.VERSION = '1.8.3'; //版本号
    var optimizeCb = function (func, context, argCout) { //内部方法，根据context以及参数数量，返回一些回调，迭代方法
        if (context === void 0) return func; // 这里 void 0 === undefined，因为undefined不是保留字，可以被重写
        switch (argCout == null ? 3 : argCout) { // 这里switch直接删除也可以，之所以这样写，是因为call比apply快很多,
            case 1: return function (value) {
                return func.call(context, value);
            };
            case 2: return function (value, other) {
                return func.call(context, value, other);
            };
            case 3: return function (value, index, collection) {
                return func.call(context, value, index, collection);
            };
            case 4: return function (accumulator, value, index, collection) {
                return func.call(context, accumulator, value, index, collection);
            };
        }
        return function () {
            return func.apply(context, arguments);
        }
    };

    if (typeof /./ != 'function' && typeof Int8Array != 'object') { // _.isFunction兼容处理
        _.isFunction = function (obj) {
            return typeof obj == 'function' || false;
        };
    }




}.call(this)); // 设置匿名函数的context外层全局变量，浏览器环境为window.











