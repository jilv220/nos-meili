import { MeiliSearch } from "https://esm.sh/meilisearch@0.34.1";
import {
  type Event,
  type Filter,
  Kind,
  SimplePool,
} from "npm:nostr-tools@^1.14.0";

import stopwords from "./stopwords-all.json" assert { type: "json" };
import { load } from "std/dotenv/mod.ts";
import { printContents, unindexable } from "./util.ts";

console.log("indexing worker started");

const NOSTR_EVENTS_INDEX = "nostr-events";

const env = await load();
const MEILI_HOST_URL = env["MEILI_HOST_URL"];
const MEILI_ADMIN_API_KEY = env["MEILI_ADMIN_API_KEY"];

const client = new MeiliSearch({
  host: MEILI_HOST_URL,
  apiKey: MEILI_ADMIN_API_KEY,
});

let stopwordsArr: string[] = [];
for (const [_, value] of Object.entries(stopwords)) {
  stopwordsArr = [...stopwordsArr, ...value];
}

const indexes = await client.getIndexes({ limit: 3 });

if (indexes.results.length == 0) {
  client.createIndex(NOSTR_EVENTS_INDEX, { primaryKey: "id" });
}

client.index(NOSTR_EVENTS_INDEX).updateSettings({
  searchableAttributes: [
    "content",
  ],
  displayedAttributes: [
    "content",
    "created_at",
    "id",
    "kind",
    "pubkey",
    "sig",
    "tags",
  ],
  filterableAttributes: [
    "kind",
  ],
  sortableAttributes: [
    "created_at",
  ],
  stopWords: stopwordsArr,
  typoTolerance: {
    minWordSizeForTypos: {
      oneTypo: 5,
      twoTypos: 10,
    },
  },
});

const nostrRelays = [
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
];

const filter: Filter = {
  // seems the onlyone making sense is kind 0 and 1?
  kinds: [0, 1],
  // memory usage keeps going larger if a limit is not set, but why??
  limit: 200,
};

while (true) {
  const pool = new SimplePool();
  const evs = await pool.list(nostrRelays, [filter]);
  const indexables = evs.filter((ev) => !unindexable(ev));
  client.index(NOSTR_EVENTS_INDEX).addDocuments(indexables);
  pool.close(nostrRelays);
}
