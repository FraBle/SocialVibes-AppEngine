package model

// The Event type represents a Google+ event and is the used data object between frontend and backend.
type Event struct {
	Id           string `json:"id,omitempty"`
	Name         string `json:"name,omitempty"`
	Url          string `json:"url,omitempty"`
	Start		 string `json:"start,omitempty"`
	End			 string `json:"end,omitempty"`
	Creator		 bool	`json:"creator,omitempty"`
	Visibility	 string `json:"visibility,omitempty"`
	Location	 string `json:"location,omitempty"` 
}
