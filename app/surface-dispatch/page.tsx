import Link from "next/link";

export const metadata = { title: "Surface Dispatch | DIGDUG.DO" };

const categories = ["All updates", "Releases", "Maintenance", "Migration", "Field update"] as const;
const launchPosts = [
  { id: "practice-world", category: "Releases", title: "Flatverse Practice World is open", summary: "Enter the mine, bank a find, and explore with a practice profile." },
  { id: "v0-2-19", category: "Releases", title: "Flatverse v0.2.19 release notes", summary: "You can restore a practice profile on another device using its private profile code. Keep the code private." },
  { id: "zero-phase", category: "Migration", title: "Moving from the Zero Phase Terminal", summary: "Play Flatverse with a fresh practice profile. Existing Fund positions remain accessible using your Legacy Terminal session." },
] as const;

type Dispatch = { id: string; title: string; category: string; summary: string; publish_at: string; pinned: boolean };
const day = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" });

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

export default async function SurfaceDispatch({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const selected = categories.find((item) => item.toLowerCase() === category) ?? categories[0];
  const published = (await publishedDispatches()).map((post) => ({
    ...post, category: post.category === "Release" ? "Releases" : post.category,
  }));
  const posts = [...published, ...launchPosts.map((post) => ({ ...post, publish_at: "2026-11-25", pinned: post.id === "practice-world" }))];
  const visible = posts.filter((post) => selected === categories[0] || post.category === selected);
  const featured = posts.find((post) => post.pinned) ?? posts[0];
  return (
    <main className="sd">
      <style>{"\n.sd{min-height:100vh;background:#04111e;color:#f6fbff;font:16px/1.4 Arial,Helvetica,sans-serif;padding:18px clamp(12px,3vw,48px) 42px}.sd *{box-sizing:border-box}.sd a{color:inherit;text-decoration:none}.sd a:hover{text-decoration:underline}.sd a:focus-visible,.sd summary:focus-visible{outline:3px solid #ffc624;outline-offset:3px}.sd-shell{max-width:1350px;margin:auto}.sd-head,.sd-hero,.sd-feature,.sd-filters,.sd-post,.sd-empty{border:1px solid #37dcec;border-radius:7px;background:#061c2d}.sd-head,.sd-nav{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.sd-head{padding:11px 17px}.sd-brand{font-size:clamp(22px,3vw,34px);font-weight:900;letter-spacing:-.05em}.sd-nav{font-size:14px;font-weight:700}.sd .sd-gold{display:inline-block;text-align:center;border:1px solid #ffe188;border-radius:6px;background:linear-gradient(#ffdb51,#ffb400);color:#08121d;padding:7px 12px;font-weight:900}.sd-hero{margin-top:10px;min-height:clamp(200px,26vw,320px);padding:clamp(15px,3vw,38px);display:flex;justify-content:center;flex-direction:column;background:linear-gradient(90deg,#031222ef,#0312226e 53%,transparent 77%),url('/flatverse-ice-wall.jpg') center 9%/cover no-repeat #071a2f}.sd h1,.sd h2,.sd p{margin:0}.sd h1{font-size:clamp(38px,6vw,75px);font-weight:900;letter-spacing:-.055em;line-height:.98}.sd h1 span{color:#ffc624}.sd-hero p{max-width:34ch;margin-top:9px;color:#dbebf6}.sd-feature{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.35fr);gap:20px;margin:12px 0;padding:14px;align-items:center}.sd-thumb{aspect-ratio:2.5;border-radius:5px;background:url('/flatverse-ice-wall.jpg') 2% 91%/170% auto no-repeat #071a2f;position:relative}.sd-thumb span{position:absolute;top:7px;left:7px;color:#08121d;background:#ffc624;border-radius:4px;padding:3px 8px;font-weight:900;font-size:12px}.sd-copy{min-width:0}.sd time{display:block;font-size:13px;color:#a8d6e6}.sd h2{font-size:clamp(22px,3vw,38px);font-weight:850;line-height:1.07;letter-spacing:-.035em}.sd-feature h2{margin:5px 0}.sd-feature p,.sd-post p{color:#d2e7f2}.sd-feature .sd-gold{margin-top:10px}.sd-filters{display:flex;overflow:hidden;margin:12px 0}.sd-filters a{flex:1;text-align:center;padding:8px 5px;font-weight:800;font-size:14px}.sd-filters a+a{border-left:1px solid #1e8199}.sd-filters a[aria-current]{color:#07121b;background:#ffc624}.sd-post,.sd-empty{margin-top:9px;padding:13px}.sd-post summary{cursor:pointer;font-weight:850;font-size:clamp(17px,2.3vw,26px)}.sd-post p{margin-top:8px}.sd-post a{color:#93f3ff;text-decoration:underline}.sd-empty{color:#d2e7f2}.sd-post:target{outline:2px solid #ffc624;outline-offset:2px}\n@media(max-width:760px){.sd{padding:9px 10px 26px}.sd-head{padding:8px 10px}.sd-nav{font-size:12px;gap:7px}.sd-hero{min-height:174px;background-position:58% 16%;justify-content:flex-end}.sd-hero h1{font-size:clamp(33px,8.5vw,48px)}.sd-hero p{font-size:13px}.sd-feature{grid-template-columns:1fr;gap:8px;padding:10px}.sd-feature .sd-gold{width:100%}.sd-filters a{font-size:11px}.sd-post{padding:9px}}\n"}</style>
      <div className="sd-shell">
        <header className="sd-head">
          <Link className="sd-brand" href="/">DIGDUG.DO</Link>
          <nav className="sd-nav" aria-label="DIGDUG.DO"><a href="https://usddd.digdug.do/observatory">Observatory</a><a className="sd-gold" href="https://play.digdug.do/">Play Flatverse</a></nav>
        </header>
        <section className="sd-hero"><h1>Surface <span>Dispatch</span></h1><p>Launches, maintenance, and field updates from DIGDUG.DO.</p></section>
        <article className="sd-feature">
          <div className="sd-thumb"><span>{featured.category}</span></div>
          <div className="sd-copy"><time dateTime={featured.publish_at}>{day.format(new Date(featured.publish_at))}</time><h2>{featured.title}</h2><p>{featured.summary}</p><Link className="sd-gold" href={"/surface-dispatch#" + featured.id}>Read dispatch ›</Link></div>
        </article>
        <nav className="sd-filters" aria-label="Filter dispatches">{categories.map((item) => <Link key={item} href={item === categories[0] ? "/surface-dispatch" : "/surface-dispatch?category=" + item.toLowerCase()} aria-current={selected === item ? "page" : undefined}>{item}</Link>)}</nav>
        <section aria-label="Dispatches">
          {visible.length === 0 && <p className="sd-empty">No dispatches have been posted in this category.</p>}
          {visible.map((post) => <article className="sd-post" key={post.id} id={post.id}><time dateTime={post.publish_at}>{day.format(new Date(post.publish_at))}</time><details open={post.id === featured.id}><summary>{post.title}</summary><p>{post.summary}</p>{post.id === "practice-world" && <p>Rewards and USDDD in the Practice World are simulated. <a href="https://play.digdug.do/">Enter Flatverse</a></p>}{post.id === "zero-phase" && <p><Link href="/legacy-terminal">Open Legacy Terminal</Link> · <a href="https://usddd.digdug.do/fund">Open Fund Network</a></p>}</details></article>)}
        </section>
      </div>
    </main>
  );
}
