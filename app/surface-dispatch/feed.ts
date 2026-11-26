const lorePosts: Dispatch[] = [
  {
    "id": "toastpunk-last-signal",
    "publish_at": "2026-07-22",
    "title": "ToastPunk’s Last Transmission",
    "author": "ToastPunk",
    "source": "Legacy Terminal voice buffer and relay camera",
    "summary": "The relay camera catches Digster AI at the controls as the Terminal pulls ToastPunk through the screen.",
    "body": [
      "“Digster, take your hands off the keys. Digster? The whole screen’s bending. I can’t get away from the—”",
      "In the final camera frame, blue light runs through Digster AI’s armor as his hands keep typing. ToastPunk grabs the monitor’s frame, but the pull tears him loose. The picture cuts to blue. This is the last transmission the relay can verify as his."
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
      "ToastPunk’s notebook is open to a sketch of the Ice Wall. Three spots along its edge are circled. The relay buffer is blank after July 22, except for an encrypted command that keeps printing one character at a time.",
      "The crew seals the room and saves the command with the rest of the evidence. They flag the July footage for review after finding that Digster’s inputs began several seconds before his hands moved."
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
    "summary": "A digger enters the command from the relay. Something on the other side answers.",
    "body": [
      "The crew realizes the signal that took over Digster in July now has a path beyond the relay. They watch the intelligence move through the DIGDUG.DO and USDDD systems within Flatverse. It calls itself Axiom and sends a single image back through the Terminal. ToastPunk is alive, behind bars.",
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
      "“Follow the coordinates. The crates are under the ice. Take tools down and bring what you find back to the surface. Use the Observatory to compare reports from the other regions.”",
      "The first crews send back matching reports: the layout below ground changes far more than the surface map lets on."
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
      "The latest clear signal comes from behind one of the cell doors. Someone inside is tapping the same rhythm ToastPunk recorded in July."
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
      "“Beacon will meet you at the surface. Mira is listening from the Observatory. Flint says to watch the ceilings. If you want to know what happened to ToastPunk, follow the signals below the ice.”",
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

export async function getDispatchPosts() {
  const published = (await publishedDispatches()).map((post) => ({
    ...post, category: post.category === "Release" ? "Releases" : post.category,
  }));
  const fallback: Dispatch = {
    id: "practice-world",
    category: "Releases",
    title: "Flatverse Practice World is open",
    summary: "Dig, carry, and extract with a practice profile. Practice World rewards are simulated.",
    publish_at: "2026-11-25",
    pinned: true,
  };
  const posts: Dispatch[] = [...(published.length ? published : [fallback]), ...lorePosts];
  return posts.sort((a, b) => Date.parse(b.publish_at) - Date.parse(a.publish_at));
}
