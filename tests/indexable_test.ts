import { assertEquals } from "std/assert/mod.ts";
import { buildFakeEvent, unindexable } from "../util.ts";

Deno.test("simple-indexable", () => {
  const fake = buildFakeEvent(
    "#abc",
  );
  assertEquals(unindexable(fake), false);
});

Deno.test("simple-unindexable", () => {
  const fake = buildFakeEvent(
    "https://example2.com",
  );
  assertEquals(unindexable(fake), true);
});

Deno.test("multi-line", () => {
  const fake = buildFakeEvent(
    "http://example1.com\nhttps://example2.com\n#abc",
  );
  assertEquals(unindexable(fake), false);
});

Deno.test("multi-space", () => {
  const fake = buildFakeEvent("http://example1.com https://example2.com #abc");
  assertEquals(unindexable(fake), false);
});

Deno.test("hybrid", () => {
  const fake = buildFakeEvent(
    "http://example1.com\n https://example2.com #abc",
  );
  assertEquals(unindexable(fake), false);
});
