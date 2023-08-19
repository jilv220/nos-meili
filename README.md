# nos-meili

Search endpoint implementation for nostr using nostr sdk and meilisearch.

## Usage

First, copy and config the .env file

```
mv .env.example .env
```

Then, get the official image from meilisearch

```
docker pull getmeili/meilisearch:v1.3
```

```bash
sudo docker run -it --rm \
    -p 7700:7700 \
    --env-file .env \
    -v <path_to_your_meili_data>:/meili_data \
    getmeili/meilisearch:v1.3 meilisearch
```

Finally, start the program

```
deno task start
```

(There is a memory issue I can't get around with the original go version)
