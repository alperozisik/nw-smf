/* globals*/
(function() {
    function Dialog() {
        if (!(this instanceof Dialog)) {
            return new Dialog();
        }
        var me = this;
        var pg;
        var cntAll = new SMF.UI.Container({
            top: 0,
            left: 0,
            height: Device.screenHeight,
            width: Device.screenWidth,
            borderWidth: 0,
            backgroundTransparent: true
        });

        var rectBg = new SMF.UI.Rectangle({
            alpha: 0.7,
            top: 0,
            left: 0,
            height: Device.screenHeight,
            width: Device.screenWidth,
            borderWidth: 0,
            backgroundTransparent: false,
            fillColor: "#000000",
            roundedEdge: 0,
            onTouchEnded: function(e) {
                //me.hide();
            }
        });
        cntAll.add(rectBg);

        this.show = function show(page) {
            page = page || new SMF.UI.Page();
            pg = page;
            page.add(cntAll);
            old_onKeyPressed_isSet = true;
            old_onKeyPressed = page.onKeyPress;
            page.onKeyPress = onKeyPressed;
        };

        function onKeyPressed(e) {
            if (e.keyCode === 4) {
                me.hide();
            }
            else {
                if (typeof old_onKeyPressed === "function")
                    old_onKeyPressed(e);
            }
        }

        this.hide = function hide() {
            if (!pg)
                return;
            pg.remove(cntAll);
            old_onKeyPressed_isSet = false;
            pg.onKeyPress = old_onKeyPressed;
        };

        this.overlay = new SMF.UI.Container({
            top: "15%",
            left: "30%",
            height: "70%",
            width: "40%",
            backgroundTransparent: false,
            fillColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#000000"
        });
        this.overlay.z = 10;

        cntAll.add(this.overlay);

        var old_onKeyPressed;
        var old_onKeyPressed_isSet = false;
    }

    if(typeof module === "undefined")
        global.Dialog = Dialog;
    else
        module.exports = Dialog;

    var waitDialog = new SMF.UI.Container({
        top: 0,
        left: 0,
        height: Device.screenHeight,
        width: Device.screenWidth,
        borderWidth: 0,
        backgroundTransparent: true
    });
    waitDialog.add(new SMF.UI.Rectangle({
        alpha: 0.8,
        top: 0,
        left: 0,
        height: Device.screenHeight,
        width: Device.screenWidth,
        borderWidth: 0,
        backgroundTransparent: false,
        fillColor: "#000000",
        roundedEdge: 0
    }));
    
    //bug IOS-1910
    var waitActivityIndicator = new SMF.UI.ActivityIndicator({
        style: SMF.UI.ActivityIndicatorStyle.whiteLarge,
    });
    waitActivityIndicator.z = 10;
    waitActivityIndicator.top = (Device.screenHeight - waitActivityIndicator.height) / 2;
    waitActivityIndicator.left = (Device.screenWidth - waitActivityIndicator.width) / 2;
    waitDialog.add(waitActivityIndicator);


    Dialog.showWait = function showWait(page) {
        page = page || Pages.currentPage;
        Dialog.removeWait(page);
        page.add(waitDialog);
        page.old_onKeyPress = page.onKeyPress;
        page.onKeyPress = nothing;
        page.actionBar && (page.actionBar._enabled = page.actionBar.enabled);
        page.navigationItem && (page.navigationItem._enabled = page.navigationItem.enabled);
        page.actionBar && (page.actionBar.enabled  = false);
        page.navigationItem && (page.navigationItem.enabled = false);
    };

    function nothing() {}

    Dialog.removeWait = function removeWait() {
        var parent = null;
        parent = waitDialog.parent;

        if (parent) {
            parent.remove(waitDialog);
            if (parent.old_onKeyPress) {
                parent.onKeyPress = parent.old_onKeyPress;
                parent.old_onKeyPress = null;
            }
            parent.actionBar && (parent.actionBar.enabled = parent.actionBar._enabled);
            parent.navigationItem && (parent.navigationItem.enabled = parent.navigationItem._enabled);
        }
    };


})();