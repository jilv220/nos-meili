import { assertEquals } from "std/assert/mod.ts";
import { buildFakeEvent, isSpam } from "../util.ts";

Deno.test("simple-indexable", () => {
  const fake = buildFakeEvent(
    "#abc",
  );
  assertEquals(isSpam(fake), false);
});

Deno.test("simple-indexable", () => {
  const fake = buildFakeEvent(
    "Airdrop",
  );
  assertEquals(isSpam(fake), true);
});

Deno.test("simple-indexable", () => {
  const fake = buildFakeEvent(
    "Bot",
  );
  assertEquals(isSpam(fake), true);
});
