var content;

var cursor_position = new Array(0, 0);
var cursor_last = new Array(0, 0);
var cursor_last_move = new Date().getTime() + 5000;

var tiles;

var navigation_hidden = false;

var refreshInterval = 10000;
var changeInterval = 5000;
var changeActive = true;

var nextImagePending = false;

function load() {
    content = document.getElementById("content");
    resizeContent();

    initImages();
    initTiles();
    initOverlay();
    initLocalStorage();

    showLogin();
    hideNavigation();
    hideSelect();
    hideStartSlideshow();

    parseUrlParams();

    setInterval(checkCursorMoving, 100);
    document.body.style.overflowY = "hidden";

}

function initTiles() {
    tiles = new Array();

    var div = document.getElementById("tile_0_0");
    var lastChanged = new Date();
    var isPortrait = true;
    tiles.push(tileStruct(div, lastChanged, isPortrait));

    var div = document.getElementById("tile_0_1");
    var lastChanged = new Date();
    var isPortrait = true;
    tiles.push(tileStruct(div, lastChanged, isPortrait));

    var div = document.getElementById("tile_1");
    var lastChanged = new Date();
    var isPortrait = false;
    tiles.push(tileStruct(div, lastChanged, isPortrait));

    var div = document.getElementById("tile_2");
    var lastChanged = new Date();
    var isPortrait = false;
    tiles.push(tileStruct(div, lastChanged, isPortrait));

    var div = document.getElementById("tile_3");
    var lastChanged = new Date();
    var isPortrait = false;
    tiles.push(tileStruct(div, lastChanged, isPortrait));

    var delay = 0;
    for (i = 0; i < tiles.length; i++) {
        window.setTimeout("showNextImage()", delay);
        delay += 500;
    }
}

function parseUrlParams() {
    // Get YouTube playlist id
    var param_playlist = getUrlParam("playlist");
    if (param_playlist != null) {
        var tb_playlist = document.getElementById("tb_playlist");
        tb_playlist.value = "http://www.youtube.com/playlist?list=" + param_playlist;
        console.log("Playlist ID set to " + param_playlist);
        selectMusic();
    }

    // Get G+ event ID
    var param_event = getUrlParam("event");
    if (param_event != null) {
        var tb_event = document.getElementById("tb_event");
        tb_event.value = "https://plus.google.com/events/" + param_event;
        console.log("Event ID set to " + param_event);
        selectEvent();
    }

    
}

function getNextTile(getPortrait) {
    var tile_next_id = 2;
    for (i = 0; i < tiles.length; i++) {
        if (tiles[i].isPortrait == getPortrait) {
            if (tiles[i].lastChanged < tiles[tile_next_id].lastChanged) {
                tile_next_id = i;
            }
        }
    }
    tiles[tile_next_id].lastChanged = new Date();
    return tiles[tile_next_id].div;
}

function tileStruct(div, lastChanged, isPortrait) {
    var tile_new = new Array();
    tile_new.div = div;
    tile_new.lastChanged = lastChanged;
    tile_new.isPortrait = isPortrait;
    return tile_new;
}

function addEventToSelector(event_cur) {
    var list = document.getElementById("event_list");
    var event_radio = document.createElement('input');
    event_radio.setAttribute('type', 'radio');
    event_radio.setAttribute('name', 'event');
    event_radio.setAttribute('value', event_cur.id);

    var event_name;
    if (event_cur.ispublic) {
        event_name = document.createTextNode(event_cur.name);
    } else {
        //event_name = document.createTextNode("Private: " + event_cur.name);
        event_radio.setAttribute('disabled', "true");
        event_radio.setAttribute('class', "radio_disabled hint--top");
        event_radio.setAttribute('data-hint', "This event is private, please select a public event.");
        
        event_name = document.createElement("span");

        event_title = document.createTextNode(event_cur.name);
        event_name.appendChild(event_title);
    }

    var br = document.createElement("br");

    list.appendChild(event_radio);
    list.appendChild(event_name);
    list.appendChild(br);
}

function initOverlay() {
    setOverlayCaption("Initializing content");
    window.setTimeout("setOverlayCaption('Loading player')", 1000);
    window.setTimeout("checkPlayerReady()", 10000);
}

function showOverlay() {
    document.getElementById("overlay").style.display = "block";
    window.setTimeout("fadeInOverlay()", 50);
}

function fadeInOverlay() {
    document.getElementById("overlay").style.opacity = 1;
    document.getElementById("overlay").style.backgroundColor = "#666";
}

function fadeOutOverlay() {
    setOverlayCaption("Ready");
    document.getElementById("overlay").style.opacity = 0;
    document.getElementById("overlay").style.backgroundColor = "#FFF";
    window.setTimeout("hideOverlay()", 3000);
}

function hideOverlay() {
    document.getElementById("overlay").style.display = "none";
    if (!skipGuide) {
        window.setTimeout("showGuide()", 1000);
        skipGuide = true;
    }
}

function setOverlayCaption(value) {
    document.getElementById("overlay_caption").innerHTML = value;
}

function showGuide() {
    document.getElementById("guide").style.display = "block";
    window.setTimeout("fadeInGuide()", 50);
}

function fadeInGuide() {
    document.getElementById("guide").style.opacity = 1;
    document.getElementById("guide").style.backgroundColor = "rgba(50, 50, 50, 0.9)";
}

function fadeOutGuide() {
    document.getElementById("guide").style.opacity = 0;
    document.getElementById("guide").style.backgroundColor = "rgba(255, 255, 255, 0.9)";
    window.setTimeout("hideGuide()", 1000);
}

function hideGuide() {
    document.getElementById("guide").style.display = "none";
}

function setEventTitle(value) {
    document.getElementById("event_title").innerHTML = value;
}

function setEventStats(value) {
    document.getElementById("event_stats").innerHTML = value;
}

function setShareUrl() {
    var url = getCurrentUrl();
    if (event_id != null && playlist_id != null) {
        url = url + "?event=" + event_id;
        url = url + "&playlist=" + playlist_id;
    }

    var url_short = url;
    if (url_short.length > 50) {
        url_short = url_short.substr(0,50) + "...";
    }

    document.getElementById("details_url_share").innerHTML = url_short;
    document.getElementById("details_url_share").href = url;
}

function changeTimerStart() {
    changeActive = true;
    window.setTimeout("changeTimerTick()", changeInterval);
}

function changeTimerTick() {
    showNextImage();

    if (changeActive) {
        changeTimerStart();
    }
}

function changeTimerStop() {
    changeActive = false;
}

function showNextImage() {
    var image_next = getNextImage();
    if (image_next != null) {
        // find a tile for the new image
        // based on aspect ratio and last changed
        var tile_next;
        var ratio = getImageAspectRatio(image_next);
        if (ratio <= 1) {
            // portrait
            tile_next = getNextTile(true);
        } else {
            // landscape
            tile_next = getNextTile(false);
        }

        loadImageInTile(image_next, tile_next);
    }
}

function loadImageInTile(image_cur, tile_cur) {
    var background_new = "url('" + image_cur.url + "')";
    var command = "setTileBackground(\"" + tile_cur.id + "\", \"" + background_new + "\")";

    fadeOutDiv(getTileImage(tile_cur));
    window.setTimeout(command, 1000);
}

function fadeOutDiv(div) {
    div.style.opacity = 0;
}

function fadeInDiv(div) {
    div.style.opacity = 1;
}

function fadeOutDivId(divid) {
    document.getElementById(divid).style.opacity = "0";
}

function fadeInDivId(divid) {
    document.getElementById(divid).style.opacity = "1";
}

function hideDivId(divid) {
    document.getElementById(divid).style.display = "none";
}

function showDivId(divid) {
    document.getElementById(divid).style.display = "block";
}

function fadeInTileImage(div_id) {
    fadeInDiv(getTileImage(document.getElementById(div_id)));
}

function setTileBackground(div_id, value) {
    var tile_cur = document.getElementById(div_id);
    var tile_image = getTileImage(tile_cur);
    tile_image.style.backgroundImage = value;
    window.setTimeout("fadeInTileImage('" + div_id + "')", 500);
}

function getTileImage(tile_cur) {
    return tile_cur.childNodes[1];
}

function setPercentage() {
    var value_percent = getVideoPercentage();
    var width_total = document.getElementById("track_title_container").offsetWidth;
    var width_percent = Math.round((width_total * value_percent) / 100);
    //document.getElementById("percentage").style.right = (width_total - width_percent) + "px";
}

function checkCursorMoving() {
    if (cursor_position[0] == cursor_last[0] && cursor_position[0] == cursor_last[0]) {
        var now = new Date().getTime();
        if (now - cursor_last_move > 5000) {
            hideNavigation();
        }
    } else {
        showNavigation();
        cursor_last_move = new Date().getTime();
    }
    cursor_last = cursor_position;

    setPercentage();
}

function showNavigation() {
    if (navigation_hidden && loggedIn) {
        navigation_hidden = false;
        document.body.style.overflowY = "scroll";
        document.getElementById("navigation").style.opacity = 1;
        document.getElementById("controls").style.opacity = 1;
        showBar("bar_1");
        window.setTimeout("showScrollbar()", 100);
    }

}

function hideNavigation() {
    if (!navigation_hidden) {
        if (slideshowStarted) {
            document.body.style.overflowY = "hidden";
        }
        document.getElementById("navigation").style.opacity = 0;
        document.getElementById("controls").style.opacity = 0;
        hideBar("bar_1");
        window.setTimeout("hideScrollbar()", 100);
    }
    navigation_hidden = true;
}

function hideBar(divid) {
    document.getElementById(divid).style.height = 0 + "px";
}

function showBar(divid) {
    document.getElementById(divid).style.height = 100 + "px";
}

function hideLogin() {
    fadeOutDivId("bar_login");
    fadeOutDivId("login_text");
    window.setTimeout("hideDivId('bar_login')", 1000);
    window.setTimeout("hideDivId('login_text')", 1000);
}

function showLogin() {
    showDivId("bar_login");
    showDivId("login_text");
    window.setTimeout("fadeInDivId('bar_login')", 10);
    window.setTimeout("fadeInDivId('login_text')", 10);
}

function hideSelect() {
    hideSelectEvent();
    hideSelectMusic();
}

function showSelect() {
    showSelectEvent();
    showSelectMusic();
}

function hideSelectEvent() {
    fadeOutDivId("bar_events");
    fadeOutDivId("events_text");
    window.setTimeout("hideDivId('bar_events')", 1000);
    window.setTimeout("hideDivId('events_text')", 1000);
}

function showSelectEvent() {
    showDivId("bar_events");
    showDivId("events_text");
    window.setTimeout("fadeInDivId('bar_events')", 10);
    window.setTimeout("fadeInDivId('events_text')", 10);
}

function hideSelectMusic() {
    fadeOutDivId("bar_music");
    fadeOutDivId("music_text");
    window.setTimeout("hideDivId('bar_music')", 1000);
    window.setTimeout("hideDivId('music_text')", 1000);
}

function showSelectMusic() {
    showDivId("bar_music");
    showDivId("music_text");
    window.setTimeout("fadeInDivId('bar_music')", 10);
    window.setTimeout("fadeInDivId('music_text')", 10);
}

function hideStartSlideshow() {
    fadeOutDivId("bar_slideshow");
    fadeOutDivId("slideshow_text");
    window.setTimeout("hideDivId('bar_slideshow')", 1000);
    window.setTimeout("hideDivId('slideshow_text')", 1000);
}

function showStartSlideshow() {
    showDivId("bar_slideshow");
    showDivId("slideshow_text");
    window.setTimeout("fadeInDivId('bar_slideshow')", 10);
    window.setTimeout("fadeInDivId('slideshow_text')", 10);
}

function hideScrollbar() {
    document.body.style.marginTop = "-1px";
}

function showScrollbar() {
    document.body.style.marginTop = "0px";
}

function showVolumeControl() {
    document.getElementById("volume_container").style.width = "130px";
    document.getElementById("volume_buttons").style.opacity = 1;
    window.setTimeout("setVolumePercentage()", 1000);
}

function hideVolumeControl() {
    document.getElementById("volume_container").style.width = "30px";
    document.getElementById("volume_buttons").style.opacity = 0;
}

function volumeDown() {
    var volume_new = getVolume() - 10;
    if (volume_new < 0) {
        volume_new = 0;
    }
    setVolume(volume_new);
    setVolumePercentage();
}

function volumeUp() {
    var volume_new = getVolume() + 10;
    if (volume_new > 100) {
        volume_new = 100;
    }
    setVolume(volume_new);
    setVolumePercentage();
}

function setVolumePercentage() {
    var value_percent = getVolume();
    var width_total = document.getElementById("volume_container").offsetWidth;
    var width_percent = Math.round((width_total * value_percent) / 100);
    document.getElementById("volume_percentage").style.right = (width_total - width_percent) + "px";
}

function resizeContent() {
    content = document.getElementById("content");
    var screen_size = getScreenSize();
    content.style.width = screen_size[0] + "px";
    content.style.height = screen_size[1] + "px";
}

window.onresize = function(event) {
    resizeContent();
}

window.onmousemove = function(event) {
    event = event || window.event;
    cursor_position = new Array(event.clientX, event.clientY);
}

document.onkeydown = function(evt) {
    evt = evt || window.event;
    readKeyPress(evt.keyCode);
};

function readKeyPress(keycode) {
    switch (keycode) {
        case 179:
            // Media pause
            togglePause();
            break;
        case 176:
            // Media next
            playNext();
            break;
        default:

    }
}

function updateUi() {
    // unstarted (-1), ended (0), playing (1), paused (2), buffering (3), video cued (5)
    var playerState = getVideoState();
    switch (playerState) {
        case -1:
            document.getElementById("button_play").style.backgroundImage = "url(images/ui/icon_play.png)";
            break;
        case 0:
            //playNextTrack();
            break;
        case 1:
            document.getElementById("button_play").style.backgroundImage = "url(images/ui/icon_pause.png)";
            break;
        case 2:
            document.getElementById("button_play").style.backgroundImage = "url(images/ui/icon_play.png)";
            break;
        case 3:
            document.getElementById("button_play").style.backgroundImage = "url(images/ui/loading.gif)";
            break;
        default:
    }
}

function showInfo() {
    smoothScroll("info", 500);
}

function toggleFullScreen() {
    if ((document.fullScreenElement && document.fullScreenElement !== null) || (!document.mozFullScreen && !document.webkitIsFullScreen)) {
        if (document.documentElement.requestFullScreen) {
            document.documentElement.requestFullScreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullScreen) {
            document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    } else {
        if (document.cancelFullScreen) {
            document.cancelFullScreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        }
    }
    resizeContent();
}

function getScreenSize() {
    var myWidth = 0,
        myHeight = 0;
    if (typeof(window.innerWidth) == 'number') {
        //Non-IE
        myWidth = window.innerWidth;
        myHeight = window.innerHeight;
    } else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
        //IE 6+ in 'standards compliant mode'
        myWidth = document.documentElement.clientWidth;
        myHeight = document.documentElement.clientHeight;
    } else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
        //IE 4 compatible
        myWidth = document.body.clientWidth;
        myHeight = document.body.clientHeight;
    }
    return [myWidth, myHeight];
}

function smoothScroll(divid, duration) {
    var anchor = document.getElementById(divid);
    // Calculate how far and how fast to scroll
    var startLocation = window.pageYOffset;
    var endLocation = anchor.offsetTop;
    var distance = endLocation - startLocation;
    var increments = distance / (duration / 16);
    var stopAnimation;

    // Scroll the page by an increment, and check if it's time to stop
    var animateScroll = function() {
        window.scrollBy(0, increments);
        stopAnimation();
    };

    // If scrolling down
    if (increments >= 0) {
        // Stop animation when you reach the anchor OR the bottom of the page
        stopAnimation = function() {
            var travelled = window.pageYOffset;
            if ((travelled >= (endLocation - increments) - 10)) {
                clearInterval(runAnimation);
            }
            if (((window.innerHeight + travelled) >= document.body.offsetHeight)) {
                clearInterval(runAnimation);
            }
        };
    }
    // If scrolling up
    else {
        // Stop animation when you reach the anchor OR the top of the page
        stopAnimation = function() {
            var travelled = window.pageYOffset;
            if (travelled <= endLocation - 10 || travelled <= 0) {
                clearInterval(runAnimation);
            }
        };
    }

    // Loop the animation function
    var runAnimation = setInterval(animateScroll, 16);
    document.body.style.overflowY = "scroll";
};
