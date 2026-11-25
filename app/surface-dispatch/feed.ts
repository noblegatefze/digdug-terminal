const launchPosts = [
  { id: "practice-world", category: "Releases", title: "Flatverse Practice World is open", summary: "Enter the mine, bank a find, and explore with a practice profile." },
  { id: "v0-2-19", category: "Releases", title: "Flatverse v0.2.19 release notes", summary: "You can restore a practice profile on another device using its private profile code. Keep the code private." },
  { id: "zero-phase", category: "Migration", title: "Moving from the Zero Phase Terminal", summary: "Play Flatverse with a fresh practice profile. Existing Fund positions remain accessible using your Legacy Terminal session." },
] as const;

type Dispatch = { id: string; title: string; category: string; summary: string; publish_at: string; pinned: boolean };
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
  return [...published, ...launchPosts.map((post) => ({ ...post, publish_at: "2026-11-25", pinned: post.id === "practice-world" }))];
}
