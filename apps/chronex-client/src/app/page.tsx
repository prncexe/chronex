'use client'

import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring } from 'motion/react'
import Link from 'next/link'
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  ImagePlus,
  Layers3,
  ShieldCheck,
  Waypoints,
} from 'lucide-react'
import Image from 'next/image'
// ─── Magnetic Button ──────────────────────────────────────────────────────────
type MagneticButtonProps = {
  children: ReactNode
  className?: string
  href?: string
} & Omit<ComponentPropsWithoutRef<typeof motion.button>, 'children' | 'className'> &
  Omit<ComponentPropsWithoutRef<typeof motion.a>, 'children' | 'className' | 'href'>

function MagneticButton({ children, className, href, ...props }: MagneticButtonProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 300, damping: 20 })
  const sy = useSpring(y, { stiffness: 300, damping: 20 })

  const handleMouse = (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    if (!rect) return
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    x.set((e.clientX - cx) * 0.35)
    y.set((e.clientY - cy) * 0.35)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }

  if (href) {
    return (
      <motion.a
        href={href}
        style={{ x: sx, y: sy }}
        onMouseMove={handleMouse}
        onMouseLeave={reset}
        className={className}
        {...props}
      >
        {children}
      </motion.a>
    )
  }

  return (
    <motion.button
      style={{ x: sx, y: sy }}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function Counter({ to, suffix = '' }: { to: number | string; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement | null>(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView || typeof to !== 'number') return
    let start = 0
    const step = () => {
      start += Math.ceil((to - start) / 6)
      if (start >= to) {
        setVal(to)
        return
      }
      setVal(start)
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, to])
  return <span ref={ref}>{typeof to === 'number' ? val + suffix : to}</span>
}

// ─── Section reveal ───────────────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Noise grain overlay ──────────────────────────────────────────────────────
const NoiseOverlay = () => (
  <svg
    className="pointer-events-none fixed inset-0 z-100 h-full w-full opacity-[0.03]"
    style={{ mixBlendMode: 'screen' }}
  >
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#noise)" />
  </svg>
)

// ─── Workflow steps ───────────────────────────────────────────────────────────
const workflow = [
  {
    title: 'Connect surfaces',
    desc: 'Instagram, Threads, LinkedIn, Slack, Discord — one auth flow.',
    icon: ShieldCheck,
    n: '01',
  },
  {
    title: 'Assemble payloads',
    desc: 'Upload once, adapt per platform with rule-aware controls.',
    icon: ImagePlus,
    n: '02',
  },
  {
    title: 'Queue & monitor',
    desc: 'Schedule, fan out via worker, watch states in one board.',
    icon: Clock3,
    n: '03',
  },
]

const platforms = ['Instagram', 'Threads', 'LinkedIn', 'Slack', 'Discord']

// ─── Status dot ───────────────────────────────────────────────────────────────
const states = {
  complete: 'text-emerald-400 bg-emerald-400/10',
  running: 'text-cyan-400 bg-cyan-400/10',
  pending: 'text-white/40 bg-white/5',
} as const
const statusEvents = [
  { t: '09:00', e: 'Assets validated', s: 'complete' },
  { t: '09:15', e: 'Worker queued jobs', s: 'running' },
  { t: '10:00', e: 'Instagram delivered', s: 'complete' },
  { t: '10:05', e: 'LinkedIn scheduled', s: 'pending' },
] as const

export default function HomePage() {
  const heroRef = useRef<HTMLElement | null>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#050911] font-['DM_Sans',system-ui] text-white selection:bg-cyan-400/30">
      <NoiseOverlay />

      {/* ── Google font load ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,300&family=Bebas+Neue&display=swap');
        .font-bebas { font-family: 'Bebas Neue', sans-serif; }
        .cursor-glow { cursor: none; }
      `}</style>

      {/* ── Ambient blobs ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -left-32 h-175 w-175 rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.12)_0%,transparent_70%)]"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute top-1/3 -right-48 h-150 w-150 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.10)_0%,transparent_70%)]"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
          className="absolute bottom-0 left-1/2 h-125 w-125 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.07)_0%,transparent_70%)]"
        />
      </div>

      {/* ═══════════════════════ NAV ═════════════════════════ */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-50 mx-auto flex max-w-7xl items-center justify-between px-6 py-7 lg:px-10"
      >
        <Link href="/" className="group flex items-center gap-1">
          <Image
            src="/logo.png"
            alt="Chronex logo"
            width={50}
            height={50}
            priority
            className="h-full w-full object-contain"
          />
          <span className="font-bebas text-2xl tracking-widest text-white">CHRONEX</span>
        </Link>

        {/* <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/4 px-2 py-2 backdrop-blur md:flex">
          {['Features', 'Platforms', 'Studio'].map((item) => (
            <motion.a
              key={item}
              href="#"
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
              className="rounded-full px-5 py-2 text-sm text-white/60 transition-colors hover:text-white"
            >
              {item}
            </motion.a>
          ))}
        </nav> */}

        <div className="flex items-center gap-3">
          <motion.a
            href="/login"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="hidden text-sm text-white/50 transition-colors hover:text-white md:block"
          >
            Log in
          </motion.a>
          <MagneticButton
            href="/post/createPost"
            className="group relative overflow-hidden rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-medium text-slate-950 transition-all hover:bg-cyan-300"
          >
            <motion.span className="absolute inset-0 origin-left scale-x-0 bg-white/20 transition-transform duration-300 group-hover:scale-x-100" />
            <span className="relative flex items-center gap-1.5">
              Open studio <ArrowUpRight className="size-4" />
            </span>
          </MagneticButton>
        </div>
      </motion.header>

      {/* ═══════════════════════ HERO ═════════════════════════ */}
      <section ref={heroRef} className="relative z-10 min-h-screen">
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="mx-auto max-w-7xl px-6 pt-8 lg:px-10"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/8 px-4 py-2 text-xs tracking-widest text-cyan-300 uppercase"
          >
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-1.5 w-1.5 rounded-full bg-cyan-400"
            />
            Publish mission control · 5 platforms
          </motion.div>

          {/* Headline */}
          <div className="overflow-hidden">
            {['Schedule once.', 'Publish everywhere.'].map((line, i) => (
              <motion.h1
                key={line}
                initial={{ y: '110%' }}
                animate={{ y: '0%' }}
                transition={{ delay: 0.3 + i * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className={`font-bebas leading-none tracking-wider ${i === 0 ? 'text-[clamp(5rem,14vw,14rem)] text-white' : 'text-[clamp(5rem,14vw,14rem)] text-cyan-400'}`}
              >
                {line}
              </motion.h1>
            ))}
          </div>

          <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-start">
            {/* Left col */}
            <div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-lg text-lg leading-relaxed text-white/50"
              >
                A workspace-based publishing system for teams. Connected platforms, reusable media,
                platform-aware composition, and a queue that keeps releases visible from draft to
                live.
              </motion.p>

              {/* Platform pills */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-8 flex flex-wrap gap-2"
              >
                {platforms.map((p, i) => (
                  <motion.span
                    key={p}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.85 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{
                      y: -2,
                      borderColor: 'rgba(6,182,212,0.4)',
                      color: 'rgba(255,255,255,0.9)',
                    }}
                    className="cursor-default rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-white/50 transition-colors"
                  >
                    {p}
                  </motion.span>
                ))}
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.95, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="mt-10 flex flex-wrap gap-4"
              >
                <MagneticButton
                  href="/post/createPost"
                  className="group flex items-center gap-2 rounded-full bg-cyan-400 px-7 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_0_40px_rgba(6,182,212,0.35)] transition-all hover:bg-cyan-300 hover:shadow-[0_0_60px_rgba(6,182,212,0.45)]"
                >
                  Start scheduling{' '}
                  <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </MagneticButton>
                <motion.a
                  href="/tokens"
                  whileHover={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-7 py-3.5 text-sm text-white/60 transition-colors"
                >
                  Connect platforms
                </motion.a>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="mt-12 flex items-center gap-8 border-t border-white/8 pt-8"
              >
                {[
                  { val: 5, suffix: '', label: 'Platforms' },
                  { val: 1, suffix: '', label: 'Unified flow' },
                  { val: '↑', label: 'Worker-driven' },
                ].map((s, i) => (
                  <div key={i}>
                    <p className="font-bebas text-4xl tracking-wider text-cyan-400">
                      {typeof s.val === 'number' ? <Counter to={s.val} suffix={s.suffix} /> : s.val}
                    </p>
                    <p className="mt-1 text-xs tracking-widest text-white/35 uppercase">
                      {s.label}
                    </p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right col — dashboard card */}
            <motion.div
              initial={{ opacity: 0, x: 40, rotateY: 8 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              style={{ perspective: 1000 }}
              className="relative"
            >
              {/* Glow behind card */}
              <div className="absolute -inset-px rounded-3xl bg-linear-to-br from-cyan-400/20 via-transparent to-indigo-500/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#080e1a] shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
                {/* Card header */}
                <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
                  <div>
                    <p className="text-[10px] tracking-[0.3em] text-white/35 uppercase">
                      Campaign cockpit
                    </p>
                    <p className="mt-1 text-lg font-semibold text-white">Product launch wave</p>
                  </div>
                  <motion.div
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/8 px-3 py-1.5 text-[10px] tracking-widest text-emerald-400 uppercase"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Queue healthy
                  </motion.div>
                </div>

                <div className="grid gap-px bg-white/4 p-px sm:grid-cols-2">
                  {/* Platform payloads */}
                  <div className="bg-[#080e1a] p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-[10px] tracking-[0.3em] text-white/35 uppercase">
                        Payloads
                      </p>
                      <Layers3 className="size-4 text-white/20" />
                    </div>
                    <div className="space-y-2">
                      {[
                        ['Instagram', 'Carousel · 4'],
                        ['LinkedIn', 'Multi · 6 slides'],
                        ['Discord', 'Embed + CTA'],
                        ['Slack', '#release-notes'],
                      ].map(([name, val], i) => (
                        <motion.div
                          key={name}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1 + i * 0.08 }}
                          whileHover={{ x: 3, borderColor: 'rgba(6,182,212,0.2)' }}
                          className="flex items-center justify-between rounded-xl border border-white/6 bg-white/3 px-3 py-2.5 transition-all"
                        >
                          <span className="text-sm text-white/70">{name}</span>
                          <span className="text-xs text-cyan-400/80">{val}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Status stream */}
                  <div className="bg-[#080e1a] p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-[10px] tracking-[0.3em] text-white/35 uppercase">
                        Status stream
                      </p>
                      <CheckCircle2 className="size-4 text-white/20" />
                    </div>
                    <div className="space-y-2">
                      {statusEvents.map(({ t, e, s }, i) => (
                        <motion.div
                          key={t}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.1 + i * 0.1 }}
                          className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/3 px-3 py-2.5"
                        >
                          <span className="w-10 shrink-0 text-[10px] text-white/30">{t}</span>
                          <span className="flex-1 truncate text-xs text-white/65">{e}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] tracking-widest uppercase ${states[s]}`}
                          >
                            {s}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Worker sync badge */}
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -right-4 -bottom-4 rounded-2xl border border-white/10 bg-[#080e1a] px-4 py-3 shadow-xl"
                >
                  <p className="text-[9px] tracking-widest text-white/35 uppercase">Worker sync</p>
                  <p className="mt-1 text-xs text-white/75">Queue connected · ready</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════ WORKFLOW ═════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-28 lg:px-10">
        <Reveal className="mb-16 flex items-end justify-between gap-8">
          <div>
            <p className="mb-3 text-[10px] tracking-[0.4em] text-cyan-400/70 uppercase">
              How it works
            </p>
            <h2 className="font-bebas text-[clamp(3rem,8vw,7rem)] leading-none tracking-wider text-white">
              Three moves.
              <br />
              <span className="text-white/25">That&apos;s the whole flow.</span>
            </h2>
          </div>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3">
          {workflow.map(({ title, desc, icon: Icon, n }, i) => (
            <Reveal key={title} delay={i * 0.12}>
              <motion.div
                whileHover={{ y: -8, borderColor: 'rgba(6,182,212,0.25)' }}
                className="group relative overflow-hidden rounded-3xl border border-white/8 bg-white/3 p-7 transition-all duration-300"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(6,182,212,0.06),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative">
                  <div className="mb-6 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400 ring-1 ring-cyan-400/20 transition-all group-hover:bg-cyan-400 group-hover:text-slate-950">
                      <Icon className="size-5" />
                    </div>
                    <span className="font-bebas text-5xl tracking-wider text-white/8 transition-colors group-hover:text-white/12">
                      {n}
                    </span>
                  </div>
                  <h3 className="mb-3 text-lg font-semibold text-white">{title}</h3>
                  <p className="text-sm leading-7 text-white/45">{desc}</p>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════════════ FEATURES GRID ═════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-28 lg:px-10">
        <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
          {/* Big left */}
          <Reveal className="lg:col-span-2 lg:row-span-2">
            <motion.div
              whileHover={{ borderColor: 'rgba(6,182,212,0.2)' }}
              className="h-full overflow-hidden rounded-3xl border border-white/8 bg-white/3 p-8 transition-all"
            >
              <p className="mb-4 text-[10px] tracking-[0.4em] text-cyan-400/70 uppercase">
                Why Chronex exists
              </p>
              <h2 className="font-bebas text-[clamp(2.5rem,5vw,4.5rem)] leading-none tracking-wider text-white">
                Not a generic
                <br />
                <span className="text-white/25">dashboard.</span>
              </h2>
              <p className="mt-6 max-w-lg text-base leading-8 text-white/45">
                Built around real publishing operations: auth tokens per workspace,
                platform-specific media rules, upload storage, scheduled jobs, and live status
                feedback after worker execution.
              </p>

              <div className="mt-10 grid grid-cols-2 gap-3">
                {[
                  'Workspace-aware connections',
                  'Media validation pre-publish',
                  'Per-platform config',
                  'Worker-driven queue',
                ].map((feat, i) => (
                  <motion.div
                    key={feat}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/3 px-4 py-3 text-sm text-white/55"
                  >
                    <CheckCircle2 className="size-4 shrink-0 text-cyan-400/60" />
                    {feat}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </Reveal>

          {/* Top right */}
          <Reveal delay={0.1}>
            <motion.div
              whileHover={{ borderColor: 'rgba(99,102,241,0.3)', y: -4 }}
              className="rounded-3xl border border-white/8 bg-white/3 p-7 transition-all"
            >
              <Waypoints className="mb-5 size-8 text-indigo-400/60" />
              <p className="text-lg font-semibold text-white">Multi-surface fanout</p>
              <p className="mt-2 text-sm leading-7 text-white/40">
                One publish action fans out to every connected surface through the worker queue.
              </p>
            </motion.div>
          </Reveal>

          {/* Bottom right */}
          <Reveal delay={0.2}>
            <motion.div
              whileHover={{ borderColor: 'rgba(6,182,212,0.3)', y: -4 }}
              className="rounded-3xl border border-white/8 bg-white/3 p-7 transition-all"
            >
              <Clock3 className="mb-5 size-8 text-cyan-400/60" />
              <p className="text-lg font-semibold text-white">Scheduled execution</p>
              <p className="mt-2 text-sm leading-7 text-white/40">
                Set time, let the worker handle delivery. Track pending, running, and failed states
                live.
              </p>
            </motion.div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════ CTA ═════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-32 lg:px-10">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] border border-cyan-400/15 bg-[linear-gradient(135deg,rgba(6,182,212,0.1)_0%,rgba(8,14,26,0.8)_50%,rgba(99,102,241,0.08)_100%)] p-12 lg:p-16">
            {/* animated bg line */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
              className="absolute inset-y-0 w-32 -skew-x-12 bg-linear-to-r from-transparent via-cyan-400/10 to-transparent"
            />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="mb-4 text-[10px] tracking-[0.4em] text-cyan-400/70 uppercase">
                  Make the first click count
                </p>
                <h2 className="font-bebas text-[clamp(3rem,7vw,6rem)] leading-none tracking-wider text-white">
                  Connect. Upload.
                  <br />
                  Build. Release.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-8 text-white/45">
                  That&apos;s the entire loop. One coordinated release across every platform you
                  care about.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <MagneticButton
                  href="/post/createPost"
                  className="group flex items-center justify-center gap-2 rounded-full bg-cyan-400 px-8 py-4 text-sm font-semibold text-slate-950 shadow-[0_0_50px_rgba(6,182,212,0.4)] transition-all hover:bg-cyan-300 hover:shadow-[0_0_70px_rgba(6,182,212,0.5)]"
                >
                  Launch the studio{' '}
                  <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </MagneticButton>
                <motion.a
                  href="/post"
                  whileHover={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/4 px-8 py-4 text-sm text-white/50 transition-colors"
                >
                  View post history
                </motion.a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════ FOOTER ═════════════════════════ */}
      <footer className="relative z-10 border-t border-white/6 px-6 py-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Chronex logo"
              width={50}
              height={50}
              className="h-full w-full object-contain opacity-80"
            />
            <span className="font-bebas text-xl tracking-widest text-white/30">CHRONEX</span>
          </div>
          <p className="text-xs text-white/20">Publish mission control</p>
        </div>
      </footer>
    </main>
  )
}
