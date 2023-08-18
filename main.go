package main

import (
	"context"
	"encoding/json"
	"io"
	"os"

	"github.com/jilv220/nos-meili/constants"
	"github.com/jilv220/nos-meili/lib"
	"github.com/joho/godotenv"
	"github.com/meilisearch/meilisearch-go"
)

func main() {
	// load dotenv
	err := godotenv.Load()
	if err != nil {
		panic(err)
	}
	MEILI_HOST_URL := os.Getenv("MEILI_HOST_URL")
	MEILI_ADMIN_API_KEY := os.Getenv("MEILI_ADMIN_API_KEY")

	// init client
  client := meilisearch.NewClient(meilisearch.ClientConfig{
    Host: MEILI_HOST_URL,
		APIKey: MEILI_ADMIN_API_KEY,
  })

	// load stopwords
	stopWordsFile, _ := os.Open("stopwords-all.json")
  defer stopWordsFile.Close()

  byteValue, _ := io.ReadAll(stopWordsFile)
  var stopWordsMap map[string][]string
  json.Unmarshal(byteValue, &stopWordsMap)

	stopWords := []string{}
	for _, value := range stopWordsMap {
		stopWords = append(stopWords, value...)
	}

	// create index for nostr events
	res, err := client.GetIndexes(&meilisearch.IndexesQuery{
		Limit: 1,
	})
	if err != nil {
		panic(nil)
	}
	
	if len(res.Results) == 0 {
		client.CreateIndex(&meilisearch.IndexConfig {
			Uid: constants.NOSTR_EVENTS_INDEX,
			PrimaryKey: "id",
		})
	}
	
	// init settings
	settings := meilisearch.Settings {
		SearchableAttributes: []string {
			"content",
		},
		DisplayedAttributes: []string {
			"content",
			"created_at",
			"id",
			"kind",
			"pubkey",
			"sig",
			"tags",
		},
		FilterableAttributes: []string {
			"kind",
		},
		SortableAttributes: []string {
			"created_at",
		},
		StopWords: stopWords,
		//Synonyms: {},
		TypoTolerance: &meilisearch.TypoTolerance {
			MinWordSizeForTypos: meilisearch.MinWordSizeForTypos {
				OneTypo: 4,
				TwoTypos: 10,
			},
		},
		Pagination: &meilisearch.Pagination {
			MaxTotalHits: 1000,
		},
	}
	client.Index(constants.NOSTR_EVENTS_INDEX).UpdateSettings(&settings)

	ctx := context.Background()
	for {
		lib.IndexNewEvents(ctx, client)
	}
}

