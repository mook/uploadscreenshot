if (!com) var com = {};
if (!com.uploadScreenShot) com.uploadScreenShot = {};

com.uploadScreenShot.putImgDataUrl = function(dataUrl, callbackWhenDone) {
    var image = window.content.document.createElement("img");
    image.setAttribute("style", "display: none");
    image.setAttribute("id", "screengrab_buffer");
    image.setAttribute("src", dataUrl);

    var body = window.content.document.getElementsByTagName("html")[0];
    body.appendChild(image);

    var timer = Components.classes["@mozilla.org/timer;1"]
            .createInstance(Components.interfaces.nsITimer);

    timer.initWithCallback(
            com.uploadScreenShot._copyImage(image, callbackWhenDone),
            1000,
            Components.interfaces.nsITimer.TYPE_ONE_SHOT);
};

com.uploadScreenShot.saveImage = function(dataUrl, callbackWhenDone) {
    var image = window.content.document.createElement("img");
    image.setAttribute("style", "display: none");
    image.setAttribute("id", "screengrab_buffer");
    image.setAttribute("src", dataUrl);

    var body = window.content.document.getElementsByTagName("html")[0];
    body.appendChild(image);

    var timer = Components.classes["@mozilla.org/timer;1"]
            .createInstance(Components.interfaces.nsITimer);

    timer.initWithCallback(
            com.uploadScreenShot._saveImage(image, callbackWhenDone),
            1000,
            Components.interfaces.nsITimer.TYPE_ONE_SHOT);
};

com.uploadScreenShot._copyImage = function(image, callbackWhenDone) {
    return function () {
        document.popupNode = image;
        try {
            goDoCommand('cmd_copyImageContents');
        } catch (ex) {
        }

        if (callbackWhenDone) {
            callbackWhenDone();
        }

        image.parentNode.removeChild(image);
    };
};

com.uploadScreenShot._saveImage = function(image, callbackWhenDone) {
    return function () {
        var doc = window.content.document;

        urlSecurityCheck(image.src, doc.nodePrincipal);

        var filename = new Date().getTime() + "-uploadscreenshot-dot-com";
        saveImageURL(image.src, filename, "SaveImageTitle", false,
                   false, doc.documentURIObject);

        if (callbackWhenDone) {
            callbackWhenDone();
        }

        image.parentNode.removeChild(image);
    };
};

