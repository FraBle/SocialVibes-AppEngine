package socialvibes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/gorilla/rpc/v2"
	"github.com/gorilla/rpc/v2/json"

	"socialvibes/config"
	"socialvibes/handler"
	svrpc "socialvibes/rpc"
)

func init() {
	// Reading API client ID and secret
	config.ReadConfig()

	router := mux.NewRouter()

	router.HandleFunc("/", handler.RootHandler).Methods("GET")
	router.HandleFunc("/events", handler.EventsHandler).Methods("GET")
	router.HandleFunc("/events/gallery/{eventId}", handler.EventsGalleryHandler).Methods("GET")

	// Google+ Sign in Handler
	router.HandleFunc("/connect/{code}", handler.ConnectHandler).Methods("GET")
	router.HandleFunc("/disconnect", handler.DisconnectHandler).Methods("POST")

	// Handler for Channels
	router.HandleFunc("/token/{userId}/{eventId}", handler.GetTokenHandler).Methods("GET")
	router.HandleFunc("/_ah/channel/connected/", handler.ChannelConnectHandler).Methods("POST")
	router.HandleFunc("/_ah/channel/disconnected/", handler.ChannelDisconnectHandler).Methods("POST")

	// RCP server for request from Compute Engine
	rpcServer := rpc.NewServer()
	rpcServer.RegisterCodec(json.NewCodec(), "application/json")
	rpcServer.RegisterService(new(svrpc.EventService), "")
	http.Handle("/rpc", rpcServer)
	http.Handle("/", router)
}
