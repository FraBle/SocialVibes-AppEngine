// Package events provides the ability to retrieve Google+ events for a signed-user
// and a trigger to aggregate all event pictures by commmunicating with the Compute Engine.
package events

import (
	"appengine"
	"appengine/urlfetch"
	"appengine/taskqueue"

	"strings"
	"time"

	"code.google.com/p/goauth2/oauth"
	"code.google.com/p/google-api-go-client/calendar/v3"

	"socialvibes/config"
	"socialvibes/model"
)

// ParseEventInfos uses the Google Calendar API to aggregate all event information since a month ago.
// It picks out all Google+ events by looking for the corresponding event link.
// It returns all found events as array and any error encountered. 
func ParseEventInfos(transport *oauth.Transport, context appengine.Context) (events []*model.Event, err error) {
	// Create an API service
	service, err := calendar.New(transport.Client())
	if err != nil {
		context.Errorf("events > event.go > ParseEventInfos > calendar.New(): %v", err)
		return events, err
	}

	// Create an event list call for the primary calendar of the given user
	listCall := service.Events.List("primary")

	// Get all calendar events since a month ago
	t := time.Now().Add(time.Hour * 24 * 31 * (-1))
	listCall.TimeMin(t.Format(time.RFC3339))

	// Execute the event list call
	eventList, err := listCall.Do()
	if err != nil {
		context.Errorf("events > event.go > ParseEventInfos > listCall.Do(): %v", err)
		return events, err
	}

	// Extract all events from the list
	items := eventList.Items

	// Iterate over all found events
	for _, item := range items {
		// Find all Google+ events by filtering htmllink
		if strings.HasPrefix(item.HtmlLink, "https://plus.google.com/events/") {
			// Create a new event object for the found calendar event and fill it with all found information
			event := new(model.Event)
			event.Url = item.HtmlLink
			event.Id = "c" + item.Id
			event.Name = item.Summary
			event.Start = item.Start.DateTime
			event.End = item.End.DateTime
			event.Visibility = item.Visibility
			event.Creator = item.Creator.Self
			event.Location = item.Location

			events = append(events, event)
		}
	}
	return events, nil
}

// RefreshEventGallery creates a task (for the App Engine Task Queue),
// which will be executed by the Compute Engine to (re-)aggregate all event pictures for the given event.
// It returns any error encountered.
func RefreshEventGallery(context appengine.Context, eventId string) (err error) {
	// Create a task for a pull queue
	// Tags are used for grouping tasks inside the Compute Engine
	task := &taskqueue.Task{
	    Payload: []byte(eventId),
	    Method:  "PULL",
	    Tag: eventId, 
	}
	// Insert the created task into the App Engine Task Queue
	_, err = taskqueue.Add(context, task, "picturerequest")
	if err != nil {
		context.Errorf("events > event.go > RefreshEventGallery > taskqueue.Add(): %v", err)
		return
	}

    // Wait 3 seconds till the task is definitely in the task queue 
    time.Sleep(3 * time.Second)

    // Notify the task consumer in the Compute Engine via RPC
    req := `{"method":"EventService.PullTask","params":[{"PullType":"picturerequest", "EventId":"` + eventId + `"}], "id":"1"}`
    
    // Make a secure POST request via App Engine URL Fetch service
    client := urlfetch.Client(context)
    // Increase default deadline to 60 seconds
    client.Transport.(*urlfetch.Transport).Deadline = time.Minute
    context.Infof("events > event.go > RefreshEventGallery > client.Transport.Deadline: %v", client.Transport.(*urlfetch.Transport).Deadline)

    resp, err := client.Post("http://" + *config.ComputeEngineAddress +"/rpc", "application/json", strings.NewReader(req))
    if err != nil || resp.StatusCode != 200 {
        context.Errorf("events > event.go > RefreshEventGallery > client.Post(): %v", err)
        context.Errorf("events > event.go > RefreshEventGallery > client.Post(); StatusCode: %v; Status: %s", resp.StatusCode, resp.Status)
    }

	return nil
}