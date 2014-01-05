package handler

// The session and API access management functions are extracted from the Google+ Go Quick-Start project on https://github.com/googleplus/gplus-quickstart-go

import (
	"appengine"
	"appengine/urlfetch"

	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/url"
	"strings"

	"github.com/gorilla/securecookie"
	"github.com/hnakamur/gaesessions"

	"socialvibes/config"
)

// sessionStore is a session store for GAE Memcache backed up by GAE Datastore.
// It looks up a session in Memcache first, and if cache misses it also looks up in Datastore.
var sessionStore = gaesessions.NewMemcacheDatastoreStore("", "", gaesessions.DefaultNonPersistentSessionDuration, securecookie.GenerateRandomKey(128))

// Token represents an OAuth token response.
type Token struct {
	AccessToken 	string `json:"access_token"`
	TokenType   	string `json:"token_type"`
	ExpiresIn   	int    `json:"expires_in"`
	IdToken     	string `json:"id_token"`
}

// ClaimSet represents an IdToken response.
type ClaimSet struct {
	Sub string
}

// randomString generates and returns a random string of a specific length
func randomString(length int) (str string) {
	b := make([]byte, length)
	rand.Read(b)
	return base64.StdEncoding.EncodeToString(b)
}

// exchangeToken takes an authentication code and exchanges it with the OAuth endpoint 
// for a Google API bearer token and a Google+ ID.
func exchangeToken(code string, context appengine.Context) (accessToken string, idToken string, err error) {
	// Exchange the authorization code for a credentials object via a POST request
	addr := "https://accounts.google.com/o/oauth2/token"
	values := url.Values{
		"Content-Type":  {"application/x-www-form-urlencoded"},
		"code":          {code},
		"client_id":     {*config.GoogleClientID},
		"client_secret": {*config.GoogleClientSecret},
		"redirect_uri":  {config.OAuthConfig.RedirectURL},
		"grant_type":    {"authorization_code"},
	}
	client := urlfetch.Client(context)
	resp, err := client.PostForm(addr, values)
	if err != nil {
		context.Errorf("handler > session.go > exchangeToken > client.PostForm(): %v", err)
		return "", "", fmt.Errorf("Exchanging code: %v", err)
	}
	defer resp.Body.Close()

	// Decode the response body into a token object
	var token Token
	err = json.NewDecoder(resp.Body).Decode(&token)
	if err != nil {
		context.Errorf("handler > session.go > exchangeToken > json.NewDecoder().Decode(): %v", err)
		return "", "", fmt.Errorf("Decoding access token: %v", err)
	}

	return token.AccessToken, token.IdToken, nil
}

// decodeIdToken takes an ID Token and decodes it to fetch the Google+ ID within
func decodeIdToken(idToken string, context appengine.Context) (gplusID string, err error) {
	var set ClaimSet
	if idToken != "" {
		// Check that the padding is correct for a base64decode
		parts := strings.Split(idToken, ".")
		if len(parts) < 2 {
			return "", fmt.Errorf("Malformed ID token")
		}
		// Decode the ID token
		b, err := base64Decode(parts[1])
		if err != nil {
			context.Errorf("handler > session.go > decodeIdToken > base64Decode() Malformed ID token: %v", err)
			return "", fmt.Errorf("Malformed ID token: %v", err)
		}
		err = json.Unmarshal(b, &set)
		if err != nil {
			context.Errorf("handler > session.go > decodeIdToken > json.Unmarshal() Malformed ID token: %v", err)
			return "", fmt.Errorf("Malformed ID token: %v", err)
		}
	}
	return set.Sub, nil
}

// base64Decode decodes a given base64 string and returns a byte array.
func base64Decode(s string) ([]byte, error) {
	// Add back missing padding
	switch len(s) % 4 {
	case 2:
		s += "=="
	case 3:
		s += "="
	}
	return base64.URLEncoding.DecodeString(s)
}