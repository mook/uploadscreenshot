const Cc = Components.classes;
const Ci = Components.interfaces;
const OVERLAY_URL = "chrome://uploadscreenshot/content/uploadscreenshot.xul";

function startup(addon, reason) {
  // somebody decided that bootstrapped addons won't load default prefs.
  Cc["@mozilla.org/preferences-service;1"]
    .getService(Ci.nsIPrefServiceInternal)
    .readExtensionPrefs(addon.installPath);
  
  // we need to register our chrome.manifest
  // this is a god-awful hack...

  // first, get our chrome.manifest into the list of things to look at
  Components.utils.import("resource://gre/modules/ctypes.jsm");
  var file = Cc["@mozilla.org/file/directory_service;1"]
               .getService(Ci.nsIProperties)
               .get("resource:app", Ci.nsIFile);
  file.append(ctypes.libraryName("xul"));
  var libxul = ctypes.open(file.path);
  
  // we need to explicitly allocate a type for the buffer we'll need to hold
  // the path in :(
  var bufLen = addon.installPath.path.length + 2;
  var PathBuffer_t = ctypes.StructType("PathBuffer",
                                       [{buf: ctypes.jschar.array(bufLen)}])
  var nsString_t = ctypes.StructType("nsAString",
                                     [{mData:   PathBuffer_t.ptr},
                                      {mLength: ctypes.uint32_t},
                                      {mFlags:  ctypes.uint32_t}])
  var PRBool_t = ctypes.uint32_t; // yay NSPR
  var nsILocalFile_t = ctypes.StructType("nsILocalFile").ptr;

  var NS_NewLocalFile =
    libxul.declare("NS_NewLocalFile_P",
                   ctypes.default_abi,
                   ctypes.uint32_t,         // nsresult return
                   nsString_t.ptr,          // const nsAString &path
                   PRBool_t,                // PRBool followLinks
                   nsILocalFile_t.ptr);     // nsILocalFile* *result

  var XRE_AddJarManifestLocation =
    libxul.declare("XRE_AddJarManifestLocation",
                   ctypes.default_abi,
                   ctypes.uint32_t,         // nsresult return
                   ctypes.int32_t,          // NSLocationType aType
                   nsILocalFile_t);         // nsILocalFile* aLocation

  var pathBuffer = new PathBuffer_t;
  pathBuffer.buf = addon.installPath.path + '\0';
  var manifest = new nsString_t;
  manifest.mData = pathBuffer.address();
  manifest.mLength = addon.installPath.path.length;
  manifest.mFlags = 1 << 4; // F_FIXED
  var manifestPtr = manifest.address();
  
  try {
    var rv;
    var localFile = new nsILocalFile_t;
    rv = NS_NewLocalFile(manifest.address(), false, localFile.address());
    if (rv & 0x80000000) {
      throw Components.Exception("NS_NewLocalFile error", rv);
    }
    const NS_SKIN_LOCATION = 1;
    rv = XRE_AddJarManifestLocation(NS_SKIN_LOCATION, localFile);
    if (rv & 0x80000000) {
      throw Components.Exception("XRE_AddJarManifestLocation error", rv);
    }
  } finally {
    libxul.close();
  }

  // apply the new overlay to existing windows
  var xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
              .createInstance();
  xhr.open("GET", OVERLAY_URL, false /* sync */);
  xhr.send();
  var sourceElem = xhr.responseXML.getElementById("uploadscreen-button");
  Components.utils.reportError(sourceElem);
  var iter = Cc["@mozilla.org/appshell/window-mediator;1"]
               .getService(Ci.nsIWindowMediator)
               .getEnumerator("navigator:browser");
  while (iter.hasMoreElements()) {
    var win = iter.getNext().QueryInterface(Ci.nsIDOMWindow);
    let doc = win.document.QueryInterface(Ci.nsIDOMXULDocument);
    doc.loadOverlay(OVERLAY_URL, function(){
      if (doc.getElementById("uploadscreen-button")) {
        // this somehow loaded? skip.
        return;
      }
      var toolbox = doc.getElementById("navigator-toolbox");
      var toolbars = Array.slice(toolbox.childNodes)
                          .concat(toolbox.externalToolbars)
                          .filter(function(x) "currentSet" in x);
      for each (var toolbar in toolbars) {
        var currentSet =  toolbar.getAttribute("currentset").split(",");
        var index = currentSet.indexOf("uploadscreen-button");
        if (index < 0) continue;
        var nextNode = null;
        for (var i = index + 1; i < currentSet.length && !nextNode; ++i) {
          nextNode = doc.getElementById(currentSet[i]);
        }
        var elem = doc.importNode(sourceElem, true);
        toolbox.palette.appendChild(elem);
        toolbar.insertItem("uploadscreen-button", nextNode, false);
        break;
      }
    });
  }
}

function shutdown(addon, reason) {
  const Cc = Components.classes;
  const Ci = Components.interfaces;

  const APP_SHUTDOWN = 2;
  if (reason == APP_SHUTDOWN) {
    // we don't need to clean up for app shutdown
    return;
  }

  // check to see that the package got registered
  var ios = Cc["@mozilla.org/network/io-service;1"]
              .getService(Ci.nsIIOService);
  try {
    Cc["@mozilla.org/chrome/chrome-registry;1"]
      .getService(Ci.nsIChromeRegistry)
      .convertChromeURL(ios.newURI(OVERLAY_URL, null, null));
  } catch (e) {
    // not registered, nothing we can do here
    return;
  }

  // un-apply the new overlay to existing windows
  var xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
              .createInstance();
  xhr.open("GET", OVERLAY_URL, false /* sync */);
  xhr.send();
  var nodes = [];
  var root = xhr.responseXML.documentElement;
  for (var list = root.childNodes, i = 0; i < list.length; ++i) {
    var elem = list.item(i);
    if (!(elem instanceof Ci.nsIDOMElement) || !elem.hasAttribute("id"))
      continue;
    var id = elem.getAttribute("id");
    for (var children = elem.childNodes, j = 0; j < children.length; ++j) {
      var child = children.item(j);
      if (!(child instanceof Ci.nsIDOMElement) || !child.hasAttribute("id"))
        continue;
      nodes.push(child.getAttribute("id"));
    }
  }

  var iter = Cc["@mozilla.org/appshell/window-mediator;1"]
               .getService(Ci.nsIWindowMediator)
               .getEnumerator("navigator:browser");
  while (iter.hasMoreElements()) {
    let win = iter.getNext().QueryInterface(Ci.nsIDOMWindow);
    let doc = win.document.QueryInterface(Ci.nsIDOMXULDocument);
    nodes.forEach(function(id) {
      let elem = doc.getElementById(id);
      if (elem)
        elem.parentNode.removeChild(elem);
    });
  }
}

function install(addon, reason) {
}

function uninstall(addon, reason) {
  
}
