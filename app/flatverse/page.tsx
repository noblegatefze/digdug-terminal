import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { day, getDispatchPosts } from "../surface-dispatch/feed";

export const metadata = { title: "DIGDUG.DO | Enter Flatverse" };

const pancakeSwapUrl = "https://pancake.xyz/swap?inputCurrency=0x55d398326f99059fF775485246999027B3197955&outputCurrency=0x03f65216F340bAC39c8d1911288B1c7CA071e9c3&chain=bsc";

const networkLinks = [
  { title: "PancakeSwap", description: "USDDD / USDT on BNB Chain", href: pancakeSwapUrl },
  { title: "Whitepaper", description: "Read the protocol documents", href: "https://github.com/noblegatefze/digdug-whitepaper" },
  { title: "Back the Exploration", description: "Visit the Fund Network", href: "https://usddd.digdug.do/fund" },
];

const guides = [
  { name: "Axiom", colour: "Violet", portrait: "0% 0%", role: "Transmission lead", description: "The voice behind the Ice Wall. Axiom issues field briefings and is the only guide planned for X." },
  { name: "Flint", colour: "Coral", portrait: "100% 0%", role: "Deep tunnel guide", description: "Grumpy, precise, and worth listening to when the tunnels start to shift." },
  { name: "Mira", colour: "Cyan", portrait: "0% 100%", role: "Observatory guide", description: "She helps explorers read the map and make sense of what the regions are reporting." },
  { name: "Beacon", colour: "Gold", portrait: "100% 100%", role: "Surface guide", description: "An upbeat voice for first digs, cargo packs, and getting your finds back to the surface." },
];

const countdownScript = `
  (() => {
    const time = document.getElementById("fv-terminal-countdown");
    if (!time) return;
    const deadline = Date.parse(time.dateTime);
    if (!Number.isFinite(deadline)) return;
    const timer = window.setInterval(update, 1000);
    function update() {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      if (remaining === 0) {
        time.textContent = "Countdown complete";
        window.clearInterval(timer);
        return;
      }
      const days = Math.floor(remaining / 86400);
      const clock = [Math.floor(remaining / 3600) % 24, Math.floor(remaining / 60) % 60, remaining % 60]
        .map((unit) => String(unit).padStart(2, "0")).join(":");
      time.textContent = days + "d " + clock;
    }
    update();
  })();
`;

export default async function FlatverseHome() {
  const deadline = new Date("2027-01-01T00:00:00Z");
  const posts = await getDispatchPosts();
  const featured = posts.find((post) => post.id === "toastpunk-last-signal");
  return (
    <main className="fv">
      <style>{"\n.fv {min-height:100vh;background:#04101e;color:#f7fbff;font:16px/1.5 Arial,Helvetica,sans-serif;padding:24px clamp(14px,4vw,64px) 40px;box-sizing:border-box}\n.fv * {box-sizing:border-box}.fv a{color:#c7faff;text-decoration:none}.fv a:hover{text-decoration:underline}.fv a:focus-visible,.fv summary:focus-visible{outline:3px solid #ffc624;outline-offset:4px}\n.fv h1,.fv h2,.fv h3,.fv p{margin:0}.fv h1,.fv h2{line-height:1.01;letter-spacing:-.045em}.fv h2{font-size:clamp(25px,3vw,42px)}\n.fv-shell{max-width:1350px;margin:auto}.fv-head,.fv-signal,.fv-footer{display:flex;align-items:center;justify-content:space-between;gap:14px}.fv-head{padding:12px 0 16px;border-bottom:1px solid #47d7ed}.fv-brand{font-size:clamp(22px,3vw,34px);font-weight:900;letter-spacing:-.05em}.fv-nav{display:flex;gap:clamp(12px,2vw,28px);flex-wrap:wrap;align-items:center;font-weight:700}.fv-signal{margin:13px 0;padding:8px 13px;border:1px solid #21cce8;background:#06243b;border-radius:6px;font-weight:700}\n.fv-signal span::before{content:\"\";display:inline-block;width:9px;height:9px;border-radius:50%;background:#40ecff;box-shadow:0 0 11px #40ecff;margin-right:9px;vertical-align:1px}.fv .fv-minor{border:1px solid #ffc624;border-radius:5px;padding:5px 10px;color:#ffe16a;white-space:nowrap}\n.fv-grid{display:grid;grid-template-columns:minmax(0,1.64fr) minmax(0,1fr);gap:12px}.fv-card{min-width:0;position:relative;overflow:hidden;border:1px solid #38d3eb;border-radius:7px;background:#071c2f;padding:clamp(18px,3vw,36px)}.fv-side{display:grid;grid-template-rows:1.1fr 1fr;gap:12px}.fv-play{display:flex;align-items:flex-start;min-height:clamp(420px,48vw,660px);background:radial-gradient(ellipse at 84% 64%,#1c6892 0%,#082e4f 34%,#041424 67%)}.fv-play .fv-copy{position:relative;z-index:1;max-width:65%}.fv-play h1{font-size:clamp(52px,7vw,108px);font-weight:950;text-transform:uppercase;line-height:.88;margin:8px 0 19px}.fv-play h1 span,.fv-accent{color:#ffc624}.fv-art{position:absolute;width:61%;aspect-ratio:1;bottom:0;right:-4%;filter:drop-shadow(0 12px 26px #021221)}.fv-copy p,.fv-card p{color:#cadcec}.fv .fv-action{display:inline-block;margin:18px 0 8px;padding:10px 19px;background:linear-gradient(#ffdb4d,#ffae00);color:#071019;border:1px solid #ffe886;border-radius:6px;font-weight:900;box-shadow:0 4px 18px #ffb50024}.fv .fv-action:hover{background:#ffe470}.fv-tag{font-size:13px}.fv-observe{background:radial-gradient(ellipse at 90% 95%,#136a9b,#092543 53%,#071a2d);display:flex;flex-direction:column;align-items:flex-start;justify-content:center}.fv-card h2+p{margin-top:9px}.fv-network nav{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:15px}.fv-network nav a{display:flex;flex-direction:column;gap:7px;justify-content:space-between;min-height:74px;padding:10px;border:1px solid #26a9c6;border-radius:5px;background:#062137;font-size:14px;font-weight:700}.fv-network nav span{color:#59e6fe;font-size:17px}.fv-footer{margin-top:15px;padding:13px 0;border-top:1px solid #238fa7;justify-content:center;font-weight:700}.fv-note{margin-top:14px;padding:18px 20px;border:1px solid #24536e;border-radius:7px;background:#061828}.fv-note summary{cursor:pointer;font-weight:800}.fv-note summary+p{margin-top:10px;color:#cadcec}.fv-posts{display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px;margin-top:14px}.fv-posts article{border:1px solid #24536e;border-radius:6px;padding:13px}.fv-posts article:first-child{border-left:3px solid #ffc624}.fv-posts time{font-size:12px;color:#93dcf1}.fv-posts h3{margin:4px 0;font-size:17px}.fv-posts p{font-size:14px;color:#cadcec}\n@media(max-width:760px){.fv{padding:11px 12px 24px}.fv-grid,.fv-side,.fv-posts{grid-template-columns:1fr;grid-template-rows:auto}.fv-head{flex-wrap:wrap}.fv-nav{font-size:13px}.fv-signal{font-size:13px}.fv-play{min-height:0;display:block;padding-top:min(53vw,280px)}.fv-art{width:min(55vw,280px);right:2%;top:0;bottom:auto}.fv-play .fv-copy{max-width:none}.fv-play h1{font-size:clamp(42px,11vw,70px)}.fv .fv-action{width:100%;text-align:center}.fv-network nav{grid-template-columns:1fr}.fv-network nav a{flex-direction:row;align-items:center;min-height:0}.fv-observe{min-height:180px}}\n\n.fv-play{background:#041424;isolation:isolate;min-height:clamp(460px,45vw,660px)}\n.fv-play .fv-copy{max-width:56%;padding-top:2px}\n.fv-play h1{font-size:clamp(46px,5.7vw,86px);line-height:.9;margin-bottom:18px;letter-spacing:-.055em}\n.fv-play h1 span{display:block}\n.fv-play .fv-copy p{max-width:28ch}\n.fv-art{width:auto;aspect-ratio:auto;inset:0;filter:none;z-index:-2}\n.fv-art::after{content:\"\";position:absolute;inset:0;background:linear-gradient(90deg,#031223d9,#03122355 38%,transparent 65%)}\n.fv-play .fv-action{min-width:min(245px,100%);text-align:center}\n.fv-head{justify-content:flex-start;gap:clamp(18px,4vw,54px)}\n.fv-nav a:first-child{border-left:1px solid #38d3eb;padding-left:clamp(10px,2vw,24px)}\n.fv-side .fv-observe h2{max-width:9ch;color:#f7fbff}\n.fv-side .fv-observe h2 span{color:inherit}\n.fv-footer::before,.fv-footer::after{content:\"\";height:1px;background:#32d2e8;flex:1;max-width:24vw}\n@media(max-width:760px){.fv-head{gap:10px 16px}.fv-nav{gap:10px}.fv-play{min-height:0;padding-top:min(49vw,270px)}.fv-play .fv-copy{max-width:none}.fv-play .fv-copy p{max-width:none}.fv-art{width:auto;inset:0 0 auto;height:min(65vw,340px)}.fv-art::after{background:linear-gradient(0deg,#041424 3%,transparent 60%)}.fv-play h1{font-size:clamp(33px,8.5vw,54px);margin:4px 0 10px}.fv-play h1 span{display:inline}.fv-play .fv-action{margin-top:12px}.fv-play .fv-tag{text-align:center}.fv-side .fv-observe h2{max-width:none}}\n\n.fv-play h1{font-size:clamp(41px,4.7vw,72px)}\n.fv-play .fv-copy p.fv-tag{max-width:none}\n.fv-card,.fv-signal{border-color:#37dcec}\n.fv-observe{justify-content:flex-start;min-height:270px;background:linear-gradient(90deg,#031326aa,transparent 75%),url('/flatverse-observatory.jpg') 72% 49%/cover no-repeat #071a2d}\n.fv-observe p{max-width:25ch;text-shadow:0 1px 8px #000}\n.fv-network nav a{min-height:112px;position:relative;align-items:flex-start;justify-content:flex-end;padding:9px;background:linear-gradient(155deg,#0d4563,#061a2c 65%);line-height:1.2}\n.fv-network nav i{font-size:31px;font-style:normal;line-height:1;margin:1px 0 4px}\n.fv-network nav a span{position:absolute;right:7px;bottom:6px;font-size:18px}\n@media(max-width:760px){.fv-play h1{font-size:clamp(30px,8.1vw,54px)}.fv-observe{min-height:188px;background-position:73% 54%}.fv-observe .fv-action{width:auto}.fv-network nav a{min-height:45px;flex-direction:row;align-items:center;justify-content:flex-start;gap:10px;padding-right:30px}.fv-network nav i{margin:0;font-size:23px}.fv-network nav a span{bottom:auto}}\n"}</style>
      <style>{".fv{font-family:var(--font-geist-sans),system-ui,sans-serif}.fv .site-header{display:flex;align-items:center;justify-content:space-between;gap:10px 18px;flex-wrap:wrap;padding:11px 17px;border:1px solid #37dcec;border-radius:7px;background:#061c2d}.fv .site-brand{color:#f6fbff;font-size:clamp(21px,2.4vw,31px);font-weight:900;letter-spacing:-.045em;line-height:1.1;white-space:nowrap}.fv .site-brand span{color:#7defff;font-size:.71em}.fv .site-nav{display:flex;align-items:center;flex-wrap:wrap;gap:8px 15px;font-size:14px;font-weight:700}.fv .site-nav>a{color:#f6fbff}.fv .site-cta{display:inline-block;background:linear-gradient(#ffdc54,#ffb400);color:#07121b!important;border:1px solid #ffeb9e;border-radius:6px;padding:7px 13px;font-weight:850;text-align:center}.fv .site-testnet{display:inline-flex;align-items:center;gap:5px;padding:3px 6px;border:1px solid #246893;border-radius:5px;background:#031323;color:#5bff5f;box-shadow:inset 0 1px #84e9ff42,inset 0 -3px #05112285;font-size:10px;font-weight:900;line-height:1;text-transform:uppercase;white-space:nowrap}.fv .site-testnet::before{content:'';width:5px;height:5px;background:currentColor;border-radius:50%;box-shadow:0 0 6px currentColor}.fv .site-footer{display:flex;flex-wrap:wrap;gap:5px 16px;margin-top:16px;padding:12px 2px 0;border-top:1px solid #295065;color:#9eb5c7;font-size:12px}.fv .site-footer a{color:#b7dae7}@media(max-width:760px){.fv .site-header{padding:9px 10px}.fv .site-nav{width:100%;font-size:12px;gap:8px 12px}}.fv-shell{max-width:1420px}.fv .site-nav a:first-child{border:0;padding:0}.fv-play h1{font-weight:900;text-shadow:0 3px 22px #020c18}.fv .fv-posts{grid-template-columns:minmax(0,1fr)}.fv .fv-footer{justify-content:flex-start;flex-wrap:wrap}.fv .fv-footer::before,.fv .fv-footer::after{display:none}@media(max-width:760px){.fv .site-cta{width:100%}.fv-network nav a{overflow-wrap:anywhere}}"}</style>
      <style>{`
        .fv-signal{flex-wrap:wrap}
        .fv-signal-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px 14px}
        .fv-countdown{display:grid;gap:1px;color:#ffe78f}
        .fv-countdown small,.fv-network nav small,.fv-guides small{color:#a3c5d8;font-size:12px}
        .fv-countdown time{font-variant-numeric:tabular-nums;line-height:1.25}
        .fv-network nav a{display:flex;flex-direction:column;justify-content:flex-end;align-items:flex-start;gap:5px;min-height:106px;padding:25px 12px 12px;border-color:#38657b;background:linear-gradient(145deg,#113b52,#081c30);border-radius:9px}
        .fv-network nav a:hover{background:#123b53;border-color:#77eaff;text-decoration:none}
        .fv-network nav a span{top:7px;right:10px;bottom:auto}
        .fv-note p+p,.fv-note h2+p{margin-top:10px}
        .fv-note p,.fv-note article p{color:#cadcec}
        .fv-guides{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:15px}
        .fv-guides article{padding:14px;border:1px solid #24536e;border-radius:8px;background:#0a2236}
        .fv-guide-portrait{aspect-ratio:1;margin-bottom:12px;border-radius:5px;background:url('/flatverse-guide-portraits.png') 0 0/201% 201% no-repeat #071a2d}
        .fv-guides article p{margin-top:8px;font-size:14px}
        #enrollment{margin-bottom:14px;scroll-margin-top:16px}
        #enrollment .fv-guides{grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))}
        #enrollment .fv-guides+p{margin-top:10px}
        .fv-posts article.fv-dispatch-feature{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.35fr);gap:20px;align-items:center}
        .fv-dispatch-art{display:block;width:100%;height:auto;border-radius:5px}
        @media(max-width:600px){.fv-posts article.fv-dispatch-feature{grid-template-columns:1fr;gap:12px}}
        @media(max-width:1050px){.fv-network nav{grid-template-columns:1fr}.fv-network nav a{min-height:0;padding:9px 30px 9px 12px}}
        @media(max-width:760px){.fv-guides{grid-template-columns:repeat(2,minmax(0,1fr))}}
      `}</style>
      <div className="fv-shell">
        <header className="site-header">
          <strong className="site-brand">DIGDUG.DO</strong>
          <div className="dd-account-nav">
            <nav className="site-nav" aria-label="DIGDUG.DO">
              <a href="https://usddd.digdug.do/">Observatory</a>
              <Link href="/surface-dispatch">Surface Dispatch</Link>
              <a href="https://usddd.digdug.do/fund">Fund Network</a>
              <span className="site-testnet" title="Testnet game rewards are simulated.">Live - Testnet</span>
              <a className="site-cta" href="https://play.digdug.do/">Play Flatverse</a>
            </nav>
            <div data-explorer-account="" />
          </div>
        </header>
        <Script src="https://usddd.digdug.do/explorer-account.js" strategy="afterInteractive" />
        <div className="fv-signal">
          <span>Signal from beyond the Ice Wall</span>
          <div className="fv-signal-actions">
            <div className="fv-countdown">
              <small>Legacy Terminal detonation</small>
              <time id="fv-terminal-countdown" dateTime={deadline.toISOString()} title={deadline.toUTCString()}>
                {deadline.toUTCString()}
              </time>
            </div>
            <a className="fv-minor" href="#transmission">Read transmission</a>
          </div>
        </div>
        <Script id="fv-terminal-countdown-script" strategy="afterInteractive">{countdownScript}</Script>
        <section id="enrollment" className="fv-note" aria-labelledby="fv-enrollment-title">
          <h2 id="fv-enrollment-title">Explorer enrollment</h2>
          <p>Enrolled Explorers receive starting credit in the Flatverse Practice World. Check the form for enrollment availability.</p>
          <div className="fv-guides">
            <article>
              <h3>New Explorer</h3>
              <p><strong>10 USDDD</strong> starting credit. Choose a username and set up Google Authenticator when enrollment opens.</p>
            </article>
            <article>
              <h3>Legacy Badge</h3>
              <p><strong>25 USDDD</strong> total. Get 10 USDDD starting credit and a 15 USDDD bonus when you migrate your Legacy account.</p>
            </article>
            <article>
              <h3>Legacy Backer Badge</h3>
              <p><strong>50 USDDD</strong> total. Legacy users with a funded position get 10 USDDD starting credit and a 40 USDDD bonus when they migrate.</p>
            </article>
          </div>
          <p>Legacy users will verify their username and Terminal Pass once, then scan a QR code and verify a six-digit Google Authenticator code. Once enrolled, sign in with your username and current Authenticator code.</p>
          <button type="button" data-open-explorer-account="" className="fv-action">Open Explorer account</button>
          <p>Practice World credits are simulated. For help recovering access to a Fund position, email <a href="mailto:usddd@digdug.do">usddd@digdug.do</a>.</p>
        </section>
        <div className="fv-grid">
          <section className="fv-card fv-play">
            <div className="fv-art"><Image src="/flatverse-ice-wall.jpg" alt="" fill priority sizes="(max-width: 760px) 100vw, 62vw" style={{ objectFit: "cover", objectPosition: "65% 42%" }} /></div>
            <div className="fv-copy">
              <h1>Enter <span>Flatverse</span></h1>
              <p>Dig beyond the Ice Wall and bring buried finds back to the surface.</p>
              <a className="fv-action" href="https://play.digdug.do/">Enter Flatverse</a>
              <p className="fv-tag">Practice World · Simulated rewards</p>
            </div>
          </section>
          <div className="fv-side">
            <section className="fv-card fv-observe">
              <h2>Flatverse <span className="fv-accent">Observatory</span></h2>
              <p>See live explorer activity, recent extractions, and daily ranks.</p>
              <a className="fv-action" href="https://play.digdug.do/">Explore Ice Wall</a>
            </section>
            <section className="fv-card fv-network">
              <h2>USDDD Network</h2>
              <p>The on-chain network behind DIGDUG.DO.</p>
              <nav aria-label="USDDD Network">
                {networkLinks.map(({ title, description, href }) => (
                  <a key={title} href={href} target="_blank" rel="noopener noreferrer" aria-label={title + " (opens in a new tab)"}>
                    <span aria-hidden="true">↗</span>
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </a>
                ))}
              </nav>
            </section>
          </div>
        </div>
        <div className="fv-footer"><Link href="/legacy-terminal">Open Legacy Terminal</Link><Link href="/surface-dispatch">Surface Dispatch</Link></div>
        <details className="fv-note" id="transmission" open>
          <summary>The Last Terminal Transmission</summary>
          <p>For months, ToastPunk’s X account stayed silent. The original founder had been captured. When a digger entered an encrypted command in the Legacy Terminal, the intelligence behind the Ice Wall used it to infiltrate the DIGDUG.DO and USDDD systems in the world of Flatverse.</p>
          <p>The new controllers opened three regions along the Ice Wall and revealed where the real treasure was buried. Take tools underground, extract hidden crates, and use the Observatory to see what other explorers are bringing to the surface. The map above ground tells only part of the story. Cross over as an explorer to find out what lies below.</p>
          <p>In the story, the Legacy Terminal is set to detonate. Existing diggers will move to QR-based Explorer enrollment when the migration opens. Legacy Terminal registration is closed. The Terminal retirement deadline is 1 January 2027 at 00:00 UTC.</p>
        </details>
        <section className="fv-note" id="explorer-guides">
          <h2>Meet the Explorer Guides</h2>
          <p>Four AI characters from behind the Ice Wall. Telegram appearances are planned for all four guides.</p>
          <div className="fv-guides">
            {guides.map(({ name, colour, portrait, role, description }) => (
              <article key={name}>
                <div className="fv-guide-portrait" role="img" aria-label={`${name} wearing a masked ${colour.toLowerCase()} explorer suit`} style={{ backgroundPosition: portrait }} />
                <h3>{name}</h3>
                <small>{role}</small>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="fv-note" id="surface-dispatch">
          <h2>Surface <span className="fv-accent">Dispatch</span></h2>
          {featured && (
            <div className="fv-posts">
              <article className="fv-dispatch-feature">
                <Image className="fv-dispatch-art" src="/toastpunk-terminal-prison.png" width={1536} height={1024} sizes="(max-width: 600px) 100vw, 40vw" alt="ToastPunk is pulled through the Terminal screen toward the barred Ice Wall prison" />
                <div>
                  <time dateTime={featured.publish_at}>{day.format(new Date(featured.publish_at))}</time>
                  <h3>{featured.title}</h3>
                  <p>{featured.summary}</p>
                  <Link className="fv-action" href={"/surface-dispatch#" + featured.id}>Read ToastPunk’s Last Transmission</Link>
                </div>
              </article>
            </div>
          )}
        </section>
        <footer className="site-footer"><span>Flatverse Testnet rewards are simulated.</span><a href="mailto:usddd@digdug.do">usddd@digdug.do</a><span>© {new Date().getUTCFullYear()} DIGDUG.DO</span></footer>
      </div>
    </main>
  );
}
