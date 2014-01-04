package handler

import (
	"appengine"
	"appengine/channel"

	"fmt"
	"net/http"
	"strings"

	"github.com/gorilla/mux"

	"socialvibes/db"
)

// The ChannelConnectHandler only logs newly connected channel clients.
func ChannelConnectHandler(w http.ResponseWriter, r *http.Request) {
	clientID := r.FormValue("from")
	context := appengine.NewContext(r)
	context.Infof("handler > channelhandler.go > ChannelConnectHandler: connected client %v", clientID)
}

// The ChannelDisconnectHandler triggers the removal of disconnected channel clients in the App Engine Datastore.
func ChannelDisconnectHandler(w http.ResponseWriter, r *http.Request) {
	context := appengine.NewContext(r)

	// Identify the client
	clientID := r.FormValue("from")
	context.Infof("handler > channelhandler.go > ChannelDisconnectHandler: disconnected client %v", clientID)
	token := strings.Split(clientID, "-")
	if len(token) != 2 {
		context.Errorf("handler > channelhandler.go > ChannelDisconnectHandler: No Valid Token for Disconnect")
		http.Error(w, "No Valid Token for Disconnect", http.StatusInternalServerError)
		return
	}
	userId := token[0]
	eventId := token[1]

	// Actually remove the client
	err := db.RemoveChannelClient(context, eventId, userId)
	if err != nil {
		context.Errorf("handler > channelhandler.go > ChannelDisconnectHandler > db.RemoveChannelClient() No Valid Token for Disconnect: %v", err)
		http.Error(w, "No Valid Token for Disconnect", http.StatusInternalServerError)
		return
	}
}

// The GetTokenHandler creates a token for the requesting client and returns it.
func GetTokenHandler(w http.ResponseWriter, r *http.Request) {
	context := appengine.NewContext(r)
	
	// The client ID is a mix of the Google+ user and event ID
	vars := mux.Vars(r)
	userId := vars["userId"]
	eventId := vars["eventId"]
	
	// Pre-check the parameter
	switch {
		case eventId == "":
			http.Error(w, "Event Id is empty", http.StatusInternalServerError)
			return
		case userId == "":
			http.Error(w, "User Id is empty", http.StatusInternalServerError)
			return
	}

	// Create the token
	token, err := channel.Create(context, userId+"-"+eventId)
	if err != nil {
		context.Errorf("handler > channelhandler.go > GetTokenHandler > channel.Create(): %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	// insert the client ID (userId+";"+eventId) into the App Engine Datastore
	err = db.InsertChannelClient(context, eventId, userId)
	if err != nil {
		context.Errorf("handler > channelhandler.go > GetTokenHandler > db.InsertChannelClient(): %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Send the token to the requesting client via HTTP response
	fmt.Fprint(w, token)
}