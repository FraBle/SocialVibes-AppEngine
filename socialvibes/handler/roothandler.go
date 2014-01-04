// Package handler includes all handle functions for the HTTP server.
package handler

import (
	"appengine"

	"fmt"
	"net/http"

	"github.com/hoisie/mustache"

	"socialvibes/config"
)

// The RootHandler responds with the landing page.
func RootHandler(w http.ResponseWriter, r *http.Request) {
	// Some security pre-checks
	if r.URL.Path != "/" {
		context := appengine.NewContext(r)
		context.Errorf("handler > roothandler.go > RootHandler > HTTP 404 Not Found")
		http.NotFound(w, r)
		return
	}

	// The Google Client ID is used for the Google+ Sing-In Button
	variables := map[string]string{
		"ClientID": *config.GoogleClientID,
	}

	htmldoc := mustache.RenderFile("templates/index.html", variables)
	fmt.Fprint(w, htmldoc)
}
