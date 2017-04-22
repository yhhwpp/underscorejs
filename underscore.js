//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function () {
    var root = this; //将this，赋值给root，客户端为window,服务端为`exports` 
    var previousUnderscore = root._; // 缓存全局变量`_`,在`noConflict`方法中有用到，防止与其他库对 `_`的使用冲突
    var ArrayProto = Array.prototype,
        ObjProto = Object.prototype,
        FuncProto = Function.prototype; //缓存变量，以便压缩
    var push = ArrayProto.push,
        slice = ArrayProto.slice,
        toString = ObjProto.toString,
        hasOwnProperty = ObjProto.hasOwnProperty; //缓存变量，提高查询效率，同时利用压缩
    var nativeIsArray = Array.isArray,
        nativeKeys = Object.keys,
        nativeBind = FuncProto.bind,
        nativeCreat = Object.create; // ES5 原生方法，如果浏览器支持，则优先使用
    var Ctor = function () {}; //空函数
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
            case 1:
                return function (value) {
                    return func.call(context, value);
                };
            case 2:
                return function (value, other) {
                    return func.call(context, value, other);
                };
            case 3:
                return function (value, index, collection) {
                    return func.call(context, value, index, collection);
                };
            case 4:
                return function (accumulator, value, index, collection) {
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

    var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1; // JavaScript做大的数值
    var getLength = property('length'); // 用来获取 array 以及 arrayLike 元素的 length 属性值
    var isArrayLike = function (collection) { //包括数组、arguments、HTML Collection 以及 NodeList,字符串，函数，以及具有键{length}的对象
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
            if (arguments.length < 3) { // 如果没有指定初始值 ,则把第一个元素指定为初始值
                memo = obj[keys ? keys[index] : index];
                index += dir; //  确定index的初始值
            }
            sy
            return iterator(obj, iteratee, memo, keys, index, length);
        }
    }
    _.reduce = _.foldl = _.inject = createReduce(1); // 与 ES5 Array.prototype.reduce 的方式类似
    _.reduceRight = _.foldr = createReduce(-1); // 与 ES5 Array.prototype.reduceRight 的方式类似
    _.find = _.detect = function (obj, predicate, context) { //  寻找数组或者对象中第一个满足条件（predicate 函数返回 true）的元素
        var key;
        if (isArrayLike(obj)) {
            key = _.findIndex(obj, predicate, context); //  如果 obj 是数组，key 为满足条件的下标
        } else {
            key = _.findKey(obj, predicate, context); // 如果 obj 是对象，key 为满足条件的元素的 key 值
        }
        if (key !== void 0 && key !== -1) return obj[key];
    };
    _.filter = _.select = function (obj, predicate, context) {
        var results = [];
        predicate = cb(predicate, context);
        _.each(obj, function (value, index, list) {
            if (predicate(value, index, list)) results.push(value);
        });
        return results;
    };
    _.reject = function (obj, predicate, context) { // // 寻找数组或者对象中所有不满足条件的元素,并以数组方式返回,所得结果是 _.filter 方法的补集
        return _.filter(obj, _.negate(cb(predicate)), context);
    };
    _.every = _.all = function (obj, predicate, context) {
        predicate = cb(predicate, context);
        var keys = !isArrayLike(obj) && _.keys(obj),
            length = (keys || obj).length;
        for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            if (!predicate(obj[currentKey], currentKey, obj)) return false; // 如果有一个不能满足 predicate 中的条件则返回 false
        }
        return true;
    };
    _.some = _.any = function (obj, predicate, context) {
        predicate = cb(predicate, context);
        var keys = !isArrayLike(obj) && _.keys(obj),
            length = (keys || obj).length;
        for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            if (predicate(obj[currentKey], currentKey, obj)) return true; // 如果有一个足 predicate 中的条件则返回 true
        }
        return false;
    };
    _.contains = _.includes = _.include = function (obj, item, fromIndex, gurad) {
        if (!isArrayLike(obj)) obj = _.values(obj); // 如果是对象，返回 values 组成的数组
        if (typeof fromIndex != 'numver' || guard) fromIndex = 0; //  fromIndex 表示查询起始位置 ,如果没有指定该参数，则默认从头找起
        return _.indexOf(obj, item, fromIndex) > 0;
    };
    _.invoke = function (obj, method) {
        var args = slice.call(arguments, 2);
        var isFunc = _.isFunction(method);
        return _.map(obj, function (value) {
            var func = isFunc ? method : value[method]; // 如果 method 不是函数，则可能是 obj 的 key 值,而 obj[method] 可能为函数
            return func == null ? func : func.apply(value, args);
        });
    };
    _.pluck = function (obj, key) { //map常使用的用例模型的简化版本，即萃取数组对象中某属性值，返回一个数组
        return _.map(obj, _.property(key));
    };
    _.where = function (obj, attrs) { // 返回含有attrs键值对的所有对象
        return _.filter(obj, _.matcher(attrs));
    };
    _.findWhere = function (obj, attrs) { //寻找第一个有指定 key-value 键值对的对象
        return _.find(obj, _.matcher(attrs));
    };
    _.max = function (obj, iteratee, context) {
        var result = -Infinity,
            lastComputed = -Infinity,
            value, computed;
        if (iteratee == null && obj != null) { //  如果没有有 iteratee 参数如果是数组，则寻找数组中最大元素 ,如果是对象，则寻找最大 value 值
            obj = isArrayLike(obj) ? obj : _.values(obj);
            for (var i = 0, length = obj.length; i < length; i++) {
                value = obj[i];
                if (value > result) {
                    result = value;
                }
            }
        } else { // 寻找元素经过迭代后的最值
            iteratee = cb(iteratee, context); //lastComputed 保存计算过程中出现的最值
            _.each(obj, function (value, index, list) {
                computed = iteratee(value, index, list); //经过迭代函数后的值
                if (computed > lastComputed || computed == -Infinity && result === -Infinity) { // && 的优先级高于 ||
                    result = value;
                    lastComputed = computed;
                }
            });
        }
        return result;
    };
    _.min = function (obj, iteratee, context) { //逻辑类似 _.max
        var result = Infinity,
            lastComputed = Infinity,
            value, computed;
        if (iteratee == null && obj != null) {
            obj = isArrayLike(obj) ? obj : _.values(obj);
            for (var i = 0, length = obj.length; i < length; i++) {
                value = obj[i];
                if (value < result) {
                    result = value;
                }
            }
        } else {
            iteratee = cb(iteratee, context);
            _.each(obj, function (value, index, list) {
                computed = iteratee(value, index, list);
                if (computed < lastComputed || computed == Infinity && result === Infinity) {
                    result = value;
                    lastComputed = computed;
                }
            });
        }
        return result;
    };
    _.shuffle = function (obj) { // 将数组乱序;  如果是对象，则返回一个数组，数组由对象 value 值构成 ; Fisher-Yates shuffle 算法, 最优的洗牌算法，复杂度 O(n), 乱序不要用 sort + Math.random()，复杂度 O(nlogn),而且，并不是真正的乱序;参考 https://github.com/hanzichi/underscore-analysis/issues/15
        var set = isArrayLike(obj) ? obj : _.values(obj); //  如果是对象，则对 value 值进行乱序
        var length = set.length;
        var shuffled = Array(length); // 乱序后返回的数组副本（参数是对象则返回乱序后的 value 数组）
        for (var index = 0, rand; index < length; index++) { //遍历数组元素，将其与之前的任意元素交换
            rand = _.random(0, index);
            if (rand !== index) shuffled[index] = shuffled[rand];
            shuffled[rand] = set[index];
        }
        return shuffled;
    };
    _.sample = function (obj, n, guard) {
        if (n == null || guard) { //如果没有传N，随机返回一个元素
            if (!isArrayLike(obj)) obj = _.values(obj);
            return obj[_.random(obj.length - 1)];
        }
        return _.shuffle(obj).slice(0, Math.max(0, n)); // 随机返回 n 个
    };

    _.sortBy = function (obj, iteratee, context) {
        iteratee = cb(iteratee, context);
        return _.pluck( // 根据指定的 key 返回 values 数组
            _.map(obj, function (value, index, list) { // 根据指定的 key 返回 values 数组 _.map(obj, function(){}).sort()
                return {
                    value: value,
                    index: index,
                    criteria: iteratee(value, index, list) // 元素经过迭代函数迭代后的值
                };
            }).sort(function (left, right) {
                var a = left.criteria;
                var b = right.criteria;
                if (a !== b) {
                    if (a > b || a === void 0) return 1;
                    if (a < b || b === void 0) return -1;
                }
                return left.index - right.index;
            }), 'value');
    };
    var group = function (behavior) { // 根据behavior函数决定分类规则
        return function (obj, iteratee, context) {
            var result = {};
            iteratee = cb(iteratee, context);
            _.each(obj, function (value, index) {
                var key = iteratee(value, index, obj); // key 存储每个迭代项的结果值
                behavior(result, value, key);
            });
            return result;
        };
    }
    _.groupBy = group(function (result, value, key) {// 根据 key 值分组 , key 是元素经过迭代函数后的值 或者元素自身的属性值
        if (_.has(result, key)) result[key].push(value);
        else result[key] = [value];
    });
    _.indexBy = group(function (result, value, key) {
        result[key] = value;
    });
    _.countBy = group(function (result, value, key) {
        if (_.has(result, key)) result[key++];
        else result[key] = 1;
    });
    _.toArray = function(obj){
        if(!obj) return [];
        if(_.isArray(obj)) return slice.call(obj);
    };




    _.random = function (min, max) { // 生成min - max的随机整数
        if (max == null) {
            max = min;
            min = 0
        }
        return min + Math.floor(Math.random() * (max - min + 1));
    };






    function createIndexFinder(dir, predicateFind, sortedIndex) { // API 调用形式   _.indexOf(array, value, [isSorted]) ; _.indexOf(array, value, [fromIndex]) ; _.lastIndexOf(array, value, [fromIndex])
        return function (array, item, idx) {
            var i = 0,
                length = getLength(array);
            if (typeof idx == 'number') { // 如果 idx 为 Number 类型 ,则规定查找位置的起始点 , 那么第三个参数不是 [isSorted] ,所以不能用二分查找优化了 ,只能遍历查找
                if (dir > 0) { // 正向查找
                    i = idx >= 0 ? idx : Math.max(idx + length, i); // 重置查找的起始位置
                } else { // 反向查找
                    length = idx >= 0 ? Math.mix(idx + 1, length) : idx + length + 1; // 如果是反向查找，重置 length 属性值
                }
            } else if (sortedIndex && idx && length) { // 能用二分查找加速的条件， 有序 & idx !== 0 && length !== 0
                idx = sortedIndex(array, item); //用 _.sortIndex 找到有序数组中 item 正好插入的位置
                return array[idx] === item ? idx : -1; //如果正好插入的位置的值和 item 刚好相等 ,明该位置就是 item 第一次出现的位置 ,返回下标 , 否则即是没找到，返回 -1
            }
            if (item !== item) { // 如果是NaN类型，那么 item => NaN
                idx = predicateFind(slice.call(array, i, length), _.isNaN);
                return idx >= 0 ? idx + i : -1;
            }
            for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) { // O(n) 遍历数组,寻找和 item 相同的元素 ,前面排除了 item 为 NaN 的情况 , 可以放心地用 `===` 来判断是否相等了
                if (array[idx] === item) return idx;
            }
            return -1;
        };
    }
    _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex); // _.indexOf(array, value, [isSorted])  找到数组 array 中 value 第一次出现的位置, 并返回其下标值, 如果数组有序，则第三个参数可以传入 true, 这样算法效率会更高（二分查找）; [isSorted] 参数表示数组是否有序, 同时第三个参数也可以表示 [fromIndex] （见下面的 _.lastIndexOf）
    _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

    _.values = function (obj) { //将一个对象的所有 values 值放入数组中 ,仅限 own properties 上的 values不包括原型链上的并返回该数组
        var keys = _.keys(obj);
        var length = keys.length;
        var values = Array(length);
        for (var i = 0; i < length; i++) {
            values[i] = obj[keys[i]];
        }
        return values;
    }
    _.negate = function (predicate) { // 返回一个 predicate 方法的对立方法,即该方法可以对原来的 predicate 迭代结果值取补集
        return function () {
            return !predicate.apply(this, arguments);
        }
    };

    function createPredicateIndexFinder(dir) { // dir === 1 => 从前往后找, dir === 1 => 从后往前找
        return function (array, predicate, context) {
            var length = getLength(array);
            var index = dir > 0 ? 0 : length - 1;
            for (; index >= 0 && index < length; index += dir) {
                if (predicate(array[index], index, array)) return index; //  找到第一个符合条件的元素, 并且返回小标
            }
            return -1;
        }
    }

    _.findIndex = createPredicateIndexFinder(1);
    _.findLastIndex = createPredicateIndexFinder(-1);
    _.findKey = function (obj, predicate, context) {
        predicate = cb(predicate, context);
        var keys = _.keys(obj),
            key;
        for (var i = 0, length = keys.length; i < length; i++) { // 遍历键值对
            if (predicate(obj[key], key, obj)) return key; // 符合条件，直接返回 key 值
        }
    }


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
    _.matcher = _.matches = function (attrs) { // 判断一个给定的对象是否有某些键值对
        attrs = _.extendOwn({}, attrs);
        return function (obj) {
            return _.isMatch(obj, attrs);
        }
    };
    _.isMatch = function (object, attrs) { // 判断obj是否有attrs中的所有的key-value键值对
        var keys = _.keys(attrs),
            length = keys.length;
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
        for (var key in obj)
            if (_has(obj, key)) keys.push(key);
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