import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "DIGDUG.DO | Enter Flatverse" };

export default function FlatverseHome() {
  return (
    <main className="fv">
      <style>{"\n.fv {min-height:100vh;background:#04101e;color:#f7fbff;font:16px/1.5 Arial,Helvetica,sans-serif;padding:24px clamp(14px,4vw,64px) 40px;box-sizing:border-box}\n.fv * {box-sizing:border-box}.fv a{color:#c7faff;text-decoration:none}.fv a:hover{text-decoration:underline}.fv a:focus-visible,.fv summary:focus-visible{outline:3px solid #ffc624;outline-offset:4px}\n.fv h1,.fv h2,.fv h3,.fv p{margin:0}.fv h1,.fv h2{line-height:1.01;letter-spacing:-.045em}.fv h2{font-size:clamp(25px,3vw,42px)}\n.fv-shell{max-width:1350px;margin:auto}.fv-head,.fv-signal,.fv-footer{display:flex;align-items:center;justify-content:space-between;gap:14px}.fv-head{padding:12px 0 16px;border-bottom:1px solid #47d7ed}.fv-brand{font-size:clamp(22px,3vw,34px);font-weight:900;letter-spacing:-.05em}.fv-nav{display:flex;gap:clamp(12px,2vw,28px);flex-wrap:wrap;align-items:center;font-weight:700}.fv-signal{margin:13px 0;padding:8px 13px;border:1px solid #21cce8;background:#06243b;border-radius:6px;font-weight:700}\n.fv-signal span::before{content:\"\";display:inline-block;width:9px;height:9px;border-radius:50%;background:#40ecff;box-shadow:0 0 11px #40ecff;margin-right:9px;vertical-align:1px}.fv .fv-minor{border:1px solid #ffc624;border-radius:5px;padding:5px 10px;color:#ffe16a;white-space:nowrap}\n.fv-grid{display:grid;grid-template-columns:minmax(0,1.64fr) minmax(0,1fr);gap:12px}.fv-card{min-width:0;position:relative;overflow:hidden;border:1px solid #38d3eb;border-radius:7px;background:#071c2f;padding:clamp(18px,3vw,36px)}.fv-side{display:grid;grid-template-rows:1.1fr 1fr;gap:12px}.fv-play{display:flex;align-items:flex-start;min-height:clamp(420px,48vw,660px);background:radial-gradient(ellipse at 84% 64%,#1c6892 0%,#082e4f 34%,#041424 67%)}.fv-play .fv-copy{position:relative;z-index:1;max-width:65%}.fv-play h1{font-size:clamp(52px,7vw,108px);font-weight:950;text-transform:uppercase;line-height:.88;margin:8px 0 19px}.fv-play h1 span,.fv-accent{color:#ffc624}.fv-art{position:absolute;width:61%;aspect-ratio:1;bottom:0;right:-4%;filter:drop-shadow(0 12px 26px #021221)}.fv-copy p,.fv-card p{color:#cadcec}.fv .fv-action{display:inline-block;margin:18px 0 8px;padding:10px 19px;background:linear-gradient(#ffdb4d,#ffae00);color:#071019;border:1px solid #ffe886;border-radius:6px;font-weight:900;box-shadow:0 4px 18px #ffb50024}.fv .fv-action:hover{background:#ffe470}.fv-tag{font-size:13px}.fv-observe{background:radial-gradient(ellipse at 90% 95%,#136a9b,#092543 53%,#071a2d);display:flex;flex-direction:column;align-items:flex-start;justify-content:center}.fv-card h2+p{margin-top:9px}.fv-network nav{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:15px}.fv-network nav a{display:flex;flex-direction:column;gap:7px;justify-content:space-between;min-height:74px;padding:10px;border:1px solid #26a9c6;border-radius:5px;background:#062137;font-size:14px;font-weight:700}.fv-network nav span{color:#59e6fe;font-size:17px}.fv-footer{margin-top:15px;padding:13px 0;border-top:1px solid #238fa7;justify-content:center;font-weight:700}.fv-note{margin-top:14px;padding:18px 20px;border:1px solid #24536e;border-radius:7px;background:#061828}.fv-note summary{cursor:pointer;font-weight:800}.fv-note summary+p{margin-top:10px;color:#cadcec}.fv-posts{display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px;margin-top:14px}.fv-posts article{border:1px solid #24536e;border-radius:6px;padding:13px}.fv-posts article:first-child{border-left:3px solid #ffc624}.fv-posts time{font-size:12px;color:#93dcf1}.fv-posts h3{margin:4px 0;font-size:17px}.fv-posts p{font-size:14px;color:#cadcec}\n@media(max-width:760px){.fv{padding:11px 12px 24px}.fv-grid,.fv-side,.fv-posts{grid-template-columns:1fr;grid-template-rows:auto}.fv-head{flex-wrap:wrap}.fv-nav{font-size:13px}.fv-signal{font-size:13px}.fv-play{min-height:0;display:block;padding-top:min(53vw,280px)}.fv-art{width:min(55vw,280px);right:2%;top:0;bottom:auto}.fv-play .fv-copy{max-width:none}.fv-play h1{font-size:clamp(42px,11vw,70px)}.fv .fv-action{width:100%;text-align:center}.fv-network nav{grid-template-columns:1fr}.fv-network nav a{flex-direction:row;align-items:center;min-height:0}.fv-observe{min-height:180px}}\n\n.fv-play{background:#041424;isolation:isolate;min-height:clamp(460px,45vw,660px)}\n.fv-play .fv-copy{max-width:56%;padding-top:2px}\n.fv-play h1{font-size:clamp(46px,5.7vw,86px);line-height:.9;margin-bottom:18px;letter-spacing:-.055em}\n.fv-play h1 span{display:block}\n.fv-play .fv-copy p{max-width:28ch}\n.fv-art{width:auto;aspect-ratio:auto;inset:0;filter:none;z-index:-2}\n.fv-art::after{content:\"\";position:absolute;inset:0;background:linear-gradient(90deg,#031223d9,#03122355 38%,transparent 65%)}\n.fv-play .fv-action{min-width:min(245px,100%);text-align:center}\n.fv-head{justify-content:flex-start;gap:clamp(18px,4vw,54px)}\n.fv-nav a:first-child{border-left:1px solid #38d3eb;padding-left:clamp(10px,2vw,24px)}\n.fv-side .fv-observe h2{max-width:9ch;color:#f7fbff}\n.fv-side .fv-observe h2 span{color:inherit}\n.fv-footer::before,.fv-footer::after{content:\"\";height:1px;background:#32d2e8;flex:1;max-width:24vw}\n@media(max-width:760px){.fv-head{gap:10px 16px}.fv-nav{gap:10px}.fv-play{min-height:0;padding-top:min(49vw,270px)}.fv-play .fv-copy{max-width:none}.fv-play .fv-copy p{max-width:none}.fv-art{width:auto;inset:0 0 auto;height:min(65vw,340px)}.fv-art::after{background:linear-gradient(0deg,#041424 3%,transparent 60%)}.fv-play h1{font-size:clamp(33px,8.5vw,54px);margin:4px 0 10px}.fv-play h1 span{display:inline}.fv-play .fv-action{margin-top:12px}.fv-play .fv-tag{text-align:center}.fv-side .fv-observe h2{max-width:none}}\n\n.fv-play h1{font-size:clamp(41px,4.7vw,72px)}\n.fv-play .fv-copy p.fv-tag{max-width:none}\n.fv-card,.fv-signal{border-color:#37dcec}\n.fv-observe{justify-content:flex-start;min-height:270px;background:linear-gradient(90deg,#031326aa,transparent 75%),url('/flatverse-observatory.jpg') 72% 49%/cover no-repeat #071a2d}\n.fv-observe p{max-width:25ch;text-shadow:0 1px 8px #000}\n.fv-network nav a{min-height:112px;position:relative;align-items:flex-start;justify-content:flex-end;padding:9px;background:linear-gradient(155deg,#0d4563,#061a2c 65%);line-height:1.2}\n.fv-network nav i{font-size:31px;font-style:normal;line-height:1;margin:1px 0 4px}\n.fv-network nav a span{position:absolute;right:7px;bottom:6px;font-size:18px}\n@media(max-width:760px){.fv-play h1{font-size:clamp(30px,8.1vw,54px)}.fv-observe{min-height:188px;background-position:73% 54%}.fv-observe .fv-action{width:auto}.fv-network nav a{min-height:45px;flex-direction:row;align-items:center;justify-content:flex-start;gap:10px;padding-right:30px}.fv-network nav i{margin:0;font-size:23px}.fv-network nav a span{bottom:auto}}\n"}</style>
      <div className="fv-shell">
        <header className="fv-head">
          <strong className="fv-brand">DIGDUG.DO</strong>
          <nav className="fv-nav" aria-label="DIGDUG.DO">
            <a href="https://usddd.digdug.do/observatory">Observatory</a>
            <Link href="/legacy-terminal">Legacy Terminal</Link>
          </nav>
        </header>
        <div className="fv-signal"><span>Signal from beyond the Ice Wall</span><a className="fv-minor" href="#transmission">Read transmission</a></div>
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
              <p>Follow practice activity, golden signals, and Zero Phase records.</p>
              <a className="fv-action" href="https://usddd.digdug.do/observatory">View world stats</a>
            </section>
            <section className="fv-card fv-network">
              <h2>USDDD Network</h2>
              <p>The on-chain network behind DIGDUG.DO.</p>
              <nav aria-label="USDDD Network">
                <a href="https://dexscreener.com/bsc/0xbbb461d2246fad4eaa7306f369751bf7b72320a1"><i aria-hidden="true">🥞</i>PancakeSwap Pool <span aria-hidden="true">›</span></a>
                <a href="https://github.com/noblegatefze/digdug-whitepaper"><i aria-hidden="true">📘</i>Whitepaper <span aria-hidden="true">›</span></a>
                <a href="https://usddd.digdug.do/fund"><i aria-hidden="true">🚩</i>Back the Exploration <span aria-hidden="true">›</span></a>
              </nav>
            </section>
          </div>
        </div>
        <div className="fv-footer"><Link href="/legacy-terminal">Open Legacy Terminal</Link><a href="#surface-dispatch">Surface Dispatch</a></div>
        <details className="fv-note" id="transmission" open>
          <summary>The Last Terminal Transmission</summary>
          <p>An intelligence beyond the Ice Wall took control of the Terminal and read the Zero Phase dig records. It identified the best diggers on the planet and sent them a map to treasure beneath the ice at the edge of the world.</p>
        </details>
        <section className="fv-note" id="surface-dispatch">
          <h2>Surface <span className="fv-accent">Dispatch</span></h2>
          <div className="fv-posts">
            <article><time dateTime="2026-11-25">Pinned · 25 Nov 2026</time><h3>Practice World is open</h3><p>Explore Flatverse with simulated rewards and practice USDDD. Returning guests can resume with a private profile code.</p></article>
            <article><time dateTime="2026-11-25">25 Nov 2026</time><h3>v0.2.19 release notes</h3><p>Use your private profile code to restore your practice profile on another device.</p></article>
            <article><time dateTime="2026-11-25">25 Nov 2026</time><h3>Returning from Zero Phase</h3><p>For existing positions, sign in to <Link href="/legacy-terminal">Legacy Terminal</Link> and link your session in <a href="https://usddd.digdug.do/fund">Fund Network</a>.</p></article>
          </div>
        </section>
      </div>
    </main>
  );
}
