package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"time"

	"github.com/joho/godotenv"
	"github.com/meilisearch/meilisearch-go"
	"github.com/nbd-wtf/go-nostr"
)

var nostrRelays = []string {
	"wss://nos.lol",
	"wss://nostr.mom",
	"wss://nostr.wine",
	"wss://relay.nostr.com.au",
	"wss://relay.shitforce.one/",
	"wss://nostr.inosta.cc",
	"wss://relay.primal.net",
	"wss://relay.damus.io",
	"wss://relay.nostr.band",
	"wss://eden.nostr.land",
	"wss://nostr.milou.lol",
	"wss://relay.mostr.pub",
	"wss://nostr-pub.wellorder.net",
	"wss://atlas.nostr.land",
	"wss://relay.snort.social",
}

const NOSTR_EVENTS_INDEX = "nostr-events"

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
			Uid: NOSTR_EVENTS_INDEX,
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
	client.Index(NOSTR_EVENTS_INDEX).UpdateSettings(&settings)

	ctx := context.Background()
	filters := []nostr.Filter {{
		Kinds: []int{1},
	}}

	for {
		ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
		defer cancel()

		pool := nostr.NewSimplePool(ctx)
		evChan := pool.SubManyEose(ctx, nostrRelays, filters)

		fmt.Println("=== start indexing... ===")
		for ev := range evChan {
			fmt.Printf("indexing event with id: %s\n", ev.ID)
			client.Index(NOSTR_EVENTS_INDEX).UpdateDocuments(ev)
		}
		time.Sleep(2 * time.Second)
	}
}

