const launchPosts = [
  { id: "practice-world", category: "Releases", title: "Flatverse Practice World is open", summary: "Enter the mine, bank a find, and explore with a practice profile." },
  { id: "v0-2-19", category: "Releases", title: "Flatverse v0.2.19 release notes", summary: "You can restore a practice profile on another device using its private profile code. Keep the code private." },
  { id: "zero-phase", category: "Migration", title: "Moving from the Zero Phase Terminal", summary: "Play Flatverse with a fresh practice profile. Existing Fund positions remain accessible using your Legacy Terminal session." },
] as const;

const lorePosts = [
  {
    "id": "toastpunk-last-signal",
    "publish_at": "2026-07-22",
    "title": "ToastPunk’s last transmission",
    "author": "ToastPunk",
    "summary": "The Terminal picked up a pulse from the far side of the Ice Wall.",
    "body": "I’ve spent all night chasing that pulse. It repeats every time the Terminal goes quiet. If the next shift sees the same pattern, log it and leave it alone. I’m heading back to the relay. I’ll report what I find.",
    "art": 0,
    "category": "Lore",
    "pinned": false
  },
  {
    "id": "missing-at-the-relay",
    "publish_at": "2026-08-04",
    "title": "The empty relay room",
    "author": "Surface relay",
    "summary": "ToastPunk missed his check-in. His headset was still plugged in.",
    "body": "The crew found his chair overturned and his notebook open to a sketch of three marks on the Ice Wall. The door was locked from the inside. Nobody has heard from him since July 22.",
    "art": 1,
    "category": "Lore",
    "pinned": false
  },
  {
    "id": "command-in-the-static",
    "publish_at": "2026-09-09",
    "title": "A command in the static",
    "author": "Surface relay",
    "summary": "A digger entered an encrypted command recovered from the relay.",
    "body": "The Legacy Terminal answered in a voice we had never heard. It moved through the DIGDUG.DO and USDDD systems inside Flatverse. Before the line cut, it told us ToastPunk was alive. It called him a prisoner.",
    "art": 2,
    "category": "Lore",
    "pinned": false
  },
  {
    "id": "three-paths-into-ice",
    "publish_at": "2026-10-08",
    "title": "Three paths into the ice",
    "author": "Axiom",
    "summary": "Axiom broadcast coordinates for three regions along the Ice Wall.",
    "body": "Bring your tools. The surface markings show where to start. The crates are buried deeper, and the route out may look different by the time you’re carrying one. Check the Observatory to see what the other regions are reporting.",
    "art": 3,
    "category": "Lore",
    "pinned": false
  },
  {
    "id": "three-prison-signals",
    "publish_at": "2026-11-12",
    "title": "Three prison signals",
    "author": "Mira",
    "summary": "The Observatory detected three underground signatures that move between regions.",
    "body": "A fragment of ToastPunk’s relay beacon appeared near one of them. Flint went below to trace it and came back by a different route. There are passages down there that never show up on a surface map.",
    "art": 4,
    "category": "Lore",
    "pinned": false
  },
  {
    "id": "cross-over",
    "publish_at": "2026-11-26",
    "title": "Cross over as an explorer",
    "author": "Axiom",
    "summary": "The Ice Wall routes are open. The Legacy Terminal has one transmission left.",
    "body": "Beacon will show you how to bring a find to the surface. Mira is listening from the Observatory. Flint wants you to watch the ceilings. The old Terminal is set to detonate in the story. Watch the homepage transmission for the actual retirement schedule and Explorer enrollment notice.",
    "art": 5,
    "category": "Lore",
    "pinned": false
  }
] as const;

type Dispatch = { id: string; title: string; category: string; summary: string; publish_at: string; pinned: boolean; author?: string; body?: string; art?: number };
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
  const posts: Dispatch[] = [...published, ...launchPosts.map((post) => ({
    ...post, publish_at: "2026-11-25", pinned: post.id === "practice-world",
  })), ...lorePosts];
  return posts.sort((a, b) => Date.parse(b.publish_at) - Date.parse(a.publish_at));
}
