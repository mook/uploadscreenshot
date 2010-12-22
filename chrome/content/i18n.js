if (!com) {
    var com = {};
}
if (!com.uploadScreenShot) {
    com.uploadScreenShot = function() {
    };
}
//////////////////////   Internationalization Utilities     //////////////////////////////////

com.uploadScreenShot.i18n = {
};

com.uploadScreenShot.i18n._stringBundle = null;

com.uploadScreenShot.i18n.getString = function(str) {
    with (com.uploadScreenShot.i18n) {
        try {
            if (!_stringBundle) {
                _stringBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].
                        getService(Components.interfaces.nsIStringBundleService).
                        createBundle("chrome://uploadscreenshot/locale/labels.properties");
            }

            return _stringBundle.GetStringFromName(str);
        } catch (e) {
            Components.utils.reportError("Missed key: " + str);
            Components.utils.reportError(e);
        }
    }
};

