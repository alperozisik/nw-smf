/* globals util, nw, setUserInfo, GE */
(function() {
    var login = Pages.login = new SMF.UI.Page({
        fillColor: "#F3F3F3",
        name: "Login",
        onKeyPress: login_onKeyPress,
        onShow: login_onShow
    });

    /**
     * Creates action(s) that are run when the user press the key of the devices.
     * @param {KeyCodeEventArguments} e Uses to for key code argument. It returns e.keyCode parameter.
     * @this Pages.login
     */
    function login_onKeyPress(e) {
        if (e.keyCode === 4) {
            Application.exit();
        }
    }

    /**
     * Creates action(s) that are run when the page is appeared
     * @param {EventArguments} e Returns some attributes about the specified functions
     * @this Pages.login
     */
    function login_onShow() {
        this.actionBar.visible = false;
        SMF.UI.iOS.NavigationBar.visible = false;

        var loginInfo = SMF.restoreVariable("loginInfo");
        if (loginInfo && Device.canEvaluateFingerPrint) {
            btnTouchIDPressed({});
        }
    }


    var lblTitle = new SMF.UI.Label({
        text: "GE Health Cloud",
        textAlignment: SMF.UI.TextAlignment.center,
        top: "27.661169415%",
        left: 0,
        height: "5.9370314832%",
        width: "100%",
        fontColor: "black",
        backgroundTransparent: true
    });
    lblTitle.font.size = util.getFontSize(53);
    login.add(lblTitle);

    var imgGELogo = new SMF.UI.Image({
        top: "13.118440779%",
        height: "10.719640179%",
        image: "gelogo.png",
        imageFillType: SMF.UI.ImageFillType.stretch
    });
    login.add(imgGELogo);
    imgGELogo.width = imgGELogo.height;
    imgGELogo.left = (Device.screenWidth - imgGELogo.width) / 2;

    imgGELogo.onTouchEnded = function(e) {
        //remove this function for actual release, added for development puprpose
        edtUserName.text = "US_Radiologist.ge@gmail.com";
        edtPassword.text = "US_geiaw@7";
        doLogin(e);
    };

    var uiObjectPositions = {
        left: "10%", // "16.9333333333%"
        width: "80%", // "65.6%"
        height: "5.55138784696%"
    };

    var edtUserName = new SMF.UI.EditBox({
        top: "35.7089272318%",
        left: uiObjectPositions.left,
        width: uiObjectPositions.width,
        height: uiObjectPositions.height,
        placeHolder: "E-mail",
        placeHolderTextColor: "#C2C2C8",
        horizontalGap: Device.deviceOS === "iOS" ? "10dp" : "25dp",
        text: "",
        keyboardType: SMF.UI.KeyboardType.emailAddress,
        onReturnKey: function(e) {
            edtPassword.focus();
        },
        returnKeyType: SMF.UI.EditboxReturnKey.next
    });
    login.add(edtUserName);


    var edtPassword = login.edtPassword = new SMF.UI.EditBox({
        top: "42.8357089272%",
        left: uiObjectPositions.left,
        width: uiObjectPositions.width,
        height: uiObjectPositions.height,
        placeHolder: "Password",
        placeHolderTextColor: "#C2C2C8",
        horizontalGap: Device.deviceOS === "iOS" ? "10dp" : "25dp",
        text: "",
        isPassword: true,
        keyboardType: SMF.UI.KeyboardType.textNoSuggestions,
        onReturnKey: function(e) {
            doLogin(e);
        },
        returnKeyType: SMF.UI.EditboxReturnKey.go
    });
    login.add(edtPassword);
    edtPassword.font.name = "GE Sans";

    var btnLogin = new SMF.UI.TextButton({
        text: "Sign in",
        top: "51.7629407352%",
        left: uiObjectPositions.left,
        width: uiObjectPositions.width,
        height: uiObjectPositions.height,
        textAlignment: SMF.UI.TextAlignment.center,
        fillColor: "#595959",
        pressedFillColor: "#494949",
        fontColor: "white",
        pressedFontColor: "white",
        onPressed: doLogin
    });
    login.add(btnLogin);

    if (Device.canEvaluateFingerPrint) {
        var lblTouchID = new SMF.UI.Label({
            text: "Enable Touch ID",
            left: 0,
            top: "88.4471117779%",
            height: "1.57539384846%",
            width: "100%",
            textAlignment: SMF.UI.TextAlignment.center
        });
        login.add(lblTouchID);
        lblTouchID.font.size = util.getFontSize(28);


        var btnTouchID = new SMF.UI.ImageButton({
            top: "78.9197299325%",
            imageFillType: SMF.UI.ImageFillType.stretch,
            height: "7.57689422356%",
            defaultImage: "touchid.png",
            focusedImage: "touchidpressed.png",
            highlightedImage: "touchidpressed.png",
            onPressed: btnTouchIDPressed,
            text: ""
        });
        login.add(btnTouchID);
        btnTouchID.width = btnTouchID.height;
        btnTouchID.left = (Device.screenWidth - btnTouchID.width) / 2;
    }


    function btnTouchIDPressed(e) {
        Device.scanFingerPrint({
            title: "myTitle", // Android only, ignored in iOS
            subtitle: "",
            icon: "myicon.png", // Android only, ignored in iOS

        }, function onSuccess(e) {
            // Scan is success
            var loginInfo = SMF.restoreVariable("loginInfo");
            if (loginInfo) {
                loginInfo = JSON.parse(loginInfo);
                edtUserName.text = loginInfo.username;
                edtPassword.text = loginInfo.password;
                doLogin(e);
            }
            else {
                alert("You need to first login with user name and password");
            }

        }, function onError(e) {
            /*            alert("code: " + e.code +
                            "\n description: " + e.description);
                        if (e.code == "-3") { // -3 is errorCode of fallback
                            // a password field can be showed to user
                            alert("Fallback called");
                        }*/
        });
    }

    function doLogin(e) {
        var loginInfo = {
            username: edtUserName.text || "",
            password: edtPassword.text || ""
        };
        if (loginInfo.username.length === 0 || loginInfo.password.length === 0) {
            alert({
                message: "Username & password fields are required",
                title: "Invalid login information"
            });
            return;
        }
        var reEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        var validEmail = reEmail.test(loginInfo.username);
        if (!validEmail) {
            alert({
                message: "User name must be a valid mail address",
                title: "Invalid login information"
            });
            return;
        }
        nw.factory("login")
            .body(loginInfo)
            .result(function(err, data) {
                if (err) {
                    alert({
                        message: JSON.stringify(err, null, "\t"), //err.body.error_description || "Connection error",
                        title: "Login failure"
                    });
                    return;
                }
                nw.commonHeaders.Authorization = data.body["token_type"] + " " + data.body["access_token"];
                SMF.storeVariable("loginInfo", JSON.stringify(loginInfo), true, true);
            })
            .chain('userID')
            .result(function(err, data) {
                if (err) {
                    alert({
                        message: err.body.error_description || "Connection error",
                        title: "User Details Failure"
                    });
                    return;
                }
                setUserInfo(data.body);
            })
            .chain("caseList")
            .query({
                "offset": 0
            })
            .result(function(err, data) {
                if (err) {
                    alert({
                        message: err.body.error_description || "Connection error",
                        title: "Case List Failure"
                    });
                    return;
                }
                edtPassword.text = "";
                Pages.caseList.rbCaseList.dataSource = data.body;
                Pages.caseList.rbCaseList.refresh();
                Pages.caseList.offset = 0;
                Pages.caseList.show(util.defaultPageAnimation);
            }).mock(); //for actual service call call run() instead of mock()
    }
})();