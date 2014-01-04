// Package rpc includes the RPC service method for pulling tasks from the Google App Engine Task Queue.
// It's used to communicate from the Compute Engine to the App Engine.
// It's based on github.com/gorilla/rpc
package rpc

import (
	"appengine"
	"appengine/channel"
	"appengine/taskqueue"

	"net/http"
	"time"

	"socialvibes/db"
)

// EventArgs represents the parameter of the PullTask RPC service method.
type EventArgs struct {
	EventId  string
	PullType string
}

// EventReply represents the reply message of the PullTask RPC service method.
type EventReply struct {
	Message string
}

// EventService represents the RPC service.
type EventService struct{}

// PullTask is the only service method of EventService.
// It prechecks the RPC parameter, calls PullTasks() and sets the reply message.
// It returns any error encountered. 
func (eventService *EventService) PullTask(r *http.Request, args *EventArgs, reply *EventReply) error {
	// Pre-check the given pull type
	if args.PullType == "picture" {
		PullTasks(r, args.PullType, args.EventId)
	}
	reply.Message = "Ok"
	return nil
}

// PullTasks leases one task (which includes event picture URLs) from the Google App Engine Task Queue,
// retrieves all associated clients to the given event
// and send the event picture URLs as JSON via Channels to the clients.
func PullTasks(r *http.Request, pullType, eventId string) {
	context := appengine.NewContext(r)
	
	// Lease-Loop for event pull task
	found := false
	var tasks []*taskqueue.Task
	var err error
	for !found {
		// Lease ONE task for the given pull type and event id
		tasks, err = taskqueue.Lease(context, 1, pullType, 3600)
		if err != nil {
			context.Errorf("rpc > rpc.go > PullTasks > taskqueue.Lease(): %v", err)
			time.Sleep(1 * time.Second)
			continue
		}
		if len(tasks) > 0 {
			found = true
		}
	}
	// Repeat until we find the task, there MUST be one
	
	// Get all clients for given event id
	clients, err := db.GetChannelClients(context, eventId)
	if err != nil {
		context.Errorf("rpc > rpc.go > PullTasks > db.GetChannelClients(): %v", err)
		return
	}

	// We can now be sure, that there is only one task, because we found it and our maximum is 1
	task := tasks[0]

	// Send the payload to all clients which have channels for this event
	for _, client := range clients {
		err := channel.Send(context, client, string(task.Payload))
		if err != nil {
			context.Errorf("rpc > rpc.go > PullTasks > channel.Send(): %v", err)
			return
		}
	}
	
	// Delete the task!
	err = taskqueue.Delete(context, task, pullType)
	if err != nil {
		context.Errorf("rpc > rpc.go > PullTasks > taskqueue.Delete(): %v", err)
		return
	}
}