SocialVibes (App Engine Project)
=====================

[![GoDoc](https://godoc.org/github.com/FraBle/SocialVibes-AppEngine/socialvibes?status.png)](https://godoc.org/github.com/FraBle/SocialVibes-AppEngine/socialvibes)
[![Google+ SocialVibes](http://b.repl.ca/v1/Google+-SocialVibes-brightgreen.png)] (https://plus.google.com/118015654972563976379/)

- [SocialVibes Website](http://gcdc2013-socialvibes.appspot.com "Social Vibes")
- [Google Cloud Developer Challenge 2013](http://www.google.com/events/gcdc2013/ "Google Cloud Developer Challenge 2013")

![SocialVibes Cover](https://raw.github.com/FraBle/SocialVibes-AppEngine/master/static/images/ui/cover.png "Social Vibes Cover")

## What is Social Vibes?
Social Vibes visualizes any public Google+ event. During an event, you can start the Social Vibes slideshow to show the latest event pictures combined with music of your choice.

## How to use it?
You can select one of the public events you've created with your Google+ account or any public event by pasting the URL. For the music, you can select one of our suggestions or paste any YouTube playlist URL. After selecting an event and a playlist, you can start the slideshow.

[![How to use SocialVibes](https://raw.github.com/FraBle/SocialVibes-AppEngine/master/static/images/ui/youtube.png)](http://www.youtube.com/watch?v=KCPR8WcQYIY)

## How to set it up?

##### You need a running SocialVibes Compute Engine instance!

- You need Google Go (http://golang.org/doc/install) with all environment variables set
- You need the Go App Engine SDK (https://developers.google.com/appengine/docs/go/gettingstarted/devenvironment)
- Checkout the repository
- You need an app.yaml file, something similar to this:

```yaml
application: <<Your Google Cloud Project ID>>
version: 1
runtime: go
api_version: go1

handlers:
- url: /css
  static_dir: static/css
- url: /js
  static_dir: static/js
- url: /images
  static_dir: static/images
- url: /fonts
  static_dir: static/fonts
- url: /swfobject
  static_dir: static/swfobject
- url: /.*
  script: _go_app

inbound_services:
- channel_presence
```
- You need a queue.yaml file, something similar to this:

```yaml
queue:
- name: picture
  mode: pull
  acl:
  - user_email: <<Compute Engine email Address>>
  - user_email: <<Client ID email Address>>
  - writer_email: <<Compute Engine email Address>>
  - writer_email: <<Client ID email Address>>
- name: picturerequest
  mode: pull
  acl:
  - user_email: <<Compute Engine email Address>>
  - user_email: <<Client ID email Address>>
  - writer_email: <<Compute Engine email Address>>
  - writer_email: <<Client ID email Address>>
```
_You can find these email addresses in the Google Cloud Console (APIs & auth > Credentials):_
https://cloud.google.com/console
_More information on queue configuration:_
https://developers.google.com/appengine/docs/go/config/queue
- You need a socialvibes.toml file under socialvibes/config/socialvibes.toml, e.g.:

```toml
computeEngineAddress = "<<IP>>:<<Port>>"
[google]
clientID = "<<Your Client ID for web application>>"
clientSecret = "<<Your Client secret for web application>>"
```
_You can find the Client ID and secret in the Google Cloud Console (APIs & auth > Credentials):_
https://cloud.google.com/console
- You need to deploy the app with `goapp deploy`

## Used packages
#### Google App Engine
- [appengine](https://developers.google.com/appengine/docs/go/reference "appengine")
- [appengine/datastore](https://developers.google.com/appengine/docs/go/datastore/reference "appengine/datastore")
- [appengine/taskqueue](https://developers.google.com/appengine/docs/go/taskqueue/reference "appengine/taskqueue")
- [appengine/channel](https://developers.google.com/appengine/docs/go/channel/reference "appengine/channel")
- [appengine/urlfetch](https://developers.google.com/appengine/docs/go/urlfetch/reference "appengine/urlfetch")

#### Gorilla Web Toolkit
- [github.com/gorilla/mux](http://www.gorillatoolkit.org/pkg/mux "github.com/gorilla/mux")
- [github.com/gorilla/rpc/v2](http://www.gorillatoolkit.org/pkg/rpc/v2 "github.com/gorilla/rpc/v2")
- [github.com/gorilla/rpc/v2/json](http://www.gorillatoolkit.org/pkg/rpc/v2/json "github.com/gorilla/rpc/v2/json")
- [github.com/gorilla/securecookie](http://www.gorillatoolkit.org/pkg/securecookie "github.com/gorilla/securecookie")

#### Others
- [code.google.com/p/goauth2/oauth](https://code.google.com/p/goauth2/ "code.google.com/p/goauth2/oauth")
- [code.google.com/p/google-api-go-client/calendar/v3](https://code.google.com/p/google-api-go-client/ "code.google.com/p/google-api-go-client/calendar/v3")
- [github.com/stvp/go-toml-config](https://github.com/stvp/go-toml-config "github.com/stvp/go-toml-config")
- [github.com/hoisie/mustache](https://github.com/hoisie/mustache "github.com/hoisie/mustache")
- [github.com/hnakamur/gaesessions](https://github.com/hnakamur/gaesessions "github.com/hnakamur/gaesessions")
