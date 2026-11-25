import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "DIGDUG.DO | Enter Flatverse" };

export default function FlatverseHome() {
  return (
    <main className="min-h-screen bg-[#080f1b] text-slate-100">
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-10 sm:py-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-sky-300/20 pb-5">
          <strong className="font-mono tracking-widest text-sky-200">DIGDUG.DO</strong>
          <nav aria-label="DIGDUG.DO" className="flex flex-wrap gap-4 text-sm text-sky-200 underline">
            <a href="#surface-dispatch">Surface Dispatch</a>
            <Link href="/legacy-terminal">Legacy Terminal</Link>
          </nav>
        </header>
        <section className="relative mt-6 grid items-center overflow-hidden rounded-3xl border border-sky-300/30 bg-gradient-to-br from-[#183858] via-[#101c32] to-[#080f1b] sm:grid-cols-[1.2fr_1fr]">
          <div className="z-10 p-7 sm:p-12">
            <p className="font-mono text-xs tracking-widest text-sky-200">PRACTICE WORLD · SIMULATED REWARDS</p>
            <h1 className="mt-3 text-5xl font-bold tracking-tighter sm:text-7xl">Enter Flatverse</h1>
            <p className="mt-4 max-w-md text-lg text-slate-300">Take your shovel beyond the Ice Wall. Dig beneath one continuous world and bring buried finds back to the surface.</p>
            <a className="mt-6 inline-block rounded-lg bg-amber-300 px-5 py-3 font-semibold text-slate-950" href="https://play.digdug.do/">Play or resume</a>
            <p className="mt-3 text-sm text-slate-300">Choose a digger name in the game or resume with your private profile code.</p>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-[440px]">
            <Image src="/maintenance/digster.png" alt="The DIGDUG.DO explorer" fill priority sizes="(max-width: 640px) 90vw, 440px" className="object-contain" />
          </div>
        </section>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <section className="rounded-2xl border border-sky-300/20 bg-[#10243a] p-6">
            <h2 className="text-2xl font-semibold">Flatverse Observatory</h2>
            <p className="mt-2 text-slate-300">Follow the diggers, spot golden signals, and explore the Zero Phase records.</p>
            <a className="mt-4 inline-block text-sky-200 underline" href="https://usddd.digdug.do/observatory">Open Observatory</a>
          </section>
          <section className="rounded-2xl border border-sky-300/20 bg-[#10243a] p-6">
            <h2 className="text-2xl font-semibold">USDDD Network</h2>
            <nav aria-label="USDDD Network" className="mt-4 flex flex-wrap gap-4 text-sky-200 underline">
              <a href="https://dexscreener.com/bsc/0xbbb461d2246fad4eaa7306f369751bf7b72320a1">PancakeSwap V2 · USDDD/USDT</a>
              <a href="https://github.com/noblegatefze/digdug-whitepaper">Read the whitepaper</a>
              <a href="https://usddd.digdug.do/fund">Back the Exploration</a>
            </nav>
          </section>
        </div>
        <section className="mt-6 rounded-2xl border border-sky-300/20 p-6">
          <p className="font-mono text-sm text-sky-200">INCOMING TRANSMISSION · ZERO PHASE RECORDS RECEIVED</p>
          <details className="mt-3">
            <summary className="cursor-pointer font-semibold">The Last Terminal Transmission</summary>
            <p className="mt-3 max-w-2xl text-slate-300">An intelligence beyond the Ice Wall took control of the Terminal and read the Zero Phase dig records. It identified the best diggers on the planet and sent them a map. Buried beneath the ice at the edge of the world, something was waiting to be brought to the surface.</p>
          </details>
        </section>
        <section id="surface-dispatch" className="mt-6 scroll-mt-6 rounded-2xl border border-sky-300/20 bg-[#10243a] p-6">
          <h2 className="text-2xl font-semibold">Surface Dispatch</h2>
          <article className="mt-4 rounded-lg border-l-4 border-amber-300 bg-[#0b1a2c] p-4">
            <p className="font-mono text-xs text-amber-200">PINNED · <time dateTime="2026-11-25">25 Nov 2026</time></p>
            <h3 className="mt-2 font-semibold">Practice World is open</h3>
            <p className="mt-2 text-slate-300">Explore Flatverse with simulated rewards and practice USDDD. Returning guests can resume with their private profile code.</p>
          </article>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <article className="rounded-lg border border-sky-300/20 p-4">
              <time className="text-xs text-sky-200" dateTime="2026-11-25">25 Nov 2026</time>
              <h3 className="mt-1 font-semibold">v0.2.19 release notes</h3>
              <p className="mt-2 text-sm text-slate-300">The game now supports restoring a practice profile on another device using its private profile code.</p>
            </article>
            <article className="rounded-lg border border-sky-300/20 p-4">
              <time className="text-xs text-sky-200" dateTime="2026-11-25">25 Nov 2026</time>
              <h3 className="mt-1 font-semibold">Returning from Zero Phase</h3>
              <p className="mt-2 text-sm text-slate-300">Start fresh in Flatverse. For existing Fund positions, sign in through <Link className="underline" href="/legacy-terminal">Legacy Terminal</Link> and link your session in <a className="underline" href="https://usddd.digdug.do/fund">Fund Network</a>.</p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
