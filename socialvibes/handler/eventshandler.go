package handler

import (
	"appengine"
	"appengine/urlfetch"

	"fmt"
	"net/http"
	"encoding/json"

	"code.google.com/p/goauth2/oauth"
	"github.com/gorilla/mux"

	"socialvibes/events"
	"socialvibes/config"
)

// The EventsHandler responds the Google+ events for the signed-in user.
func EventsHandler(w http.ResponseWriter, r *http.Request) {
	context := appengine.NewContext(r)

	// Only show events for a connected user
	session, err := sessionStore.Get(r, "socialVibes")
	if err != nil {
		context.Errorf("handler > eventshandler.go > EventsHandler > sessionStore.Get(): %v", err)
	}
	token := session.Values["accessToken"]
	if token == nil {
		context.Errorf("handler > eventshandler.go > EventsHandler > Current user not connected")
		http.Error(w, "Current user not connected", 401)
		return
	}

	// Create a new authorized API client
	transport := &oauth.Transport{
		Config:    config.OAuthConfig,
		Transport: &urlfetch.Transport{Context: context},
	}
	tok := new(oauth.Token)
	tok.AccessToken = token.(string)
	transport.Token = tok

	// Request Google+ events via API call
	eventlist, err := events.ParseEventInfos(transport, context)
	if err != nil {
		context.Errorf("handler > eventshandler.go > EventsHandler > events.ParseEventInfos(): %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Create a JSON response with all found events
	response, err := json.Marshal(eventlist)
	if err != nil {
		context.Errorf("handler > eventshandler.go > EventsHandler > json.Marshal(): %v", err)
		http.Error(w, err.Error(), 500)
		return
	}
	fmt.Fprint(w, string(response))
	return
}

// The EventsGalleryHandler triggers a (re-)aggregation of event pictures for a given event
func EventsGalleryHandler(w http.ResponseWriter, r *http.Request) {
	context := appengine.NewContext(r)

	// Retrieve the event ID from the request
	vars := mux.Vars(r)
	eventId := vars["eventId"]

	// Trigger the (re-)aggregation
	err := events.RefreshEventGallery(context, eventId)
	if err != nil {
		context.Errorf("handler > eventshandler.go > EventsGalleryHandler > events.RefreshEventGallery(): %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	return
}