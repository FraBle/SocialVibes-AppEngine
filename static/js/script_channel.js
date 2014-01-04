function openChannel(token) {
    channel = new goog.appengine.Channel(token);
    socket = channel.open();
    socket.onopen = onChannelOpened;
    socket.onmessage = onChannelMessage;
    socket.onerror = onChannelError;
    socket.onclose = onChannelClosed;
}

function onChannelOpened() {
    console.log("Channel opened");
}

function onChannelMessage(data) {
        var response = jsonToObj(data.data);
        if (response != null) {
            try {
                console.log(response);

                for (i = 0; i < response.length; i++) {
                    var image_url = imageResize(response[i].url, 1000, 500);
                    image_new = imageStruct(image_url, 1, 0.5 + Math.random());
                    if (!imageExists(image_url)) {
                        images.push(image_new);
                    }
                }

                if (!changeActive) {
                    showNextImage();
                    changeTimerStart();
                }

                if (images.length > 1) {
                    setEventStats(images.length + " Pictures");
                } else {
                    setEventStats(images.length + " Picture");
                }
                
                setSkipGuide(true);
                window.setTimeout("refreshEventPictures()", 60000);

                fadeOutOverlay();
            } catch (ex) {  
                console.log(ex);
                alert("Something went wrong. Please make sure that your event contains at least one image and is public");
                //document.location.reload(true);
            }
        } else {
            // No event pictures found
            setOverlayCaption("There are no photos yet.<br>Be the first to take one!");
            showOverlay();
            window.setTimeout("refreshEventPictures()", 30000);
        }
}

function onChannelError(data) {
    console.log(data);
}

function onChannelClosed(data) {
    console.log(data);
}
