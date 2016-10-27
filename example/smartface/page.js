/* globals */
//TODO: include this file in onStart in pages/index.js Use the code below:
//include("pages/page.js");
(function() {
    var page = Pages.page = new SMF.UI.Page({
        name: "page",
        onKeyPress: page_onKeyPress,
        onShow: page_onShow
    });

    const actions = {
        MOCK: "mock",
        RUN: "run"
    }
    var defaultAction = actions.RUN;

    /**
     * Creates action(s) that are run when the user press the key of the devices.
     * @param {KeyCodeEventArguments} e Uses to for key code argument. It returns e.keyCode parameter.
     * @this Pages.page
     */
    function page_onKeyPress(e) {
        if (e.keyCode === 4) {
            Application.exit();
        }
    }

    /**
     * Creates action(s) that are run when the page is appeared
     * @param {EventArguments} e Returns some attributes about the specified functions
     * @this Pages.page
     */
    function page_onShow() {
        //bug AND-2459
        var w = Device.deviceOS === "Android" ? swMock.width * 2 : swMock.width;
        var h = Device.deviceOS === "Android" ? swMock.height * 2 : swMock.height;
        //end-bug
        swMock.top = (cntMock.height - h) / 2;
        swMock.left = cntMock.width - (lblMock.left + w);

    }



    const nw = require("../../nw");
    require("./nw-setup");


    var cntMock = new SMF.UI.Container({
        width: "100%",
        height: "10%",
        left: 0,
        top: "5%",
        borderWidth: 0
    });
    page.add(cntMock);
    var lblMock = new SMF.UI.Label({
        text: "Use Mock services: ",
        height: "100%",
        textAlignment: SMF.UI.TextAlignment.LEFT,
        width: "70%",
        left: "5%",
        top: 0,
        touchEnabled: false
    });
    cntMock.add(lblMock);
    var swMock = new SMF.UI.SwitchButton({
        checked: false,
        onChange: function(e) {
            if (defaultAction === actions.MOCK)
                defaultAction = actions.RUN;
            else
                defaultAction = actions.MOCK;
        }
    });
    cntMock.add(swMock);


    var btnTemplate = {
        left: "15%",
        height: "10%",
        width: "70%"
    };

    var btnLogin = new SMF.UI.TextButton(Object.assign({
        text: "Login & User details",
        top: "45%",
        onPressed: loginAndUserDetails
    }, btnTemplate));
    page.add(btnLogin);

    var btnAllCases = new SMF.UI.TextButton(Object.assign({
        text: "All Cases",
        top: "60%",
        onPressed: getAllCases
    }, btnTemplate));
    page.add(btnAllCases);

    var btnCaseDetail = new SMF.UI.TextButton(Object.assign({
        text: "Case Detail",
        top: "75%",
        onPressed: getCaseDetails
    }, btnTemplate));
    page.add(btnCaseDetail);


    function loginAndUserDetails() {
        var loginInfo = {
            user: "smartface",
            password: "Cloud1Code"
        };
        nw.factory("login")
            .body(loginInfo)
            .result(function(err, data) {
                if (err)
                    alert({
                        message: JSONstr(err),
                        title: "Error in logging in"
                    });
                else {
                    nw.commonHeaders.Authorization = "Bearer " + data.body.bearer;
                }
            }).chain("user")
            .result(function(err, data) {
                if (err)
                    alert({
                        message: JSONstr(err),
                        title: "Error in getting user details"
                    });
                else {
                    var userInfo = data.body;
                    alert({
                        message: JSONstr(userInfo),
                        title: "User info"
                    });
                }
            })[defaultAction]();
    }

    var allCases = [];

    function getAllCases() {
        nw.factory("case-list")
            .result(function(err, data) {
                if (err)
                    alert({
                        message: JSONstr(err),
                        title: "Error in getting all cases"
                    });
                else {
                    allCases = data.body;
                    alert({
                        title: "Retrieved cases",
                        message: "There are " + allCases.length + " cases"
                    });
                }
            })[defaultAction]();
    }

    function getCaseDetails() {
        if (allCases.length < 1) {
            alert({
                message: "Cannot get case details",
                title: "You need to first get all cases"
            });
            return;
        }
        var caseIDs = [];
        for (var i in allCases)
            caseIDs.push("Case ID: " + allCases[i].caseid);
        pick(caseIDs, -1, function onItemSelected(e) {
            var caseid = allCases[e.index].caseid;
            nw.factory("case-detail")
                .path(caseid)
                .result(function(err, data) {
                    if (err)
                        alert({
                            message: JSONstr(err),
                            title: "Error in getting cases detail (" + caseid + ")"
                        });
                    else
                        alert({
                            message: JSONstr(data.body),
                            title: "Case details"
                        });
                })[defaultAction]();

        }, function onCancel(e) {});
    }


    function JSONstr(obj) {
        return JSON.stringify(obj, null, "\t");
    }
})();
