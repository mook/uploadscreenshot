if (!com) {
    var com = {};
}
if (!com.uploadScreenShot) {
    com.uploadScreenShot = {
        _PLUGIN_UUID : "uss-button@uploadscreenshot.com",
        DEFAULT_FILENAME : "shot.png",
        _URL_SUCCESS_PAGE : "http://www.UploadScreenshot.com/ff-installed",
        _URL_FEEDBACK_PAGE : "http://www.UploadScreenshot.com/ff-uninstalled",
        _observerService : Components.classes['@mozilla.org/observer-service;1'].getService(Components.interfaces.nsIObserverService),

        get_page_html : function() {
            with (com.uploadScreenShot) {
                return {
                    content: html_contents = getBrowser().selectedBrowser.contentDocument.getElementsByTagName('html')[0].innerHTML,
                    url : getBrowser().selectedBrowser.contentWindow.location
                }
            }
        },

        _installButton : function() {
            var btn = document.getElementById("uploadscreen-button");
            var toolbox = document.getElementById("navigator-toolbox");
            var toolbar = null;

            var searchbar = document.getElementById("search-container");
            if (searchbar) {
                // a search box is available; go after it
                toolbar = searchbar.parentNode;
                toolbar.insertItem("uploadscreen-button",
                                   searchbar.nextSibling,
                                   false);
            } else {
                // no search box; go in front of the URL bar
                var urlbar = document.getElementById("urlbar-container");
                toolbar = urlbar.parentNode;
                toolbar.insertItem("uploadscreen-button",
                                   urlbar,
                                   false);
            }

            // persist the change (we won't run this again!)
            toolbar.setAttribute("currentset", toolbar.currentSet);
            document.persist(toolbar.id, "currentset");
        },

        load : function() {
            with (com.uploadScreenShot) {

                if (Prefs.isFirstRun()) {
                    _installButton();
                    _openSuccessPage();
                    Prefs.setFirstRun(false);
                }

                selectMenuItem();
            }
        },

        unload : function () {
            com.uploadScreenShot.removeUninstallObserver();
        },

        _openFeedbackPage : function() {
            with (com.uploadScreenShot) {
                openTab(_URL_FEEDBACK_PAGE);
            }
        },

        _openSuccessPage : function() {
            timer = Components.classes["@mozilla.org/timer;1"]
                    .createInstance(Components.interfaces.nsITimer);

            timer.initWithCallback({notify : function(timer) {
                with (com.uploadScreenShot) {
                    openTab(_URL_SUCCESS_PAGE);
                }
            }
            }, 1500, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
        },

        screenshot_capture : function() {
            with (com.uploadScreenShot) {
                var mode = Prefs.getMode();

                if (_isModeVisible(mode)) {
                    _drawPageVisiableImpl(mode);
                } else if (_isModeFull(mode)) {
                    _drawPageFullImpl(mode);
                }
            }
        },

        _isModeVisible : function(val) {
            return val == "visiable_upload" ||
                    val == "visiable_copy_clip" ||
                    val == "visiable_copy_clip_upload" ||
                    val == "visiable_save_as_png";
        },

        _isModeFull : function(val) {
            return val == "fullpage_upload" ||
                    val == "fullpage_copy_clip" ||
                    val == "fullpage_copy_clip_upload" ||
                    val == "fullpage_save_as_png";
        },

        drawPageFull : function(e) {
            var a_id = e.target.id;

            com.uploadScreenShot._drawPageFullImpl(a_id);
        },

        _drawPageFullImpl : function(a_id) {

            var doc = getBrowser().selectedBrowser.contentDocument;

            var left = 0;
            var top = 0;
            var width = doc.documentElement.scrollWidth;
            var height = doc.documentElement.scrollHeight;

            with (com.uploadScreenShot) {
                var canvas = createCancas(left, top, width, height);

                if (a_id == 'fullpage_upload_nopre' || a_id == 'fullpage_upload') {
                    saveCanvasTemp(canvas);
                } else if (a_id == 'fullpage_copy_clip_nopre' || a_id == 'fullpage_copy_clip') {
                    putImgDataUrl(canvas.toDataURL("image/png", ""), null);
                } else if (a_id == 'fullpage_copy_clip_upload_nopre' || a_id == 'fullpage_copy_clip_upload') {
                    putImgDataUrl(canvas.toDataURL("image/png", ""), null);
                    saveCanvasTemp(canvas);
                } else if (a_id == 'fullpage_save_as_png_nopre' || a_id == 'fullpage_save_as_png') {
                    saveImage(canvas.toDataURL("image/png", ""), null);
                } else {
                    saveCanvasTemp(canvas);
                }
            }

            return canvas;
        },

        _drawPageVisiableImpl : function(b_id) {

            var doc = getBrowser().selectedBrowser.contentDocument;
            var win = getBrowser().selectedBrowser.contentWindow;

            var left = win.scrollX;
            var top = win.scrollY;

            var height = 0;
            var width = 0;
            if (doc.compatMode == "CSS1Compat") {
                height = doc.documentElement.clientHeight;
                width = doc.documentElement.clientWidth;
            } else {
                height = doc.body.clientHeight;
                width = doc.body.clientWidth;
            }

            with (com.uploadScreenShot) {
                var canvas = createCancas(left, top, width, height);

                if (b_id == 'visiable_upload_nopre' || b_id == 'visiable_upload') {
                    saveCanvasTemp(canvas);
                } else if (b_id == 'visiable_copy_clip_nopre' || b_id == 'visiable_copy_clip') {
                    putImgDataUrl(canvas.toDataURL("image/png", ""), null);
                } else if (b_id == 'visiable_copy_clip_upload_nopre' || b_id == 'visiable_copy_clip_upload') {
                    putImgDataUrl(canvas.toDataURL("image/png", ""), null);
                    saveCanvasTemp(canvas);
                } else if (b_id == 'visiable_save_as_png_nopre' || b_id == 'visiable_save_as_png') {
                    saveImage(canvas.toDataURL("image/png", ""), null);
                } else {
                    saveCanvasTemp(canvas);
                }
            }

            return canvas;
        },

        drawPageVisiable : function(e) {
            return com.uploadScreenShot._drawPageVisiableImpl(e.target.id);
        },

        setAllFlashOpaque : function(doc) {
            try {
                var embedded = doc.getElementsByTagName("embed");
                for (var i = 0; i < embedded.length; i++) {
                    var embed = embedded[i];
                    var orig = embed.getAttribute("wmode");
                    var parent = embed.parentNode;
                    embed.setAttribute("wmode", "opaque");
                    parent.removeChild(embed);
                    parent.appendChild(embed);

                    //                    this.undos.push(function() {
                    //                        embed.setAttribute("wmode", orig);
                    //                        parent.removeChild(embed);
                    //                        parent.appendChild(embed);
                    //                    });
                }
            } catch (e) {
                alert(e);
            }
        },

        createCancas : function(left, top, width, height) {
            var win = getBrowser().selectedBrowser.contentWindow;

            //            com.uploadScreenShot.setAllFlashOpaque(win.document);

            var canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "html:canvas");
            canvas.style.width = canvas.style.maxwidth = String(width) + "px";
            canvas.style.height = canvas.style.maxheight = String(height) + "px";
            canvas.width = width;
            canvas.height = height;

            var ctx = canvas.getContext("2d");
            ctx.clearRect(left, top, width, height);
            ctx.save();
            ctx.drawWindow(win, left, top, width, height, "rgb(255,255,255)");
            ctx.restore();

            return canvas;
        },

        saveCanvasTemp : function(canvas) {

            var destFileName = com.uploadScreenShot.DEFAULT_FILENAME;

            //set file with path
            var bt = document.getElementById("uploadscreen-button");
            bt.style.setProperty("list-style-image", "url(chrome://uploadscreenshot/skin/loading.gif)", "");
            bt.disabled = true;

            var status = document.getElementById('screenshot_status');
            status.setAttribute('label', com.uploadScreenShot.i18n.getString('status.uploading'));

            var file = Components.classes["@mozilla.org/file/directory_service;1"]
                    .getService(Components.interfaces.nsIProperties)
                    .get("ProfD", Components.interfaces.nsIFile);

            if (!file.exists()) {
                file.createUnique(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0666);
            }

            file.append(destFileName);

            // create a data url from the canvas and then create URIs of the source and targets
            var source = com.uploadScreenShot.IO.ioService.newURI(canvas.toDataURL("image/png", ""), "UTF8", null);

            // prepare to save the canvas data
            var persist = Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"]
                    .createInstance(Components.interfaces.nsIWebBrowserPersist);

            persist.persistFlags = Components.interfaces.nsIWebBrowserPersist.PERSIST_FLAGS_REPLACE_EXISTING_FILES;
            persist.persistFlags |= Components.interfaces.nsIWebBrowserPersist.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;

            persist.progressListener = {
                onStateChange: function(aWebProgress, aRequest, aStatus, aMessage) {
                    if (aStatus == 327696) {
                        com.uploadScreenShot.uploadScreenShot(file, destFileName);
                    }
                }
            };

            // save the canvas data to the file
            persist.saveURI(source, null, null, null, null, file);

            return file;
        },

        uploadScreenShot : function(filein, fName) {
            // convert string filepath to an nsIFile
            var file = com.uploadScreenShot.IO.createLocalFile(filein);

            var html = com.uploadScreenShot.get_page_html();

            // prepare the MIME POST data
            var boundaryString = '111capitano897654123';
            var boundary = '--' + boundaryString;
            var requestbody = boundary + '\n'
                    + 'Content-Disposition: form-data;name="userfile"; filename="'
                    + fName + '"' + '\n'
                    + 'Content-Type: application/octet-stream' + '\n'
                    + '\n'
                    + escape(com.uploadScreenShot.IO.getBytes(file))
                    + '\n'
                    + boundary + '\n'
                    + 'Content-Disposition: form-data;name="htmlcontents"' + '\n'
                    + 'Content-Type: text/plain' + '\n'
                    + '\n'
                    + html.content + '\n'
                    + boundary + '\n'
                    + 'Content-Disposition: form-data;name="theweburl"' + '\n'
                    + 'Content-Type: text/plain' + '\n'
                    + '\n'
                    + html.url + '\n'
                    + boundary;

            // Send
            var http_request = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
                    .createInstance(Components.interfaces.nsIXMLHttpRequest);

            http_request.onreadystatechange = function() {
                if (http_request.readyState == 4 && http_request.status == 200) {
                    com.uploadScreenShot.openTab(http_request.responseText);

                    var status = document.getElementById('screenshot_status');
                    status.removeAttribute('label');

                    var bt = document.getElementById("uploadscreen-button");
                    bt.style.setProperty("list-style-image", "url(chrome://uploadscreenshot/skin/icon_tiny.png)", "");
                    bt.disabled = false;
                }
            };

            http_request.open('POST', 'http://img1.uploadscreenshot.com/remoteupload.php', true);
            http_request.setRequestHeader("Content-type", "multipart/form-data; \
                                boundary=\"" + boundaryString + "\"");
            http_request.setRequestHeader("Connection", "close");
            http_request.setRequestHeader("Content-length", requestbody.length);
            http_request.send(requestbody);
        },

        openTab : function(url) {
            gBrowser.selectedTab = gBrowser.addTab(url);  //Open in a new tab
        },

        check_id : function(event) {
            com.uploadScreenShot.Prefs.setMode(event.target.id);
        },

        selectMenuItem : function() {
            var menu = document.getElementById("uploadscreen_popup");

            for (var i = 0; i < menu.childNodes.length; i++) {
                menu.childNodes[i].removeAttribute("selected");
            }

            var id = com.uploadScreenShot.Prefs.getMode();
            document.getElementById(id).setAttribute("selected", "true");
        },

        uninstallObserver : {
            observe: function(aSubject, aTopic, aData) {
                with (com.uploadScreenShot) {
                    try {
                        var item = aSubject.QueryInterface(Components.interfaces.nsIUpdateItem);

                        if (item.id != _PLUGIN_UUID) {
                            return;
                        }

                        if (aData == "item-uninstalled") {
                            _openFeedbackPage();

                            // Remove all properties that was installed by our extension
                            Prefs.removeAll();
                        }
                    } catch (e) {
                    }
                }
            }
        },

        actionObserver : {
            observe: function(aSubject, aTopic, aData) {
                with (com.uploadScreenShot) {
                    try {
                        var item = aSubject.QueryInterface(Components.interfaces.nsIUpdateItem);

                        if (item.id != _PLUGIN_UUID) {
                            return;
                        }

                        if (aData == "item-uninstalled") {
                            _openSuccessPage();
                        }
                    } catch (e) {
                    }
                }
            }
        },

        addActionObserver : function() {
            with (com.uploadScreenShot) {
                _observerService.addObserver(actionObserver, "em-action-requested", false);
            }
        },

        addUninstallObserver : function() {
            with (com.uploadScreenShot) {
                _observerService.addObserver(uninstallObserver, "em-action-requested", false);
            }
        },

        removeUninstallObserver : function() {
            with (com.uploadScreenShot) {
                if (_observerService.removeUninstallObserver) {
                    _observerService.removeUninstallObserver(uninstallObserver, "em-action-requested", false);
                }
            }
        }
    };
}

com.uploadScreenShot.addActionObserver();
com.uploadScreenShot.addUninstallObserver();

window.addEventListener("load", com.uploadScreenShot.load, true);
window.addEventListener("unload", com.uploadScreenShot.unload, false);
