if (!com) {
    var com = {};
}
if (!com.uploadScreenShot) {
    com.uploadScreenShot = function() {
    };
}

//////////////////////   Preferences Utilities     //////////////////////////////////

if (!com.uploadScreenShot.Prefs) {
    com.uploadScreenShot.Prefs = function() {
    };
}

com.uploadScreenShot.Prefs._UPLOAD_SCREEN_SHOT_PREF_BRANCH = "extensions.uploadScreenShot";
com.uploadScreenShot.Prefs._PREF_FIRST_RUN = "extensions.uploadScreenShot.first_run";
com.uploadScreenShot.Prefs._PREF_MODE = "extensions.uploadScreenShot.mode";

com.uploadScreenShot.Prefs._prefService = Components.classes["@mozilla.org/preferences-service;1"].
        getService(Components.interfaces.nsIPrefBranch);

com.uploadScreenShot.Prefs._getBoolPref = function(prefName, prefDef) {
    with (com.uploadScreenShot.Prefs) {
        try {
            return _prefService.getBoolPref(prefName);
        } catch(e) {
            _setBoolPref(prefName, prefDef);
            return prefDef;
        }
    }
};

com.uploadScreenShot.Prefs._setBoolPref = function(prefName, value) {
    com.uploadScreenShot.Prefs._prefService.setBoolPref(prefName, value);
};

com.uploadScreenShot.Prefs._getCharPref = function(prefName, prefDef) {
    with (com.uploadScreenShot.Prefs) {
        try {
            return _prefService.getCharPref(prefName);
        } catch(e) {
            _setCharPref(prefName, prefDef);
            return prefDef;
        }
    }
};

com.uploadScreenShot.Prefs._setCharPref = function(prefName, value) {
    com.uploadScreenShot.Prefs._prefService.setCharPref(prefName, value);
};

com.uploadScreenShot.Prefs.removeAll = function() {
    with (com.uploadScreenShot.Prefs) {
        _prefService.deleteBranch(_UPLOAD_SCREEN_SHOT_PREF_BRANCH);
    }
};

com.uploadScreenShot.Prefs.isFirstRun = function() {
    with (com.uploadScreenShot.Prefs) {
        return _getBoolPref(_PREF_FIRST_RUN, true);
    }
};

com.uploadScreenShot.Prefs.setFirstRun = function(value) {
    with (com.uploadScreenShot.Prefs) {
        _setBoolPref(_PREF_FIRST_RUN, value);
    }
};

com.uploadScreenShot.Prefs.getMode = function() {
    with (com.uploadScreenShot.Prefs) {
        return _getCharPref(_PREF_MODE, "visiable_upload");
    }
};

com.uploadScreenShot.Prefs.setMode = function(value) {
    with (com.uploadScreenShot.Prefs) {
        _setCharPref(_PREF_MODE, value);
    }
};

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

