package handler

import (
	"appengine"
	"appengine/urlfetch"

	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
)

// The ConnectHandler exchanges the one-time authorization code for a token and stores the token in the session.
func ConnectHandler(w http.ResponseWriter, r *http.Request) {
	context := appengine.NewContext(r)
	session, _ := sessionStore.Get(r, "socialVibes")

	// Get the one time code from the GET parameter
	vars := mux.Vars(r)
	code := vars["code"]
	// Replace the escaped forward slahes
	code = strings.Replace(code, "[s]", "/", -1)

	// Get the Google+ user ID
	accessToken, idToken, err := exchangeToken(code, context)
	gplusID, err := decodeIdToken(idToken, context)
	if err != nil {
		context.Errorf("handler > accounthandler.go > ConnectHandler > exchangeToken() || decodeIdToken(): %v", err)
		http.Error(w, err.Error(), 500)
		return
	}

	// Check if the user is already connected
	storedToken := session.Values["accessToken"]
	storedGPlusID := session.Values["gplusID"]

	if storedToken == nil || storedGPlusID != gplusID {
		// Store the access token and user ID in the session for later use
		session.Values["accessToken"] = accessToken
		session.Values["gplusID"] = gplusID
		session.Save(r, w)
	}

	// Send the Google+ user ID as response
	var response = map[string]string{
		"userId": gplusID,
	}
	responseJson, err := json.Marshal(response)
	if err != nil {
		context.Errorf("handler > accounthandler.go > ConnectHandler > json.Marshal(): %v", err)
		http.Error(w, err.Error(), 500)
		return
	}
	fmt.Fprint(w, string(responseJson))
	return
}

// The DisconnectHandler revokes the current user's token and resets their session.
func DisconnectHandler(w http.ResponseWriter, r *http.Request) {
	context := appengine.NewContext(r)

	// Only disconnect a connected user
	session, err := sessionStore.Get(r, "socialVibes")
	if err != nil {
		context.Errorf("handler > accounthandler.go > DisconnectHandler > sessionStore.Get(): %v", err)
	}
	token := session.Values["accessToken"]
	if token == nil {
		http.Error(w, "User is not connected", 401)
		return
	}

	// Make a secure GET request via App Engine URL Fetch service to revoke current token
	client := urlfetch.Client(context)
	url := "https://accounts.google.com/o/oauth2/revoke?token=" + token.(string)
	resp, err := client.Get(url)
	if err != nil {
		context.Errorf("handler > accounthandler.go > DisconnectHandler > client.Get(): %v", err)
		http.Error(w, "Failed to revoke token for a given user: "+err.Error(), 400)
		return
	}
	defer resp.Body.Close()

	// Reset the user's session
	session.Values["accessToken"] = nil
	session.Save(r, w)
	return
}