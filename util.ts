import { Event, Kind } from "npm:nostr-tools@^1.14.0";

const URL_REGX = /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/g

export function unindexable(ev: Event<Kind>) {
  const contentSplitByLine = ev.content.split('\n')
  const contentSplited =
    contentSplitByLine.map((content) => content.split(' '))
  const contentSplitedFlat = contentSplited.flat()

  const resArr = contentSplitedFlat.map((entry) => {
    const res = entry.match(URL_REGX)
    return res !== null
  })
  return resArr.every((e) => e === true)
}

export function buildFakeEvent(content: string) {
  return {
    id: "",
    pubkey: "",
    content,
    kind: 1,
    tags: [],
    created_at: 0,
    sig: ""
  }
}

export function printContents(evs: Event<Kind>[]) {
  evs.forEach((ev) => {
    console.log(ev.content)
  })
}