package lib

import (
	"context"
	"fmt"
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
	client.Index(constants.NOSTR_EVENTS_INDEX).UpdateDocuments(evs)
}