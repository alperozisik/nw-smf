//code below here is for body-parser
(function bodyParser() {

    var Utils = {};

    // Declare internals

    var internals = {
        delimiter: '&',
        depth: 5,
        arrayLimit: 20,
        parameterLimit: 1000,
        strictNullHandling: false,
        plainObjects: false,
        allowPrototypes: false,
        allowDots: false
    };
    internals.hexTable = new Array(256);
    for (var h = 0; h < 256; ++h) {
        internals.hexTable[h] = '%' + ((h < 16 ? '0' : '') + h.toString(16)).toUpperCase();
    }


    Utils.arrayToObject = function(source, options) {

        var obj = options.plainObjects ? Object.create(null) : {};
        for (var i = 0, il = source.length; i < il; ++i) {
            if (typeof source[i] !== 'undefined') {

                obj[i] = source[i];
            }
        }

        return obj;
    };


    Utils.merge = function(target, source, options) {

        if (!source) {
            return target;
        }

        if (typeof source !== 'object') {
            if (Array.isArray(target)) {
                target.push(source);
            }
            else if (typeof target === 'object') {
                target[source] = true;
            }
            else {
                target = [target, source];
            }

            return target;
        }

        if (typeof target !== 'object') {
            target = [target].concat(source);
            return target;
        }

        if (Array.isArray(target) &&
            !Array.isArray(source)) {

            target = Utils.arrayToObject(target, options);
        }

        var keys = Object.keys(source);
        for (var k = 0, kl = keys.length; k < kl; ++k) {
            var key = keys[k];
            var value = source[key];

            if (!Object.prototype.hasOwnProperty.call(target, key)) {
                target[key] = value;
            }
            else {
                target[key] = Utils.merge(target[key], value, options);
            }
        }

        return target;
    };


    Utils.decode = function(str) {

        try {
            return decodeURIComponent(str.replace(/\+/g, ' '));
        }
        catch (e) {
            return str;
        }
    };

    Utils.encode = function(str) {

        // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
        // It has been adapted here for stricter adherence to RFC 3986
        if (str.length === 0) {
            return str;
        }

        if (typeof str !== 'string') {
            str = '' + str;
        }

        var out = '';
        for (var i = 0, il = str.length; i < il; ++i) {
            var c = str.charCodeAt(i);

            if (c === 0x2D || // -
                c === 0x2E || // .
                c === 0x5F || // _
                c === 0x7E || // ~
                (c >= 0x30 && c <= 0x39) || // 0-9
                (c >= 0x41 && c <= 0x5A) || // a-z
                (c >= 0x61 && c <= 0x7A)) { // A-Z

                out += str[i];
                continue;
            }

            if (c < 0x80) {
                out += internals.hexTable[c];
                continue;
            }

            if (c < 0x800) {
                out += internals.hexTable[0xC0 | (c >> 6)] + internals.hexTable[0x80 | (c & 0x3F)];
                continue;
            }

            if (c < 0xD800 || c >= 0xE000) {
                out += internals.hexTable[0xE0 | (c >> 12)] + internals.hexTable[0x80 | ((c >> 6) & 0x3F)] + internals.hexTable[0x80 | (c & 0x3F)];
                continue;
            }

            ++i;
            c = 0x10000 + (((c & 0x3FF) << 10) | (str.charCodeAt(i) & 0x3FF));
            out += internals.hexTable[0xF0 | (c >> 18)] + internals.hexTable[0x80 | ((c >> 12) & 0x3F)] + internals.hexTable[0x80 | ((c >> 6) & 0x3F)] + internals.hexTable[0x80 | (c & 0x3F)];
        }

        return out;
    };

    Utils.compact = function(obj, refs) {

        if (typeof obj !== 'object' ||
            obj === null) {

            return obj;
        }

        refs = refs || [];
        var lookup = refs.indexOf(obj);
        if (lookup !== -1) {
            return refs[lookup];
        }

        refs.push(obj);

        if (Array.isArray(obj)) {
            var compacted = [];

            for (var i = 0, il = obj.length; i < il; ++i) {
                if (typeof obj[i] !== 'undefined') {
                    compacted.push(obj[i]);
                }
            }

            return compacted;
        }

        var keys = Object.keys(obj);
        for (i = 0, il = keys.length; i < il; ++i) {
            var key = keys[i];
            obj[key] = Utils.compact(obj[key], refs);
        }

        return obj;
    };


    Utils.isRegExp = function(obj) {

        return Object.prototype.toString.call(obj) === '[object RegExp]';
    };


    Utils.isBuffer = function(obj) {

        if (obj === null ||
            typeof obj === 'undefined') {

            return false;
        }

        return !!(obj.constructor &&
            obj.constructor.isBuffer &&
            obj.constructor.isBuffer(obj));
    };

    internals.parseValues = function(str, options) {

        var obj = {};
        var parts = str.split(options.delimiter, options.parameterLimit === Infinity ? undefined : options.parameterLimit);

        for (var i = 0, il = parts.length; i < il; ++i) {
            var part = parts[i];
            var pos = part.indexOf(']=') === -1 ? part.indexOf('=') : part.indexOf(']=') + 1;

            if (pos === -1) {
                obj[Utils.decode(part)] = '';

                if (options.strictNullHandling) {
                    obj[Utils.decode(part)] = null;
                }
            }
            else {
                var key = Utils.decode(part.slice(0, pos));
                var val = Utils.decode(part.slice(pos + 1));

                if (!Object.prototype.hasOwnProperty.call(obj, key)) {
                    obj[key] = val;
                }
                else {
                    obj[key] = [].concat(obj[key]).concat(val);
                }
            }
        }

        return obj;
    };


    internals.parseObject = function(chain, val, options) {

        if (!chain.length) {
            return val;
        }

        var root = chain.shift();

        var obj;
        if (root === '[]') {
            obj = [];
            obj = obj.concat(internals.parseObject(chain, val, options));
        }
        else {
            obj = options.plainObjects ? Object.create(null) : {};
            var cleanRoot = root[0] === '[' && root[root.length - 1] === ']' ? root.slice(1, root.length - 1) : root;
            var index = parseInt(cleanRoot, 10);
            var indexString = '' + index;
            if (!isNaN(index) &&
                root !== cleanRoot &&
                indexString === cleanRoot &&
                index >= 0 &&
                (options.parseArrays &&
                    index <= options.arrayLimit)) {

                obj = [];
                obj[index] = internals.parseObject(chain, val, options);
            }
            else {
                obj[cleanRoot] = internals.parseObject(chain, val, options);
            }
        }

        return obj;
    };


    internals.parseKeys = function(key, val, options) {

        if (!key) {
            return;
        }

        // Transform dot notation to bracket notation

        if (options.allowDots) {
            key = key.replace(/\.([^\.\[]+)/g, '[$1]');
        }

        // The regex chunks

        var parent = /^([^\[\]]*)/;
        var child = /(\[[^\[\]]*\])/g;

        // Get the parent

        var segment = parent.exec(key);

        // Stash the parent if it exists

        var keys = [];
        if (segment[1]) {
            // If we aren't using plain objects, optionally prefix keys
            // that would overwrite object prototype properties
            if (!options.plainObjects &&
                Object.prototype.hasOwnProperty(segment[1])) {

                if (!options.allowPrototypes) {
                    return;
                }
            }

            keys.push(segment[1]);
        }

        // Loop through children appending to the array until we hit depth

        var i = 0;
        while ((segment = child.exec(key)) !== null && i < options.depth) {

            ++i;
            if (!options.plainObjects &&
                Object.prototype.hasOwnProperty(segment[1].replace(/\[|\]/g, ''))) {

                if (!options.allowPrototypes) {
                    continue;
                }
            }
            keys.push(segment[1]);
        }

        // If there's a remainder, just add whatever is left

        if (segment) {
            keys.push('[' + key.slice(segment.index) + ']');
        }

        return internals.parseObject(keys, val, options);
    };


    function parseFormUrlencoded(str, options) {

        options = options || {};
        options.delimiter = typeof options.delimiter === 'string' || Utils.isRegExp(options.delimiter) ? options.delimiter : internals.delimiter;
        options.depth = typeof options.depth === 'number' ? options.depth : internals.depth;
        options.arrayLimit = typeof options.arrayLimit === 'number' ? options.arrayLimit : internals.arrayLimit;
        options.parseArrays = options.parseArrays !== false;
        options.allowDots = typeof options.allowDots === 'boolean' ? options.allowDots : internals.allowDots;
        options.plainObjects = typeof options.plainObjects === 'boolean' ? options.plainObjects : internals.plainObjects;
        options.allowPrototypes = typeof options.allowPrototypes === 'boolean' ? options.allowPrototypes : internals.allowPrototypes;
        options.parameterLimit = typeof options.parameterLimit === 'number' ? options.parameterLimit : internals.parameterLimit;
        options.strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : internals.strictNullHandling;

        if (str === '' ||
            str === null ||
            typeof str === 'undefined') {

            return options.plainObjects ? Object.create(null) : {};
        }

        var tempObj = typeof str === 'string' ? internals.parseValues(str, options) : str;
        var obj = options.plainObjects ? Object.create(null) : {};

        // Iterate over the keys and setup the new object

        var keys = Object.keys(tempObj);
        for (var i = 0, il = keys.length; i < il; ++i) {
            var key = keys[i];
            var newObj = internals.parseKeys(key, tempObj[key], options);
            obj = Utils.merge(obj, newObj, options);
        }

        return Utils.compact(obj);
    }
    
    if(typeof module === "undefined")
        global.parseFormUrlencoded = parseFormUrlencoded;
    else
        module.exports = parseFormUrlencoded;
})();
