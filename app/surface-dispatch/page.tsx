import Link from "next/link";
import { day, getDispatchPosts } from "./feed";

export const metadata = { title: "Surface Dispatch | DIGDUG.DO" };

const categories = ["All updates", "Releases", "Maintenance", "Migration", "Field update", "Lore"] as const;
type Dispatch = Awaited<ReturnType<typeof getDispatchPosts>>[number];

const sceneDescriptions = [
  "An overturned chair and headset outside the abandoned relay station",
  "An old Terminal lights up inside a polar cave",
  "Three mining camps along the Ice Wall",
  "Three prison doors below the ice",
  "Explorers gather at the Ice Wall at dawn",
  "An explorer carries a glowing crate into an extraction bay",
  "Maintenance tools beside an idle relay",
  "The old Terminal beside a new Explorer station",
  "An Observatory telescope overlooks the mining camps",
];

const categoryScene: Record<string, number> = {
  Releases: 6, Maintenance: 7, Migration: 8, "Field update": 9,
};

function DispatchArt({ post, featured = false }: { post: Dispatch; featured?: boolean }) {
  const isCapture = post.id === "toastpunk-last-signal";
  const scene = (post.art ?? categoryScene[post.category] ?? 9) - 1;
  const position = [4, 50, 96];
  const style = isCapture ? {
    backgroundImage: "url('/toastpunk-terminal-capture-v2.png')",
    backgroundPosition: "center",
  } : {
    backgroundImage: "url('/surface-dispatch-scenes.png')",
    backgroundPosition: `${position[scene % 3]}% ${position[Math.floor(scene / 3)]}%`,
    backgroundSize: "318% 318%",
  };
  return <div className={`sd-thumb${featured ? " sd-thumb-featured" : ""}`} style={style} role="img"
    aria-label={isCapture ? "Possessed Digster AI operates the Terminal as the screen pulls in ToastPunk" : sceneDescriptions[scene]} />;
}

export default async function SurfaceDispatch({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const selected = categories.find((item) => item.toLowerCase() === category) ?? categories[0];
  const posts = await getDispatchPosts();
  const story = posts.filter((post) => post.category === "Lore").reverse();
  const updates = posts.filter((post) => post.category !== "Lore");
  const showStory = selected === "Lore" || selected === "All updates";
  const visible = selected === "All updates" ? [...story, ...updates]
    : selected === "Lore" ? story : updates.filter((post) => post.category === selected);
  const featured = showStory ? story[0] : visible.find((post) => post.pinned) ?? visible[0];
  return (
    <main className="sd">
      <style>{"\n.sd{min-height:100vh;background:#04111e;color:#f6fbff;font:16px/1.4 Arial,Helvetica,sans-serif;padding:18px clamp(12px,3vw,48px) 42px}.sd *{box-sizing:border-box}.sd a{color:inherit;text-decoration:none}.sd a:hover{text-decoration:underline}.sd a:focus-visible,.sd summary:focus-visible{outline:3px solid #ffc624;outline-offset:3px}.sd-shell{max-width:1350px;margin:auto}.sd-head,.sd-hero,.sd-feature,.sd-filters,.sd-post,.sd-empty{border:1px solid #37dcec;border-radius:7px;background:#061c2d}.sd-head,.sd-nav{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.sd-head{padding:11px 17px}.sd-brand{font-size:clamp(22px,3vw,34px);font-weight:900;letter-spacing:-.05em}.sd-nav{font-size:14px;font-weight:700}.sd .sd-gold{display:inline-block;text-align:center;border:1px solid #ffe188;border-radius:6px;background:linear-gradient(#ffdb51,#ffb400);color:#08121d;padding:7px 12px;font-weight:900}.sd-hero{margin-top:10px;min-height:clamp(200px,26vw,320px);padding:clamp(15px,3vw,38px);display:flex;justify-content:center;flex-direction:column;background:linear-gradient(90deg,#031222ef,#0312226e 53%,transparent 77%),url('/flatverse-ice-wall.jpg') center 9%/cover no-repeat #071a2f}.sd h1,.sd h2,.sd p{margin:0}.sd h1{font-size:clamp(38px,6vw,75px);font-weight:900;letter-spacing:-.055em;line-height:.98}.sd h1 span{color:#ffc624}.sd-hero p{max-width:34ch;margin-top:9px;color:#dbebf6}.sd-feature{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.35fr);gap:20px;margin:12px 0;padding:14px;align-items:center}.sd-thumb{aspect-ratio:2.5;border-radius:5px;background:url('/flatverse-ice-wall.jpg') 2% 91%/170% auto no-repeat #071a2f;position:relative}.sd-thumb span{position:absolute;top:7px;left:7px;color:#08121d;background:#ffc624;border-radius:4px;padding:3px 8px;font-weight:900;font-size:12px}.sd-copy{min-width:0}.sd time{display:block;font-size:13px;color:#a8d6e6}.sd h2{font-size:clamp(22px,3vw,38px);font-weight:850;line-height:1.07;letter-spacing:-.035em}.sd-feature h2{margin:5px 0}.sd-feature p,.sd-post p{color:#d2e7f2}.sd-feature .sd-gold{margin-top:10px}.sd-filters{display:flex;overflow:hidden;margin:12px 0}.sd-filters a{flex:1;text-align:center;padding:8px 5px;font-weight:800;font-size:14px}.sd-filters a+a{border-left:1px solid #1e8199}.sd-filters a[aria-current]{color:#07121b;background:#ffc624}.sd-post,.sd-empty{margin-top:9px;padding:13px}.sd-post summary{cursor:pointer;font-weight:850;font-size:clamp(17px,2.3vw,26px)}.sd-post p{margin-top:8px}.sd-post a{color:#93f3ff;text-decoration:underline}.sd-empty{color:#d2e7f2}.sd-post:target{outline:2px solid #ffc624;outline-offset:2px}\n@media(max-width:760px){.sd{padding:9px 10px 26px}.sd-head{padding:8px 10px}.sd-nav{font-size:12px;gap:7px}.sd-hero{min-height:174px;background-position:58% 16%;justify-content:flex-end}.sd-hero h1{font-size:clamp(33px,8.5vw,48px)}.sd-hero p{font-size:13px}.sd-feature{grid-template-columns:1fr;gap:8px;padding:10px}.sd-feature .sd-gold{width:100%}.sd-filters a{font-size:11px}.sd-post{padding:9px}}\n"}</style>
      <style>{".sd{font-family:var(--font-geist-sans),system-ui,sans-serif}.sd .site-header{display:flex;align-items:center;justify-content:space-between;gap:10px 18px;flex-wrap:wrap;padding:11px 17px;border:1px solid #37dcec;border-radius:7px;background:#061c2d}.sd .site-brand{color:#f6fbff;font-size:clamp(21px,2.4vw,31px);font-weight:900;letter-spacing:-.045em;line-height:1.1;white-space:nowrap}.sd .site-brand span{color:#7defff;font-size:.71em}.sd .site-nav{display:flex;align-items:center;flex-wrap:wrap;gap:8px 15px;font-size:14px;font-weight:700}.sd .site-nav>a{color:#f6fbff}.sd .site-cta{display:inline-block;background:linear-gradient(#ffdc54,#ffb400);color:#07121b!important;border:1px solid #ffeb9e;border-radius:6px;padding:7px 13px;font-weight:850;text-align:center}.sd .site-testnet{display:inline-flex;align-items:center;gap:5px;padding:3px 6px;border:1px solid #246893;border-radius:5px;background:#031323;color:#5bff5f;box-shadow:inset 0 1px #84e9ff42,inset 0 -3px #05112285;font-size:10px;font-weight:900;line-height:1;text-transform:uppercase;white-space:nowrap}.sd .site-testnet::before{content:'';width:5px;height:5px;background:currentColor;border-radius:50%;box-shadow:0 0 6px currentColor}.sd .site-footer{display:flex;flex-wrap:wrap;gap:5px 16px;margin-top:16px;padding:12px 2px 0;border-top:1px solid #295065;color:#9eb5c7;font-size:12px}.sd .site-footer a{color:#b7dae7}@media(max-width:760px){.sd .site-header{padding:9px 10px}.sd .site-nav{width:100%;font-size:12px;gap:8px 12px}}.sd-shell{max-width:1420px}.sd-hero h1{text-shadow:0 3px 22px #020c18}.sd-hero h1 span{display:block}.sd-thumb{background-color:#091e32}.sd-filters{display:grid;grid-template-columns:repeat(5,minmax(0,1fr))}.sd-filters a{min-height:38px;display:grid;place-items:center}.sd-post summary{line-height:1.2;overflow-wrap:anywhere}@media(max-width:760px){.sd .site-cta{width:100%}.sd-hero{min-height:210px}.sd-filters a{padding:6px 3px;line-height:1.2;overflow-wrap:anywhere}}"}</style>
      <style>{`
        .sd-filters{grid-template-columns:repeat(6,minmax(0,1fr))}
        .sd-thumb{background-size:cover;aspect-ratio:3/2}
        .sd-thumb-featured{width:100%}
        .sd-feature .sd-copy>p{margin-top:8px}
        .sd-section-title{margin-top:24px;font-size:24px}
        .sd-source{color:#a8d6e6;font-size:13px}
        .sd-post:target details{scroll-margin-top:10px}
        .sd-post{display:grid;grid-template-columns:minmax(114px,200px) minmax(0,1fr);gap:15px;align-items:start}
        .sd-post-meta{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:center;margin-bottom:5px}
        .sd-story-label{color:#ffde7f;font-size:13px;font-weight:700}
        .sd .sd-archive-link{display:inline-block;margin-top:8px;color:#a8efff}
        @media(max-width:600px){.sd-filters{grid-template-columns:repeat(3,minmax(0,1fr))}.sd-post{grid-template-columns:minmax(86px,30%) minmax(0,1fr);gap:9px}}
      `}</style>
      <div className="sd-shell">
        <header className="site-header">
          <Link className="site-brand" href="/">DIGDUG.DO <span>/ SURFACE DISPATCH</span></Link>
          <nav className="site-nav" aria-label="DIGDUG.DO">
            <Link href="/">Home</Link>
            <a href="https://usddd.digdug.do/">Observatory</a>
            <a href="https://usddd.digdug.do/fund">Fund Network</a>
            <span className="site-testnet" title="Testnet game rewards are simulated.">Live - Testnet</span>
            <a className="site-cta" href="https://play.digdug.do/">Play Flatverse</a>
          </nav>
        </header>
        <section className="sd-hero"><h1>Surface <span>Dispatch</span></h1><p>Recovered transmissions from the Ice Wall, alongside official Flatverse updates.</p><Link className="sd-archive-link" href="/surface-dispatch?category=lore#toastpunk-last-signal">Start with ToastPunk’s July 22 transmission ›</Link></section>
        {featured && <article className="sd-feature">
          <DispatchArt post={featured} featured />
          <div className="sd-copy">
            <div className="sd-post-meta">
              <time dateTime={featured.publish_at}>{day.format(new Date(featured.publish_at))}</time>
              <span className="sd-story-label">{featured.author ? `Lore · ${featured.author}` : featured.category}</span>
            </div>
            <h2>{featured.title}</h2>
            <p>{featured.summary}</p>
            <Link className="sd-gold" href={"#" + featured.id}>{featured.author ? "Open archive entry" : "Read dispatch"} ›</Link>
          </div>
        </article>}
        <nav className="sd-filters" aria-label="Filter dispatches">{categories.map((item) => <Link key={item} href={item === categories[0] ? "/surface-dispatch" : "/surface-dispatch?category=" + item.toLowerCase()} aria-current={selected === item ? "page" : undefined}>{item}</Link>)}</nav>
        <section aria-label="Dispatches">
          {visible.length === 0 && <p className="sd-empty">No dispatches have been posted in this category.</p>}
          {showStory && <h2 className="sd-section-title">Story archive</h2>}
          {visible.map((post, index) => <div key={post.id}>
            {selected === "All updates" && index === story.length && <h2 className="sd-section-title">Official updates</h2>}
            <article className="sd-post" id={post.id}>
            <DispatchArt post={post} />
            <div className="sd-copy">
              <div className="sd-post-meta">
                <time dateTime={post.publish_at}>{day.format(new Date(post.publish_at))}</time>
                <span className="sd-story-label">{post.author ? `Lore · ${post.author}` : post.category}</span>
              </div>
              <details open={post.id === featured?.id || post.id === "toastpunk-last-signal"}>
                <summary>{post.title}</summary>
                <p>{post.summary}</p>
                {post.source && <p className="sd-source">Archive source · {post.source}</p>}
                {post.body?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {post.id === "cross-over" && <p><Link href="/#transmission">Read the homepage transmission</Link> · <a href="https://play.digdug.do/">Enter Flatverse</a></p>}
                {post.id === "practice-world" && <p><a href="https://play.digdug.do/">Enter Flatverse</a></p>}
                {post.id === "zero-phase" && <p><Link href="/#transmission">Read the homepage transmission</Link> · <a href="https://usddd.digdug.do/fund">Open Fund Network</a></p>}
                {post.id === "2c1801a3-b074-4483-bf05-b66925d6f32f" && <p><a href="https://usddd.digdug.do/">Open Observatory</a></p>}
              </details>
            </div>
          </article></div>)}
        </section>
        <footer className="site-footer"><span>Official updates from DIGDUG.DO.</span><a href="mailto:usddd@digdug.do">usddd@digdug.do</a><span>© {new Date().getUTCFullYear()} DIGDUG.DO</span></footer>
      </div>
    </main>
  );
}
