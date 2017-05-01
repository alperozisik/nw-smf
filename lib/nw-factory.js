module.exports = function(nw) {
    const formurlencoded = require('form-urlencoded');
    const parseFormUrlencoded = require("./parseformurlencoded");
    const httpMethodsWithoutBody = ["GET", "HEAD", "OPTIONS", "CONNECT"];
    const formatString = require('string-format');
    const URL = require('url-parse');
    const http = require("sf-core/net/http");
    const Image = require('sf-core/ui/image');


    function NWFactory(service) {
        if (!(this instanceof NWFactory)) {
            return new NWFactory(service);
        }
        if (typeof service === "string") {
            service = nw.services[service];
        }
        var me = this;
        this.serviceDefinition = service;
        this.name = service.name || "";
        this.bodyValues = service.body || {};
        this.headerValues = service.header || {};
        this.queryValues = service.query || {};
        this.chained = null;
        this.parent = null;
        this.client = {
            URL: service.url || (nw.baseURL + service.path),
            httpMethod: service.method.toUpperCase(),
            ignoreSSLErrors: nw.proxy || false,
            name: this.name,
            proxy: nw.proxy || "",
            responseHeaders: [],
            onError: onError,
            onSuccess: onSuccess
        };
        this.onResult = null;

        function onError(response) {
            if (typeof me.onResult === "function") {
                var result = responseParser(response);
                me.onResult.call(me, result);
            }
            me.endActivity();
        }

        function onSuccess(response) {
            var result = responseParser(response);
            if (typeof me.onResult === "function") {
                me.onResult.call(me, null, result);
            }
            if (me.chained && result.next) {
                return NWFactory_sendAction.call(me.chained);
            }
            else {
                me.endActivity();
            }
        }
        return this;
    }


    NWFactory.prototype.body = function NWFactory_body(key, value) {
        return setValues.call(this, "bodyValues", key, value);
    };
    NWFactory.prototype.header = function NWFactory_header(key, value) {
        return setValues.call(this, "headerValues", key, value);
    };
    NWFactory.prototype.query = function NWFactory_query(key, value) {
        return setValues.call(this, "queryValues", key, value);
    };
    NWFactory.prototype.result = function NWFactory_result(result) {
        this.onResult = result;
        return this;
    };
    NWFactory.prototype.path = function NWFactory_path() {
        var service = this.serviceDefinition;
        var formatants = [service.path].concat(Array.prototype.slice.call(arguments));
        for (var i in formatants) {
            formatants[i] = String(formatants[i]);
        }
        this.client.URL = service.url || (nw.baseURL + formatString.apply(this, formatants));
        return this;
    };

    NWFactory.prototype.run = function NWFactory_send(noWaitDialog) {
        if (this.parent) {
            return this.parent.run();
        }
        if (!noWaitDialog)
            this.startActivity();
        return NWFactory_sendAction.call(this);
    };

    function NWFactory_sendAction() {
        var me = this;


        var queryValues = queryObjectToString(this.queryValues);
        if (queryValues) {
            this.client.URL += "?" + queryValues;
        }


        var headers = Object.assign({}, this.headerValues, nw.commonHeaders);
        // if (xhr.webClient) { //Smartface Specific implementation
        //     xhr.webClient.ignoreSSLErrors = this.client.ignoreSSLErrors;
        if (this.client.proxy) {
            // xhr.webClient.proxy = this.client.proxy;
            headers.Host = (new URL(this.client.URL)).host;
        }
        // }

        switch (headers["Content-Type"]) {
            case "application/json":
                this.client.requestBody = JSON.stringify(this.bodyValues);
                break;
            case "application/x-www-form-urlencoded":
                this.client.requestBody = formurlencoded(this.bodyValues);
                break;
            default:
                this.client.requestBody = "";
        }
        var requestOptions = {
            url: this.client.URL,
            method: this.client.httpMethod,
            headers: headers
        };
        var body = undefined;
        if (httpMethodsWithoutBody.indexOf(this.client.httpMethod))
            body = this.client.requestBody;
        if (body)
            requestOptions.body = body;
        http.request(requestOptions, function(response) {
            me.client.onSuccess(response);
        }, function(response) {
            me.client.onError(response);
        });
        return this;
    }

    function setValues(targetPropertyName, key, value) {
        var target = this[targetPropertyName];
        if (typeof key === "string" && value === null && typeof target[key] !== "undefined") {
            delete target[value];
            return this;
        }
        if (typeof key === "string" && value !== null) {
            target[key] = value;
            return this;
        }
        if (typeof key === "object") {
            this[targetPropertyName] = target = Object.assign({}, key, target);
            return this;
        }
        return this;
    }

    function responseParser(response) {
        response = response || { status : 7};
        var result = {
            header: {},
            body: response.body,
            next: true
        };
        var h, h_original;
        for (h_original in response.headers) {
            h = h_original.toLowerCase();
            result.header[h] = response.headers[h_original];
        }
        if (!result.header["content-type"]) result.header["content-type"] = "";
        if (result.header["content-type"].indexOf("application/json") > -1) {
            try {
                result.body = JSON.parse(response.body.toString()) || {};
            }
            catch (ex) {
                result.body = response.body || {};
            }
        }
        else if (result.header["content-type"].indexOf("application/x-www-form-urlencoded") > -1) {
            result.body = parseFormUrlencoded(response.body.toString()) || {};
        }
        else if (result.header["content-type"].indexOf("image/") > -1) {
            result.body = Image.createFromBlob(response.body);
        }
        else {
            result.body = response.body || {};
        }
        result.status = response.status;
        return result;
    }

    function queryObjectToString(queryValues) {
        if (!queryValues)
            return "";
        var handler, value, type, queryString = [];
        for (var k in queryValues) {
            if (!queryValues.hasOwnProperty(k))
                continue;
            value = queryValues[k];
            type = typeof value;
            if (type === "object") {
                type = value.constructor.name;
            }
            handler = queryObjectToString.handlers[type] || queryObjectToString.handlers.default;
            value = handler(value);
            queryString.push(encodeURIComponent(k) + "=" + encodeURIComponent(value));
        }
        return queryString.join("&");
    }
    queryObjectToString.handlers = {
        default: function(value) {
            if (value === null || typeof value === undefined) {
                return "";
            }
            return String(value);
        }
    };

    global.nw = nw;

    NWFactory.prototype.chain = function NWFactory_chain(service) {
        this.chained = new nw.factory(service);
        this.chained.parent = this;
        return this.chained;
    };

    NWFactory.prototype.mock = function NWFactory_mock(noWaitDialog) {
        if (this.parent) {
            return this.parent.mock();
        }
        if (!noWaitDialog)
            this.startActivity();
        return NWFactory_mockAction.call(this);
    };

    function NWFactory_mockAction() {
        var data = null;
        if (typeof this.onResult === "function") {
            data = Object.assign({
                body: {},
                header: {},
                next: true,
                status: 200
            }, nw.services[this.name].mock);
        }
        var me = this;
        setTimeout(function() {
            me.onResult.call(me, null, data);
            if (me.chained) {
                return NWFactory_mockAction.call(me.chained);
            }
            else {
                me.endActivity();
            }
        }, 300);
        return this;
    }

    NWFactory.prototype.startActivity = startActivity;

    function startActivity() {
        if (typeof nw.onActivityStart === "function") {
            nw.onActivityStart.call(this);
        }
    }

    NWFactory.prototype.endActivity = endActivity;

    function endActivity() {
        if (typeof nw.onActivityStart === "function") {
            nw.onActivityEnd.call(this);
        }
    }

    return NWFactory;
};
