import { stringify } from "https://deno.land/std@0.194.0/csv/mod.ts";
import { parse } from "https://deno.land/std@0.194.0/flags/mod.ts";
import {
  type Event,
  type Filter,
  Kind,
  SimplePool,
} from "npm:nostr-tools@^1.14.0";
import { isSpam, removeDup, removeURL, unindexable } from "../util.ts";

const ONE_HOUR = 60 * 60 * 1000;

const flags = parse(Deno.args, {
  string: ["hour"],
  default: { hour: "24" },
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
  "wss://nostr.klabo.blog",
  "wss://nostrue.com",
  "wss://nostr.vulpem.com",
];

const sinceTime = Math.floor(
  (Date.now() - Number(flags.hour) * ONE_HOUR) / 1000,
);

const filter: Filter = {
  kinds: [1],
  since: sinceTime,
  limit: 1000,
};

let evs: Event<Kind>[] = [];

let evsLengthRecord = 0;
let diff = 9999;
let zeroCount = 0;

// Best effort, impossible to trace back
while (zeroCount <= 10) {
  evsLengthRecord = evs.length;
  const pool = new SimplePool();
  evs = [...evs, ...await pool.list(nostrRelays, [filter])];
  evs = removeDup(evs);

  diff = evs.length - evsLengthRecord;
  console.log(`New events retrieved: ${diff}`);

  if (diff === 0) {
    zeroCount++;
  }
  pool.close(nostrRelays);
}

// Need to filter spam & unindexable...
const indexables = evs
  .filter((ev) => !unindexable(ev))
  .filter((ev) => !isSpam(ev))
  .map((ev) => removeURL(ev))
  // remove short content because of low c-tf-idf
  .filter((ev) => ev.content.length > 2);

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

const timestamp = Date.now();
await Deno.writeTextFile(`./nostr_data/dump_${timestamp}.csv`, csv);
