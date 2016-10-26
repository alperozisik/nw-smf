if (!global.XMLHttpRequest)
    global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;


const nw = require("../../nw");
//start setup
nw.registerService(require("../definitions/login"));
nw.registerService(require("../definitions/user"));
nw.registerService(require("../definitions/case-all"));
nw.registerService(require("../definitions/case-detail"));

nw.baseURL = "https://jslibs.azurewebsites.net/examples/nw/";

nw.commonHeaders["Accept"] = nw.commonHeaders["Content-Type"] = "application/json";

nw.onActivityStart = function() {
    console.info("Activity started");
};

nw.onActivityEnd = function() {
    console.info("Activity end");
};

//end setup


var loginInfo = {
    user: "smartface",
    password: "Cloud1Code"
};

var userInfo = null;

nw.factory("login")
    .body(loginInfo)
    .result(function(err, data) {
        if (err)
            console.error(err);
        else {
            console.log(data);
            nw.commonHeaders.Authorization = "Bearer " + data.body.bearer;
            setTimeout(postLogin, 2000);
        }
    }).chain("user")
    .result(function(err, data) {
        if (err)
            console.error(err);
        else
            userInfo = data.body;
        console.log("User info is set");
        console.log(userInfo);
    }).run();

// It will be nonsense to start other services without being logged in.
function postLogin() {
    nw.factory("case-list")
        .result(function(err, data) {
            if (err)
                console.error(err);
            else
                console.log(data);
        }).run();

    nw.factory("case-detail")
        .path(1)
        .result(function(err, data) {
            if (err)
                console.error(err);
            else
                console.log(data);
        }).run();
}


// Learn: change all .run() methods with .mock()
// .run() makes an actual call
// .mock() responds with mock data declared within mock field of the service definition

