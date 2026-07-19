/**
 * The comedic register pool. The server draws 3 without replacement per
 * generation — drawing in code (not asking the model to pick) guarantees the
 * three compliments never share a register and repeat generations feel fresh.
 *
 * `fragment` is a few-shot anchor: it teaches the model the register's voice
 * far more reliably than the direction alone.
 */

export type RegisterInfo = {
  id: string;
  name: string;
  emoji: string;
  direction: string;
  fragment: string;
};

export const REGISTERS: readonly RegisterInfo[] = [
  {
    id: "epic_prophecy",
    name: "Ancient Prophecy",
    emoji: "📜",
    direction:
      "An ancient prophecy being fulfilled. Solemn, archaic gravity — scrolls, elders, omens. Played utterly straight.",
    fragment: "The elders spoke of one who would balance the ledgers...",
  },
  {
    id: "sports_commentary",
    name: "Sports Commentary",
    emoji: "🎙️",
    direction:
      "A commentator losing their mind in the final seconds. Present tense, breathless, ALL CAPS permitted once.",
    fragment: "AND THEY'VE DONE IT AGAIN — THE CROWD IS ON ITS FEET —",
  },
  {
    id: "nature_documentary",
    name: "Nature Documentary",
    emoji: "🦅",
    direction:
      "Hushed narrator observing a magnificent creature in its habitat. Reverent, whispered awe.",
    fragment:
      "Here we observe her, in the open-plan savanna, approaching the quarterly report without fear...",
  },
  {
    id: "press_release",
    name: "Corporate Press Release",
    emoji: "📰",
    direction:
      "A press release that has completely lost its composure. Corporate diction cracking under genuine emotion.",
    fragment:
      "FOR IMMEDIATE RELEASE: Sources confirm what analysts long suspected —",
  },
  {
    id: "conspiracy_correct",
    name: "Conspiracy Theorist",
    emoji: "🧵",
    direction:
      "Connecting the dots — every claim is a compliment, the conspiracy is that this person is excellent. Urgent, paranoid, right.",
    fragment:
      "WAKE UP. You think it's a coincidence the team's velocity doubled the week she joined?",
  },
  {
    id: "awards_speech",
    name: "Awards Ceremony",
    emoji: "🏆",
    direction:
      "Tearful presenter, lifetime achievement award. Choked-up, orchestral, dignified excess.",
    fragment:
      "The committee deliberated for eleven minutes. It has never taken less than a year.",
  },
  {
    id: "scientific_abstract",
    name: "Scientific Abstract",
    emoji: "🔬",
    direction:
      "Peer-reviewed abstract reporting field-shattering findings. Dry academic register, absurd conclusions.",
    fragment:
      "Results (n=1) suggest existing models of competence require revision.",
  },
  {
    id: "weather_forecast",
    name: "Weather Forecast",
    emoji: "🌤️",
    direction:
      "Meteorologist tracking this person as a weather system. Isobars, fronts, advisories — all complimentary.",
    fragment:
      "A high-pressure system of pure capability is moving in from the northeast...",
  },
  {
    id: "medieval_herald",
    name: "Royal Herald",
    emoji: "🎺",
    direction:
      "Herald proclaiming their arrival at court. Trumpets, escalating honorifics.",
    fragment:
      "Presenting: Keeper of the Roadmap, Tamer of Scope, Slayer of the Backlog —",
  },
  {
    id: "true_crime",
    name: "True Crime Podcast",
    emoji: "🎧",
    direction:
      "True-crime host investigating how one person can be this good. Ominous intrigue, zero actual crime.",
    fragment:
      "Nobody could explain it. The deadlines were impossible. And yet, every single time...",
  },
];

export function getRegister(id: string): RegisterInfo | undefined {
  return REGISTERS.find((r) => r.id === id);
}

/** Draw `count` registers without replacement (Fisher–Yates on a copy). */
export function drawRegisters(count: number): RegisterInfo[] {
  const pool = [...REGISTERS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
