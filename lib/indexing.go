package lib

import (
	"context"
	"fmt"
	"runtime"
	"sync"
	"time"

	"github.com/jilv220/nos-meili/constants"
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

func IndexNewEvents(ctx context.Context, client *meilisearch.Client) {
	filters := []nostr.Filter {{
		Kinds: []int{1},
		Limit: 200,
	}}

	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	pool := nostr.NewSimplePool(ctx)
	evChan := pool.SubManyEose(ctx, nostrRelays, filters)

	fmt.Println("=== start indexing new events... ===")

	evs := make([]nostr.Event, 0)
	for ev := range evChan {
		evs = append(evs, *ev)
	}
	fmt.Printf("Total events retrieved: %v\n", len(evs))

	batchSize := len(evs) / (runtime.NumCPU() * 4)
	fmt.Printf("Batch size: %v\n", batchSize)

	batches := make([][]nostr.Event, 0, (len(evs) + batchSize - 1) / batchSize)
	for batchSize < len(evs) {
    evs, batches = evs[batchSize:], append(batches, evs[0:batchSize:batchSize])
	}
	batches = append(batches, evs)
	fmt.Printf("Total chunks divided: %v\n", len(batches))

	var wg sync.WaitGroup
	for i, batch := range batches {
  	wg.Add(1)
  	go func(batch []nostr.Event, id int) {
    	defer wg.Done()
    	for _, ev := range batch {
				client.Index(constants.NOSTR_EVENTS_INDEX).UpdateDocuments(ev)
			}
			fmt.Printf("Worker %v done\n", id)
  	}(batch, i)
	}
	wg.Wait()
}

func IndexPastEvents(ctx context.Context, client *meilisearch.Client) {
	var sec nostr.Timestamp
	now := time.Now()
	sec = nostr.Timestamp(now.Unix())
	filters := []nostr.Filter {{
		Kinds: []int{1},
		Until: &sec,
	}}

	for {
		ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
		defer cancel()

		pool := nostr.NewSimplePool(ctx)
		evChan := pool.SubManyEose(ctx, nostrRelays, filters)

		fmt.Println("=== start indexing past events ... ===")
		for ev := range evChan {
			fmt.Printf("indexing event with id: %s\n", ev.ID)
			client.Index(constants.NOSTR_EVENTS_INDEX).UpdateDocuments(ev)
		}
		time.Sleep(2 * time.Second)
	}
}