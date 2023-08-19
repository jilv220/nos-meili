import { getQuery } from "https://deno.land/x/oak@v12.6.0/helpers.ts";
import { Application, Router } from "https://deno.land/x/oak@v12.6.0/mod.ts";
import { searchSchema } from "./schemas/nostr.ts";
import { load } from "std/dotenv/mod.ts";
import { MeiliSearch } from "https://esm.sh/meilisearch@0.34.1";

// indexing worker
new Worker(new URL("./indexing.ts", import.meta.url).href, { type: "module" });

const NOSTR_EVENTS_INDEX = "nostr-events";

const env = await load();
const MEILI_HOST_URL = env["MEILI_HOST_URL"];
const MEILI_ADMIN_API_KEY = env["MEILI_ADMIN_API_KEY"];

const client = new MeiliSearch({
  host: MEILI_HOST_URL,
  apiKey: MEILI_ADMIN_API_KEY,
});

const router = new Router();
router
  .get("/", (ctx) => {
    ctx.response.body = "Hello world!";
  })
  .get("/search", async (ctx) => {
    const query = getQuery(ctx, { mergeParams: true });

    let parsedQuery;
    try {
      parsedQuery = searchSchema.parse(query)
    } catch (err) {
      console.error(err)
    }
    const res = await client.index(NOSTR_EVENTS_INDEX).search(parsedQuery?.query, {
      filter: `kind=${parsedQuery?.kind}`,
      offset: parsedQuery?.offset,
      limit: parsedQuery?.limit
    })
    ctx.response.body = {
      data: res.hits
    };
  })

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });