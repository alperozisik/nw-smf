/* globals */


var nw = module.exports = {
    baseURL: "",
    services: {},
    factory: null, //defered
    commonHeaders: {},
    registerService: registerService,
    proxy: "",
    ignoreSSLErrors: false,
    requestSuccessValidator: requestSuccessValidator,
    onActivityStart: function() {},
    onActivityEnd: function() {}
};


nw.factory = require("./lib/nw-factory")(nw);

function registerService(serviceDescription) {
    if (typeof serviceDescription !== "object")
        throw Error("serviceDescription must be an object");
    if (typeof serviceDescription.name !== "string")
        throw Error("serviceDescription.name must be a string");
    if (typeof serviceDescription.path !== "string" && typeof serviceDescription.url !== "string")
        throw Error("serviceDescription.path OR serviceDescription.url must be string");
    if(typeof serviceDescription.method !== "string")
        throw Error("serviceDescription.method must be a string");
    serviceDescription.method = serviceDescription.method.toUpperCase();
    nw.services[serviceDescription.name] = Object.assign(serviceDescription, {
        header: {},
        query: {},
        body: {}
    });

}

function requestSuccessValidator(status) {
    status = parseInt(status, 10);
    if(status >= 200 && status < 400)
        return true;
    return false;
}
