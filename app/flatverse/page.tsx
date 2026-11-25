import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "DIGDUG.DO | Enter Flatverse" };

export default function FlatverseHome() {
  return (
    <main className="min-h-screen bg-[#080f1b] text-slate-100">
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-10 sm:py-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-sky-300/20 pb-5">
          <strong className="font-mono tracking-widest text-sky-200">DIGDUG.DO</strong>
          <Link className="text-sm text-sky-200 underline" href="/legacy-terminal">Legacy Terminal</Link>
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
      </div>
    </main>
  );
}
