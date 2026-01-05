package models

// CategoryStat represents the statistics of a category.
type CategoryStat struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

// TagStat represents the statistics of a tag.
type TagStat struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}
