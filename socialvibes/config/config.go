// Package config allows to parse a TOML config file.
// It houses the OAuth configuration for Google API access.
package config

import (
	"code.google.com/p/goauth2/oauth"
	"github.com/stvp/go-toml-config"
)

var (
	// GoogleClientID is the client ID for OAuthConfig.
	// It's stored inside the config TOML file for security reasons.
	GoogleClientID     = config.String("google.clientID", "Unknown")
	// GoogleClientSecret is the client secret for OAuthConfig.
	// It's stored inside the config TOML file for security reasons.
	GoogleClientSecret = config.String("google.clientSecret", "Unknown")
	// OAuthConfig is the used configuration for every Google API access.
	OAuthConfig        = &oauth.Config{
		Scope:    "https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/calendar.readonly",
		AuthURL:  "https://accounts.google.com/o/oauth2/auth",
		TokenURL: "https://accounts.google.com/o/oauth2/token",
		// "postmessage" for code-flow for server side apps
		RedirectURL: "postmessage",
	}
	ComputeEngineAddress = config.String("computeEngineAddress", "Unknown")
)

// ReadConfig parses a given TOML file and fills variables with the given information (mostly API secrets).
func ReadConfig() {
	config.Parse("socialvibes/config/socialvibes.toml")
	OAuthConfig.ClientId = *GoogleClientID
	OAuthConfig.ClientSecret = *GoogleClientSecret
}
