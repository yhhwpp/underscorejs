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
        root._ = _;
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
    var cb = function (value, context, argCout) { //callback的统一处理，应用于collection的每个元素
        if (value == null) return _.identity;
        if (_.isFunction(value)) return optimizeCb(value, context, argCout);
        if (_.isObject(value)) return _.matcher(value);
        return _.property(value);
    };
    _.iteratee = function (value, context) {
        return cb(value, context, Infinity);
    };
    var createAssigner = function (keysFunc, undefineOnly) { // 用到的函数 _.extend = createAssigner(_.allKeys); _.extendOwn  = createAssigner(_.keys); _.defaults = createAssigner(_.allKeys, true)
        return function (obj) {
            var length = arguments.length;
            if (length < 2 || obj == null) return obj;
            for (var index = 1; index < length; index++) { // 获取第一个参数除外的对象参数
                var source = arguments[index],
                    keys = keysFunc(source),
                    l = keys.length;
                for (var i = 0; i < l; i++) {
                    var key = keys[i];
                    if (!undefineOnly || obj[key] === void 0) obj[key] = source[key]; // _.defaults中有key 的取以首次出现的, 而_.extend 和 _.extendOwn后面对象的键值对直接覆盖前面的
                }
            }
            return obj;
        };
    };
    var baseCreate = function (prototype) { // 继承函数
        if (!_.isObject(prototype)) return {};
        if (nativeCreat) return nativeCreat(prototype);
        Ctor.prototype = prototype;
        var result = new Ctor;
        Ctor.prototype = null; // 释放Ctor.prototype的内存，保证Ctor是真正的空函数，这里Ctor.prototype重新分配了地址，并不影响实例result的原型链
        return result;
    };
    var property = function (key) {
        return function (obj) {
            return obj == null ? void 0 : obj[key];
        }
    };

    var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;// JavaScript做大的数值
    var getLength = property('length'); // 用来获取 array 以及 arrayLike 元素的 length 属性值
    var isArrayLike = function (collection) {//包括数组、arguments、HTML Collection 以及 NodeList,字符串，函数，以及具有键{length}的对象
        var length = getLength(collection);
        return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
    };



    // 扩展方法
    _.each = _.forEach = function (obj, iteratee, context) { // 与 ES5 Array.prototype.forEach一直
        iteratee = optimizeCb(iteratee, context); // 根据 context 确定不同的迭代函数
        var i, length;
        if (isArrayLike(obj)) {
            for (i = 0, length = obj.length; i < length; i++) {
                iteratee(obj[i], i, obj);
            }
        } else { // 如果是对象，遍历处理 values 值
            var keys = _.keys(obj);
            for (i = 0, length = obj.length; i < length; i++) {
                iteratee(obj[keys[i]], keys[i], obj);
            }
        }
        return obj;
    };
    _.map = _.collect = function (obj, iteratee, context) {
        iteratee = cb(iteratee, context); // 根据 context 确定不同的迭代函数
        var keys = !isArrayLike(obj) && _.keys(obj), // 如果传参是对象，则获取它的 keys 值数组（短路表达式）
            length = (keys || obj).length, // 如果 obj 为对象，则 length 为 key.length， 如果 obj 为数组，则 length 为 obj.length
            results = Array(length);
        for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            results[index] = iteratee(obj[currentKey], currentKey, obj);
        }
        return results;
    }
    function createReduce(dir) { //dir === 1 -> _.reduce, dir === -1 -> _.reduceRight
        function iterator(obj, iteratee, memo, keys, index, length) {
            for (; index >= 0 && index < length; index += dir) {
                var currentKey = keys ? keys[index] : index;
                memo = iteratee(memo, obj[currentKey], currentKey, obj); // 迭代，返回值供下次迭代调用 
            }
            return memo; // 每次迭代返回值，供下次迭代调用
        }
        return function (obj, iteratee, memo, context) {
            iteratee = optimizeCb(iteratee, context, 4); // 可传入的 4 个参数
            var keys = !isArrayLike(obj) && _.keys(obj),
                length = (keys || obj).length,
                index = dir > 0 ? 0 : length - 1;
            if (arguments.length < 3) {  // 如果没有指定初始值 ,则把第一个元素指定为初始值
                memo = obj[keys ? keys[index] : index];
                index += dir; //  确定index的初始值
            }
            return iterator(obj, iteratee, memo, keys, index, length);
        }
    }
    _.reduce = _.foldl = _.inject = createReduce(1); // 与 ES5 Array.prototype.reduce 的方式类似
    _.reduceRight = _.foldr = createReduce(-1);// 与 ES5 Array.prototype.reduceRight 的方式类似
    _.find = _.detect = function (obj, predicate, context) { //  寻找数组或者对象中第一个满足条件（predicate 函数返回 true）的元素
        var key;
        if (isArrayLike(obj)) {
            key = _.findIndex(obj, predicate, context);//  如果 obj 是数组，key 为满足条件的下标
        } else {
            key = _.findKey(obj, predicate, context); // 如果 obj 是对象，key 为满足条件的元素的 key 值
        }
        if (key !== void 0 && key !== -1) return obj[key];
    }

    function createPredicateIndexFinder(dir) {
        return function (array, predicate, context) {
            var length = getLength(array);
            var index = dir > 0 ? 0 : length - 1;
            for (; index >= 0 && index < length; index += dir) {
                if (predicate(array[index], index, array)) return index;
            }
            return -1;
        }
    }

    _.findIndex = createPredicateIndexFinder(1);
    _.findLastIndex = createPredicateIndexFinder(-1);


    _.property = property;



    if (typeof /./ != 'function' && typeof Int8Array != 'object') { // _.isFunction兼容处理
        _.isFunction = function (obj) {
            return typeof obj == 'function' || false;
        };
    }

    _.isObject = function (obj) { // 判断是否为对象，这里对象包括function 和 object
        var type = typeof obj;
        return type === 'function' || type == 'object' && !!obj; // 这里排除null
    };
    _.matcher = _.matches = function (attrs) {// 判断一个给定的对象是否有某些键值对
        attrs = _.extendOwn({}, attrs);
        return function (obj) {
            return _.isMatch(obj, attrs);
        }
    };
    _.isMatch = function (object, attrs) { // 判断obj是否有attrs中的所有的key-value键值对
        var keys = _keys(attrs), length = keys.length;
        if (object == null) return !length;
        var obj = Object(object); // 这一步感觉没必要
        for (var i = 0; i < length; i++) {
            var key = keys[i];
            if (attrs[key] !== obj[key] || !(key in obj)) return false;
        }
        return true;
    };
    _.keys = function (obj) {
        if (!_.isObject(obj)) return [];
        if (nativeKeys) return nativeKeys(obj);
        var keys = [];
        for (var key in obj) if (_has(obj, key)) keys.push(key);
        return keys;
    };
    _.has = function (obj, key) { //判断对象中是否有指定 key
        return obj != null && hasOwnProperty.call(obj, key); // 这里是防止hasOwnProperty 作为属性带来问题, 参见https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwnProperty
    };
    _.identity = function (value) { // 返回传入的参数
        return value
    }
    _.extendOwn = _.assign = createAssigner(_.keys); //跟 extend 方法类似，但是只把 own properties 拷贝给第一个参数对象  只继承 own properties 的键值对
    // 参数个数 >= 1


}.call(this)); // 设置匿名函数的context外层全局变量，浏览器环境为window.











