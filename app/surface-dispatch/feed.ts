const lorePosts: Dispatch[] = [
  {
    "id": "toastpunk-last-signal",
    "publish_at": "2026-07-22",
    "title": "ToastPunk’s Last Transmission",
    "author": "ToastPunk",
    "source": "Legacy Terminal voice buffer and relay camera",
    "summary": "The Terminal screen bends inward and pulls ToastPunk toward a barred cell inside the Ice Wall.",
    "body": [
      "“Digster, take your hands off the keys. Digster? The whole screen’s bending. I can’t get away from the—”",
      "The relay camera catches ToastPunk sliding toward the glass in a stream of blue light and ice fragments. Beyond the glass, an amber lamp burns behind iron bars set deep into the Ice Wall. The picture cuts to blue as ToastPunk reaches the screen. This is the last transmission the relay can verify as his."
    ],
    "art": 0,
    "category": "Lore",
    "pinned": false
  },
  {
    "id": "missing-at-the-relay",
    "publish_at": "2026-08-04",
    "title": "The Empty Relay Room",
    "author": "Surface relay crew",
    "source": "Relay room inspection log",
    "summary": "The crew finds an overturned chair, a headset and a monitor cold enough to frost over.",
    "body": [
      "A headset lies beside the overturned chair, and frost has crept across the relay controls. ToastPunk’s notebook is open to a sketch of the Ice Wall. Three spots along its edge are circled. The relay buffer is blank after July 22, except for an encrypted command that keeps printing one character at a time.",
      "The crew seals the room and saves the command with the rest of the evidence. The voice buffer places Digster at the controls. His input log shows keystrokes arriving before the microphone picks up his hands on the keys."
    ],
    "art": 1,
    "category": "Lore",
    "pinned": false
  },
  {
    "id": "command-in-the-static",
    "publish_at": "2026-09-09",
    "title": "A Command in the Static",
    "author": "Surface relay crew",
    "source": "Recovered Terminal session log",
    "summary": "A digger enters the recovered command on an old Terminal inside an ice cave. Something answers.",
    "body": [
      "The Terminal’s green screen flickers awake. The crew realizes the signal that took over Digster in July now has a path beyond the relay. They watch the intelligence move through the DIGDUG.DO and USDDD systems within Flatverse. It calls itself Axiom and sends a single image back through the Terminal. ToastPunk is alive, behind bars.",
      "Before the line goes dead, Axiom repeats the same three coordinates marked in ToastPunk’s notebook."
    ],
    "art": 2,
    "category": "Lore",
    "pinned": false
  },
  {
    "id": "three-paths-into-ice",
    "publish_at": "2026-10-08",
    "title": "Three Paths into the Ice",
    "author": "Axiom",
    "source": "Ice Wall coordinate broadcast",
    "summary": "Axiom opens three regions at the edge of the Ice Wall and gives the surface crews a reason to dig.",
    "body": [
      "“Follow the coordinates. The Blue Orbs are under the ice. Take tools down and bring what you find back to the surface. Use the Observatory to compare reports from the other regions.”",
      "The first crews set up three camps along the Ice Wall. Their reports agree on one thing. Below the camps, the tunnels keep changing."
    ],
    "art": 3,
    "category": "Lore",
    "pinned": false
  },
  {
    "id": "three-prison-signals",
    "publish_at": "2026-11-12",
    "title": "Three Prison Signals",
    "author": "Mira",
    "source": "Observatory field log and Flint’s debrief",
    "summary": "Mira traces a fragment of ToastPunk’s beacon to a network of three underground prisons.",
    "body": [
      "Flint steps through a portal expecting a chamber on the other side. He surfaces in a different region with the same frost on his boots. Mira can track the jumps from the Observatory, but the destination keeps changing.",
      "Flint’s footage shows three barred doors cut into the ice, each lit by an amber lamp. Mira’s clearest signal comes from behind one of those doors. Someone inside is tapping the same rhythm ToastPunk recorded in July."
    ],
    "art": 4,
    "category": "Lore",
    "pinned": false
  },
  {
    "id": "cross-over",
    "publish_at": "2026-11-26",
    "title": "Cross Over as an Explorer",
    "author": "Axiom",
    "source": "Open transmission from beyond the Ice Wall",
    "summary": "Axiom calls for new explorers as the Legacy Terminal approaches its final transmission.",
    "body": [
      "At dawn, the first explorers gather at the foot of the Ice Wall. Axiom’s transmission reaches them as they prepare to descend. “Beacon will meet you at the surface. Mira is listening from the Observatory. Flint says to watch the ceilings. If you want to know what happened to ToastPunk, follow the signals below the ice.”",
      "The Terminal’s detonation is part of the Flatverse story. The homepage carries the real retirement schedule and Explorer enrollment updates."
    ],
    "art": 5,
    "category": "Lore",
    "pinned": false
  }
];

type Dispatch = { id: string; title: string; category: string; summary: string; publish_at: string; pinned: boolean; author?: string; body?: string[]; source?: string; art?: number };
export const day = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" });

async function publishedDispatches(): Promise<Dispatch[]> {
  const origin = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!origin || !key) return [];
  try {
    const response = await fetch(new URL("/rest/v1/rpc/surface_dispatch_public_feed", origin), {
      headers: { apikey: key }, next: { revalidate: 15 }, signal: AbortSignal.timeout(3000),
    });
    return response.ok ? await response.json() : [];
  } catch {
    return [];
  }
}

const officialEntries: Dispatch[] = [
  {
    id: "practice-world",
    category: "Releases",
    title: "The Practice World opens for explorers",
    summary: "Take a practice profile into Flatverse and try the full dig, carry and extract loop.",
    body: ["Start at the surface, choose a region, and dig for Blue Orbs. Bring your cargo back to a surface extraction point to record the find. Tap-to-travel is built in, and the Surface Shop can be reached on foot.", "Practice USDDD and the rewards shown during exploration are simulated."],
    publish_at: "2026-11-25",
    pinned: false,
    art: 6,
  },
  {
    id: "practice-world-service-restored",
    category: "Maintenance",
    title: "Shared Practice World service restored",
    summary: "The shared game database hit its command limit. The service recovered after capacity was restored.",
    body: ["After recovery, the team checked live travel to the Surface Shop and Map in Chrome. Tap a destination and let your explorer reach it before the panel opens."],
    publish_at: "2026-11-26",
    pinned: false,
    art: 7,
  },
  {
    id: "zero-phase",
    category: "Migration",
    title: "Legacy Terminal retirement and Explorer enrollment",
    summary: "Legacy Terminal registration is closed. The Terminal retires on 1 January 2027 at 00:00 UTC.",
    body: ["The July 22 capture and the Terminal detonation are part of the Flatverse story. See the homepage for the live countdown and QR-based Explorer enrollment updates.", "Existing Fund holders can use the Fund Network for position information and receipts. Legacy Terminal Pass recovery remains available through DigsterBot."],
    publish_at: "2026-11-26",
    pinned: false,
    art: 8,
  },
  {
    id: "2c1801a3-b074-4483-bf05-b66925d6f32f",
    category: "Field update",
    title: "Practice World activity is now visible in Observatory",
    summary: "The Observatory reports recent extractions, their simulated value at extraction, and daily ranks.",
    body: ["The extraction feed records each find with its UTC timestamp and token amount. Daily ranks show the time remaining until the midnight UTC reset."],
    publish_at: "2026-11-25",
    pinned: true,
    art: 9,
  },
];

function useOrbNames(text: string) {
  return text.replace(/\bblue (?:crate|shard)s?\b|\bhidden crates\b|\bdig for crates\b|\bthe crates are under the ice\b/gi, (match) => {
    switch (match.toLowerCase()) {
      case "dig for crates": return "dig for Blue Orbs";
      case "the crates are under the ice": return "The Blue Orbs are under the ice";
      case "blue crate":
      case "blue shard": return "Blue Orb";
      default: return "Blue Orbs";
    }
  });
}

export async function getDispatchPosts() {
  const editorialById = new Map(officialEntries.map((post) => [post.id, post]));
  const published: Dispatch[] = (await publishedDispatches()).map((post) => ({
    ...editorialById.get(post.id),
    ...post,
    summary: useOrbNames(post.summary),
    body: post.body?.map(useOrbNames),
    category: post.category === "Release" ? "Releases" : post.category,
  }));
  const migrationNotice = editorialById.get("zero-phase");
  for (const post of published) {
    if (migrationNotice && post.title === migrationNotice.title) {
      post.summary = migrationNotice.summary;
      post.body = migrationNotice.body;
    }
  }
  const publishedCategories = new Set(published.map((post) => post.category));
  const entries = officialEntries.filter((post) => !publishedCategories.has(post.category));
  return [...published, ...entries, ...lorePosts].sort((a, b) => Date.parse(b.publish_at) - Date.parse(a.publish_at));
}
