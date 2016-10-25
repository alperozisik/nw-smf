module.exports = function(nw) {
    const formurlencoded = require('form-urlencoded');
    const bodyParser = require('body-parser');
    const httpMethodsWithoutBody = ["GET", "HEAD", "OPTIONS", "CONNECT"];
    require('string-format');
    const URL = require('url-parse');
    var XMLHttpRequest = getXHR();
    var urlencoded = bodyParser.urlencoded();

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
                var result = webClientParser(response);
                me.onResult.call(me, result);
            }
            me.endActivity();
        }

        function onSuccess(response) {
            var result = webClientParser(me.client);
            if (typeof me.onResult === "function") {
                me.onResult.call(me, null, response);
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
        this.client.URL = service.url || (nw.baseURL + service.path.format(arguments));
        return this;
    };

    NWFactory.prototype.action = function NWFactory_action(noWaitDialog) {
        var currentAction = this.mock;
        currentAction.call(this, noWaitDialog);
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
        switch (this.headerValues["Content-Type"]) {
            case "application/json":
                this.client.requestBody = JSON.stringify(this.bodyValues);
                break;
            case "application/x-www-form-urlencoded":
                this.client.requestBody = formurlencoded(this.bodyValues);
                break;
            default:
                this.client.requestBody = "";
        }

        var queryValues = queryObjectToString(this.queryValues);
        if (queryValues) {
            this.client.URL += "?" + queryValues;
        }

        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            var validator = me.requestSuccessValidator || nw.requestSuccessValidator;
            var isValid = validator(xhr.status);
            var response = {
                responseHeaders: xhr.getAllResponseHeaders(),
                responseText: xhr.responseText
            };
            if (isValid) {
                this.client.onSuccess(response);
            }
            else {
                this.client.onError(response);
            }
        };
        var h, headers = Object.assign({}, this.headerValues, nw.commonHeaders);
        if (xhr.webClient) { //Smartface Specific implementation
            xhr.webClient.ignoreSSLErrors = this.client.ignoreSSLErrors;
            if (this.client.proxy) {
                xhr.webClient.proxy = this.client.proxy;
                headers.Host = (new URL(this.client.URL)).host;
            }
        }
        
        xhr.open(this.client.httpMethod, this.client.URL, true);

        for (h in headers) {
            if (!headers.hasOwnProperty(h))
                continue;
            xhr.setRequestHeader(h, headers[h]);
        }
        var body = undefined;
        if (httpMethodsWithoutBody.indexOf(this.client.httpMethod))
            body = this.client.requestBody;

        xhr.send(body);
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

    function webClientParser(wc) {
        var rh,
            i, h, result = {
                header: {},
                body: null,
                next: true
            };

        if (typeof wc.responseHeaders === "string") {
            rh = wc.responseHeaders.split("\n");
        }
        else {
            rh = wc.responseHeaders;
        }
        for (i = 0; i < rh.length; i++) {
            h = rh[i].split(": ");
            result.header[h[0].toLowerCase()] = h[1];
        }

        if (!result.header["content-type"]) result.header["content-type"] = "";

        if (result.header["content-type"].indexOf("application/json") > -1) {
            try {
                result.body = JSON.parse(wc.responseText) || {};
            }
            catch (ex) {
                result.body = wc.response || {};
            }
        }
        else if (result.header["content-type"].indexOf("application/x-www-form-urlencoded") > -1) {
            var b = {body: wc.responseText};
            urlencoded(b, {}, function() {});
            result.body = b.body || {}; //TODO: check
        }
        else {
            result.body = wc.response || {};
        }
        result.status = wc.responseCode || wc.responseStatusCode || wc.status - 1;
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
        var body = null;
        if (typeof this.onResult === "function") {
            body = nw.services[this.name].mock;
        }
        var me = this;
        setTimeout(function() {
            me.onResult.call(me, null, {
                body: body
            });
            if (me.chained) {
                return NWFactory_mockAction.call(me.chained);
            }
            else {
                me.endActivity();
            }
        }, 300);
        return this;
    }

    function getXHR() {
        var xhr;
        if (typeof XMLHttpRequest === "undefined")
            xhr = require("xmlhttprequest").XMLHttpRequest;
        else
            xhr = XMLHttpRequest || require("xmlhttprequest").XMLHttpRequest;
        return xhr;
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

};
