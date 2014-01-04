var debug = true;
var loggedIn = false;
var authResult;
var userId;
var selectedEvent = false;
var selectedMusic = false;
var images;
var currentImageIndex;
var events;
var event_id
var playlist_id;
var token;
var storageAvailable;
var skipGuide;
var slideshowStarted = false;

function login() {
    loggedIn = true;
    hideLogin();
    getEventList();
    checkSelection();
}

function loginCallback(authResult) {
    console.log(authResult);
    if (authResult['access_token']) {
        this.authResult = authResult;
        connectServer();
    } else if (authResult['error']) {
        console.log('There was an error: ' + authResult['error']);
    }
    console.log('authResult', authResult);
}

function connectServer() {
    try {
        var url = getCurrentUrl() + "connect/" + (authResult.code).replace(/\//g, "[s]");
        var xmlhttp = null;
        if (window.XMLHttpRequest) {
            xmlhttp = new XMLHttpRequest();
        } else if (window.ActiveXObject) {
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }

        xmlhttp.open("GET", url, true);
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState != 4) {
                // pending
            }
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                response_data = jsonToObj(xmlhttp.responseText);
                userId = response_data.userId;
                console.log("User ID: " + userId);
                login();
            }

        }
        xmlhttp.send(null);
    } catch (ex) {
        console.log("Error while connecting to server");
        console.log(ex);
    }
}

function getEventList() {
    try {
        var url = getCurrentUrl() + "events";
        var xmlhttp = null;
        if (window.XMLHttpRequest) {
            xmlhttp = new XMLHttpRequest();
        } else if (window.ActiveXObject) {
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }

        xmlhttp.open("GET", url, true);
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState != 4) {
                // pending
            }
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                events = new Array();
                try {
                    response_data = jsonToObj(xmlhttp.responseText);
                    for (i = 0; i < response_data.length; i++) {
                        var event_id = response_data[i].id;
                        var event_name = response_data[i].name;
                        var event_url = response_data[i].url;

                        var event_new = new Array();
                        event_new.id = event_id;
                        event_new.name = event_name;
                        event_new.url = event_url;

                        addEventToSelector(event_new);

                        events.push(event_new);
                    }
                } catch (ex) {
                    // No events
                    event_new = new Array();
                    event_new.id = "c68j7ef8p368b8018bhpn3kjptc";
                    event_new.name = "Sample Event";
                    event_new.url = "https://plus.google.com/events/c68j7ef8p368b8018bhpn3kjptc";

                    addEventToSelector(event_new);

                    events.push(event_new);
                    //alert("Looks like you have not created any public events yet. You can enter an event URL instead.");
                    document.getElementById("event_na").style.display = "block";

                }

                console.log(events);
            }
        }
        xmlhttp.send(null);
    } catch (ex) {
        console.log("Error while loading event list");
        console.log(ex);
    }
}

function getEventPictures(event_id) {
    this.event_id = event_id;
    setOverlayCaption("Loading event pictures");
    showOverlay();
    try {
        var url = getCurrentUrl() + "token/" + userId + "/" + event_id;
        var xmlhttp = null;
        if (window.XMLHttpRequest) {
            xmlhttp = new XMLHttpRequest();
        } else if (window.ActiveXObject) {
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }

        xmlhttp.open("GET", url, true);
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState != 4) {
                // pending
            }
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                token = xmlhttp.responseText;
                console.log("Token: " + xmlhttp.responseText);
                openChannel(token);

                images = new Array();
                refreshEventPictures();
            }
        }
        xmlhttp.send(null);
    } catch (ex) {
        console.log("Error while requesting event token");
        console.log(ex);
    }
}

function refreshEventPictures() {
    var callbackTest = function(result) {
        console.log("Callback result: " + result);
    }
    console.log("Refreshing event pictures");
    var url_invoke = getCurrentUrl() + "events/gallery/" + event_id;
    sendWebRequest(url_invoke, callbackTest);
}

function sendWebRequest(url, callback) {
    try {
        console.log("Requesting: " + url);
        var xmlhttp = null;
        if (window.XMLHttpRequest) {
            xmlhttp = new XMLHttpRequest();
        } else if (window.ActiveXObject) {
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }

        xmlhttp.open("GET", url, true);
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState != 4) {
                // pending
            }
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                callback(xmlhttp.responseText);
            }
        }
        xmlhttp.send(null);
    } catch (ex) {
        console.log(ex);
    }
}

function startSlideshow() {
    hideStartSlideshow();
    showNavigation();
    toggleFullScreen();
    loadPlaylist(playlist_id);
    slideshowStarted = true;
}

function selectEvent() {
    var event_id;
    var tb_value = document.getElementById("tb_event").value;
    if (document.getElementById("tb_event").value.length > 5) {
        if (tb_value.indexOf("events/") != -1) {
            event_id = tb_value.substr(tb_value.indexOf("events/") + 7);
        } else {
            alert("This is not a valid Google+ event url.");
        }
    } else {
        var radios = document.getElementsByName("event");
        for (var i = 0; i < radios.length; i++) {
            if (radios[i].checked) {
                event_id = radios[i].value;
            }
        }
    }

    if (event_id != null) {
        var event_cur;
        if (events != null) {
            for (i = 0; i < events.length; i++) {
                event_cur = events[i];
                if (event_cur.id == event_id) {
                    setEventTitle(event_cur.name);
                    console.log("Loading pictures for " + event_cur.name);
                    break;
                }
            }
        } else {
            console.log("Loading pictures for " + event_id);
        }
        getEventPictures(event_id);
        selectedEvent = true;
    }
    checkSelection();
}

function selectMusic() {
    var tb_value = document.getElementById("tb_playlist").value;
    if (tb_value.length > 5) {
        if (tb_value.indexOf("list=") != -1) {
            var tmp = tb_value.substr(tb_value.indexOf("list=") + 5);
            playlist_id = tmp;
            if (tmp.indexOf("&") != -1) {
                playlist_id = tmp.substr(0, tmp.indexOf("&"));
            }
        } else {
            alert("This is not a valid YouTube playlist url.");
        }
    } else {
        var radios = document.getElementsByName("music");
        for (var i = 0; i < radios.length; i++) {
            if (radios[i].checked) {
                playlist_id = radios[i].value;
            }
        }
    }

    if (playlist_id != null) {
        console.log("Loading tracks for " + playlist_id);
        selectedMusic = true;
    }
    checkSelection();
}

function checkSelection() {
    if (selectedEvent && selectedMusic) {
        hideSelect();
        showStartSlideshow();
        setShareUrl();
    } else {
        if (!selectedEvent) {
            showSelectEvent();
        } else {
            hideSelectEvent();
        }
        if (!selectedMusic) {
            showSelectMusic();
        } else {
            hideSelectMusic();
        }
    }
}

function initImages() {
    images = new Array();
    currentImageIndex = 0;
    for (i = 0; i < 13; i++) {
        image_new = imageStruct("images/samples/tile_" + i + ".jpg", 1, 0.5 + Math.random());
        images.push(image_new);
    }
    changeTimerStart();
}

function getNextImage() {
    if (images != null) {
        if (images.length - 1 > currentImageIndex) {
            currentImageIndex += 1;
        } else {
            currentImageIndex = 0;
        }
        return images[currentImageIndex];
    } else {
        return null
    }
}

function imageResize(url, width, height) {
    try {
        var newSize = "w" + width + "-h" + height;
        var tmp = url;
        var indexStart;
        var indexEnd;
        var index = tmp.lastIndexOf("/");
        tmp = tmp.substr(0, tmp.lastIndexOf("/"));
        tmp = tmp.substr(tmp.lastIndexOf("/") + 1);
        index = tmp.indexOf("-");
        indexStart = index;
        var tmp2 = tmp.substr(index + 1);
        index = tmp2.indexOf("-");
        indexEnd = indexStart + index;
        tmp2 = tmp2.substr(index);
        tmp = tmp.substr(0, indexEnd + 1);
        var url_new = url.replace(tmp, newSize);
        return url_new;
    } catch (ex) {
        console.log(ex);
        return url;
    }
}

function imageStruct(url, width, height) {
    var image_new = new Array();
    image_new.id = images.length;
    image_new.url = url;
    image_new.width = width;
    image_new.height = height;
    return image_new;
}

function imageExists(url) {
    for (i = 0; i < images.length; i++) {
        if (images[i].url == url) {
            return true;
        }
    }
    return false;
}

function getImageAspectRatio(image_cur) {
    return (image_cur.width / image_cur.height);
}

function getRequest(url) {
    var xmlhttp = null;
    if (window.XMLHttpRequest) {
        xmlhttp = new XMLHttpRequest();
    } else if (window.ActiveXObject) {
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }

    xmlhttp.open("GET", url, true);
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState != 4) {
            // pending
        }
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            // sent
            console.log(xmlhttp.responseText);
        }
    }
    xmlhttp.send(null);
}

function jsonToObj(value) {
    var result = null;
    try {
        result = JSON.parse(value);
    } catch (ex) {
        console.log(ex);
    }
    return result;
}

function getUrlParam(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    return null;
}

function getCurrentUrl() {
    //return window.location.href;
    return location.protocol + '//' + location.host + location.pathname;
}

function initLocalStorage() {
    console.log("Initializing local storage")
    if ( typeof (Storage) !== "undefined") {
        storageAvailable = true;
    } else {
        storageAvailable = false;
        console.log("Local storage is not supported")
    }

    if (storageAvailable) {
        if (localStorage.skipGuide == "true") {
            setSkipGuide(true);
        } else {
            setSkipGuide(false);
        }
    } else {
        skipGuide = false;
    }
}

function setSkipGuide(value) {
    skipGuide = value;
    if (storageAvailable) {
        if (value) {
            localStorage.skipGuide = "true";
        } else {
            localStorage.skipGuide = "false";
        }
    }
}