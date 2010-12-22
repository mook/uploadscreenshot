var com = com || {};
com.uploadScreenShot = com.uploadScreenShot || {};

//////////////////////   Preferences Utilities     //////////////////////////////////

com.uploadScreenShot.Prefs = com.uploadScreenShot.Prefs || {};

com.uploadScreenShot.Prefs._prefBranch =
    Components.classes["@mozilla.org/preferences-service;1"].
        getService(Components.interfaces.nsIPrefService).
        getBranch("extensions.uploadScreenShot.");

com.uploadScreenShot.Prefs._boolPref = function (prefName, prefDef, propName) {
    var Prefs = com.uploadScreenShot.Prefs;
    Prefs.__defineGetter__(propName || prefName, function() {
        var type = Prefs._prefBranch.getPrefType(prefName);
        if (type == Components.interfaces.nsIPrefBranch.PREF_INVALID) {
            Prefs._prefBranch.setBoolPref(prefName, prefDef);
            return prefDef;
        }
        return Prefs._prefBranch.getBoolPref(prefName);
    });
    Prefs.__defineSetter__(propName || prefName, function(val) {
        Prefs._prefBranch.setBoolPref(prefName, val);
    });
};

com.uploadScreenShot.Prefs._charPref = function (prefName, prefDef, propName) {
    var Prefs = com.uploadScreenShot.Prefs;
    Prefs.__defineGetter__(propName || prefName, function() {
        var type = Prefs._prefBranch.getPrefType(prefName);
        if (type == Components.interfaces.nsIPrefBranch.PREF_INVALID) {
            Prefs._prefBranch.setCharPref(prefName, prefDef);
            return prefDef;
        }
        return Prefs._prefBranch.getCharPref(prefName);
    });
    Prefs.__defineSetter__(propName || prefName, function(val) {
        Prefs._prefBranch.setCharPref(prefName, val);
    });
};

com.uploadScreenShot.Prefs.removeAll = function() {
    com.uploadScreenShot.Prefs._prefBranch.deleteBranch("");
};

com.uploadScreenShot.Prefs._boolPref("first_run", true, "isFirstRun");
com.uploadScreenShot.Prefs._charPref("mode", "visiable_upload");
com.uploadScreenShot.Prefs._boolPref("sendHTMLContents", true);
com.uploadScreenShot.Prefs._boolPref("sendURL", true);
com.uploadScreenShot.Prefs._boolPref("contextMenu", true);

//////////////////////   IO Utilities     //////////////////////////////////

com.uploadScreenShot.IO = {
};

com.uploadScreenShot.IO.ioService = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);

com.uploadScreenShot.IO.createLocalFile = function(fileIn) {
    var file = Components.classes["@mozilla.org/file/local;1"]
            .createInstance(Components.interfaces.nsILocalFile);

    file.initWithPath(fileIn.path);

    return file;
};

com.uploadScreenShot.IO.getBytes = function(file) {
    // Make a stream from a file.
    var stream = Components.classes["@mozilla.org/network/file-input-stream;1"]
            .createInstance(Components.interfaces.nsIFileInputStream);
    stream.init(file, 0x04 | 0x08, 0644, 0x04); // file is an nsIFile instance

    var bstream = Components.classes["@mozilla.org/network/buffered-input-stream;1"].getService();

    bstream.QueryInterface(Components.interfaces.nsIBufferedInputStream);
    bstream.init(stream, 0);//max_size

    bstream.QueryInterface(Components.interfaces.nsISeekableStream);
    bstream.QueryInterface(Components.interfaces.nsIInputStream);

    var binary = Components.classes["@mozilla.org/binaryinputstream;1"]
            .createInstance(Components.interfaces.nsIBinaryInputStream);
    binary.setInputStream(stream);

    return binary.readBytes(binary.available())
};

