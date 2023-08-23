import { Event, Kind } from "npm:nostr-tools@^1.14.0";

const URL_REGX =
  /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/g;

const NOSTR_URI_REGX = /^nostr:.+/g;

const EXCLUDE_WORDS = [
  "airdrop",
  "bot",
  "giveaway",
  "block height",
  "block: ",
  "lottery",
  "腾讯内部产品",
  "腾讯去中心化",
  "腾讯游戏部",
  "大中华区第9群",
  "腾讯产品分享会",
  "为您提供安全可靠的软件开发",
];

export function unindexable(ev: Event<Kind>) {
  const contentSplitByLine = ev.content.split("\n");
  const contentSplited = contentSplitByLine.map((content) =>
    content.split(" ")
  );
  const contentSplitedFlat = contentSplited.flat();

  const resArr = contentSplitedFlat.map((entry) => {
    const res = entry.match(URL_REGX);
    return res !== null;
  });
  return resArr.every((e) => e === true);
}

export function isSpam(ev: Event<Kind>) {
  const lowerContent = ev.content.toLowerCase();
  return EXCLUDE_WORDS.some((sub) => lowerContent.includes(sub));
}

export function removeURL(ev: Event<Kind>): Event<Kind> {
  const contentSplitByLine = ev.content.split("\n");
  const contentSplited = contentSplitByLine.map((content) =>
    content.split(" ")
  );
  for (let i = 0; i < contentSplited.length; i++) {
    for (let j = 0; j < contentSplited[i].length; j++) {
      if (
        contentSplited[i][j].match(URL_REGX) ||
        contentSplited[i][j].match(NOSTR_URI_REGX)
      ) {
        contentSplited[i][j] = "";
      }
    }
  }
  const contentMergedBySpace = contentSplited.map((contentByLine) =>
    concatStringArr(contentByLine, " ")
  );
  const contentMerged = concatStringArr(contentMergedBySpace, "\n");
  ev.content = contentMerged;
  return ev;
}

export function removeDup(evs: Event<Kind>[]): Event<Kind>[] {
  const map = new Map<string, Event<Kind>>();
  for (const ev of evs) {
    map.set(ev.content, ev);
  }
  const iteratorValues = map.values();
  return [...iteratorValues];
}

export function concatStringArr(strArr: string[], delimiter: string): string {
  let res = "";
  for (let i = 0; i < strArr.length; i++) {
    if (i !== strArr.length - 1) {
      res = res.concat(strArr[i], delimiter);
    } else {
      res = res.concat(strArr[i]);
    }
  }
  return res;
}

export function buildFakeEvent(content: string) {
  return {
    id: "",
    pubkey: "",
    content,
    kind: 1,
    tags: [],
    created_at: 0,
    sig: "",
  };
}

export function printContents(evs: Event<Kind>[]) {
  evs.forEach((ev) => {
    console.log(ev.content);
  });
}
