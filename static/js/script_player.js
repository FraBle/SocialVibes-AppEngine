var playlist;

function onYouTubePlayerReady(playerId) {
    console.log("Player ready");
    ytplayer = document.getElementById("myytplayer");
    ytplayer.addEventListener("onStateChange", "onytplayerStateChange");
    ytplayer.setLoop(true);
    fadeOutOverlay();
}

function onytplayerStateChange(newState) {
    updateUi();
    ytplayer = document.getElementById("myytplayer");
    try {
        var index = getVideoIndex();
        document.getElementById("details_track_title_value").innerHTML = playlist.videos[index].title;
        document.getElementById("details_track_playlist_value").innerHTML = playlist.title;

        document.getElementById("details_url_video_value").innerHTML = playlist.videos[index].url;
        document.getElementById("details_url_video_value").href = playlist.videos[index].url;
        document.getElementById("details_url_playlist_value").innerHTML = "http://www.youtube.com/playlist?list=" + playlist.id;
        document.getElementById("details_url_playlist_value").href = "http://www.youtube.com/playlist?list=" + playlist.id;
    } catch (ex) {

    }
}

function getPlaylistDetails(id) {
    try {
        var url = "http://gdata.youtube.com/feeds/api/playlists/" + id + "?v=2&alt=json";
        console.log(url);
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
                var videos = new Array();
                var video_ids = new Array();
                playlist = new Array();

                var playlist_json = jsonToObj(xmlhttp.responseText);

                var title = playlist_json.feed.title.$t;

                for (i = 0; i < playlist_json.feed.entry.length; i++) {
                    var vid_cur = playlist_json.feed.entry[i];

                    var vid_id = vid_cur.content.src;
                    vid_id = vid_id.substr(vid_id.indexOf("com/v/") + 6);
                    vid_id = vid_id.substr(0, vid_id.indexOf("?"));

                    var vid_title = vid_cur.title.$t;

                    var vid = new Array();
                    vid.id = vid_id;
                    vid.title = vid_title;
                    vid.url = "http://www.youtube.com/watch?v=" + vid_id;

                    videos.push(vid);
                    video_ids.push(vid_id);
                }

                playlist.id = id;
                playlist.title = title;
                playlist.videos = videos;
                playlist.ids = video_ids;

                console.log(playlist);

                loadPlaylistArray(playlist.ids);
            }
        }
        xmlhttp.send(null);
    } catch (ex) {
        console.log("Error while requesting playlist");
        console.log(ex);
    }
}

function checkPlayerReady() {
    if (ytplayer) {
        return true;
    } else {
        setOverlayCaption('You need Flash player 8+ and JavaScript enabled.');
        return false;
    }
}

function togglePause() {
    if (getVideoState() != 1) {
        playVideo();
    } else {
        pauseVideo();
    }
}

function playVideo() {
    if (ytplayer) {
        ytplayer.playVideo();
    }
}

function pauseVideo() {
    if (ytplayer) {
        ytplayer.pauseVideo();
    }
}

function loadVideo(id) {
    if (ytplayer) {
        ytplayer.loadVideoById(id, 0, "small");
    }
}

function loadPlaylist(id) {
    getPlaylistDetails(id);
}

function loadPlaylistArray(data) {
    if (ytplayer) {
        ytplayer.loadPlaylist(data, 0, 0, "small");
        window.setTimeout("setShuffle(true)",20);
    }
}

function playNext() {
    if (ytplayer) {
        ytplayer.nextVideo();
    }
}

function playPrev() {
    if (ytplayer) {
        ytplayer.previousVideo();
    }
}

function playAt(index) {
    if (ytplayer) {
        ytplayer.playVideoAt(index);
    }
}

function muteVideo() {
    if (ytplayer) {
        ytplayer.mute();
    }
}

function unmuteVideo() {
    if (ytplayer) {
        ytplayer.unmute();
    }
}

function isMuted() {
    if (ytplayer) {
        return ytplayer.isMuted();
    }
    return false;
}

function getVideoIndex() {
    if (ytplayer) {
        return ytplayer.getPlaylistIndex();
    }
}

function getVideoState() {
    if (ytplayer) {
        // unstarted (-1), ended (0), playing (1), paused (2), buffering (3), video cued (5)
        return ytplayer.getPlayerState();
    }
    return false;
}

function setShuffle(value) {
    if (ytplayer) {
        ytplayer.setShuffle(value);
    }
}

function setVolume(value) {
    if (ytplayer) {
        ytplayer.setVolume(value)
    }
}

function getVolume() {
    if (ytplayer) {
        return ytplayer.getVolume();
    }
    return 100;
}

function getVideoDuration() {
    if (ytplayer) {
        return ytplayer.getDuration();
    }
    return 100;
}

function getVideoElapsedTime() {
    if (ytplayer) {
        return ytplayer.getCurrentTime();
    }
    return 0;
}

function getVideoPercentage() {
    var duration = getVideoDuration();
    var time = getVideoElapsedTime();
    return ((100 * time) / duration);
}
