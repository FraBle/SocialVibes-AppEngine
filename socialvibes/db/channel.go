// Package db provides functions to insert, access and delete Channel clients in the App Engine Datastore.
package db

import (
	"appengine"
	"appengine/datastore"
)

// Event is the type used to store event Channel clients in the App Engine Datastore.
type Event struct {
	EventId string
	Clients []string
}

// InsertChannelClient inserts a Channel client associated with an event into the App Engine Datastore.
// It returns any error encountered.
func InsertChannelClient(context appengine.Context, eventId, userId string) error {
	// Create key for given event
	key := datastore.NewKey(context, "Channels", eventId, 0, nil)
	return datastore.RunInTransaction(context, func(context appengine.Context) error {
		event := new(Event)
		// Get the datastore entity for the given key
		err := datastore.Get(context, key, event)
		if err != nil && err != datastore.ErrNoSuchEntity {
			context.Errorf("db > channel.go > InsertChannelClient > datastore.Get(): %v", err)
			return err
		}
		// If there is no entity in the datastore for the given event, we have to insert the event id too
		if err == datastore.ErrNoSuchEntity {
			event.EventId = eventId
		}
		// Append new client to the event
		event.Clients = append(event.Clients, userId+"-"+eventId)
		// Put it into the datastore
		_, err = datastore.Put(context, key, event)
		if err != nil {
			context.Errorf("db > channel.go > InsertChannelClient > datastore.Put(): %v", err)
		}
		return err
	}, nil)
}

// RemoveChannelClient removes a Channel client associated with an event from the App Engine Datastore.
// It returns any error encountered.
func RemoveChannelClient(context appengine.Context, eventId, userId string) error {
	clientId := userId + "-" + eventId
	// Create key for given event
	key := datastore.NewKey(context, "Channels", eventId, 0, nil)
	return datastore.RunInTransaction(context, func(context appengine.Context) error {
		event := new(Event)
		// Get the datastore entity for the given key
		err := datastore.Get(context, key, event)
		if err != nil {
			context.Errorf("db > channel.go > RemoveChannelClient > datastore.Get(): %v", err)
			return err
		}
		// Range over all clients, remove all clients, which have the given client id
		i := 0 // Write index
		for _, client := range event.Clients {
			if client == clientId {
				continue
			}
			event.Clients[i] = client
			i++
		}
		event.Clients = event.Clients[:i]
		// Put it into the datastore
		_, err = datastore.Put(context, key, event)
		if err != nil {
			context.Errorf("db > channel.go > RemoveChannelClient > datastore.Put(): %v", err)
		}
		return err
	}, nil)
}

// GetChannelClients returns all Channel clients for a given event from the App Engine Datastore 
// and any error encountered.
func GetChannelClients(context appengine.Context, eventId string) (clients []string, err error) {
	// Create key for given event
	key := datastore.NewKey(context, "Channels", eventId, 0, nil)
	var event Event
	// Retrieve event with all its clients from the datastore
	err = datastore.Get(context, key, &event)
	if err != nil {
		context.Errorf("db > channel.go > GetChannelClients > datastore.Get(): %v", err)
		return
	}
	clients = event.Clients
	return
}
