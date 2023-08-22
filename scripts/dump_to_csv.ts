import { stringify } from "https://deno.land/std@0.194.0/csv/mod.ts";
import { parse } from "https://deno.land/std@0.194.0/flags/mod.ts";
import {
  type Event,
  type Filter,
  Kind,
  SimplePool,
} from "npm:nostr-tools@^1.14.0";
import { isSpam, removeURL, unindexable } from "../util.ts";

const EVS_LENGTH_CAP = "5000";

const flags = parse(Deno.args, {
  string: ["count"],
  default: { count: EVS_LENGTH_CAP },
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
  kinds: [1],
  // memory usage keeps going larger if a limit is not set, but why??
  limit: 200,
};

let evs: Event<Kind>[] = [];

while (evs.length < Number(flags.count)) {
  const pool = new SimplePool();
  evs = [...evs, ...await pool.list(nostrRelays, [filter])];
  pool.close(nostrRelays);
}

// Need to filter spam&unindexable...
const indexables = evs
  .filter((ev) => !unindexable(ev))
  .filter((ev) => !isSpam(ev))
  .map((ev) => removeURL(ev));

const csv = stringify(indexables, {
  columns: [
    "content",
  ],
});

try {
  await Deno.mkdir("./nostr_data");
} catch {
  console.log("data dir already existed, skip creating...");
}
await Deno.writeTextFile("./nostr_data/dump.csv", csv);
