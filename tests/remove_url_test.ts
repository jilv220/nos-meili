import { assertEquals } from "std/assert/assert_equals.ts";
import { buildFakeEvent, removeURL } from "../util.ts";

Deno.test("no-url", () => {
  const fake = buildFakeEvent(
    "#abc",
  );
  assertEquals(removeURL(fake).content, fake.content);
});

Deno.test("has-newline-url", () => {
  const fake = buildFakeEvent(
    "#abc\nhttps://example.com",
  );
  assertEquals(removeURL(fake).content, "#abc\n");
});

Deno.test("has-space-url", () => {
  const fake = buildFakeEvent(
    "#abc https://example.com",
  );
  assertEquals(removeURL(fake).content, "#abc ");
});

Deno.test("has-nostr", () => {
  const fake = buildFakeEvent(
    "#abc nostr:nevent",
  );
  assertEquals(removeURL(fake).content, "#abc ");
});

Deno.test("has-url-space-url", () => {
  const fake = buildFakeEvent(
    "#abc\nhttps://example.com #def",
  );
  assertEquals(removeURL(fake).content, "#abc\n #def");
});
