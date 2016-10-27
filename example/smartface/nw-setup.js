/* globals */
(function() {
    const nw = require("../../nw");
    //start setup
    nw.registerService(require("../definitions/login"));
    nw.registerService(require("../definitions/user"));
    nw.registerService(require("../definitions/case-all"));
    nw.registerService(require("../definitions/case-detail"));

    nw.baseURL = "https://jslibs.azurewebsites.net/examples/nw/";

    nw.commonHeaders["Accept"] = nw.commonHeaders["Content-Type"] = "application/json";
    
    const Dialog = require("./dialog");
    nw.onActivityStart = function() {
        Dialog.showWait();
    };

    nw.onActivityEnd = function() {
        Dialog.removeWait();
    };
})();
