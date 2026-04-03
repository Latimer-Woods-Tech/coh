import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: 'easeOut' },
});

const STATIONS = [
  {
    num: '01',
    title: 'The Cipher Framework',
    desc: 'Before the blade touches skin, there is always the consultation. You set your intention. You learn what the cipher means — as code, as zero, as circle — and make a commitment to honesty over speed.',
    tools: ['Intention-Setting Exercise', 'Cipher Commitment Declaration'],
  },
  {
    num: '02',
    title: 'Roots of the Past',
    desc: 'You go back — not to suffer the past again, but to map it. Childhood wounds, family roles, attachment styles. Archaeological work: careful, patient, precise. Like the barber who studies the grain before making the first cut.',
    tools: ['Family System Map', 'Childhood Wounds Inventory', 'Attachment Style Assessment'],
  },
  {
    num: '03',
    title: 'Breaking the Code',
    desc: 'Awareness enters the present tense. You learn to recognize your trauma responses in daily life — the triggers that send you spiraling, the moments when you react instead of choose. You build your Trigger Tracker.',
    tools: ['Trigger Tracker', 'Awareness Journal', 'Trauma Response Map'],
  },
  {
    num: '04',
    title: 'Healing in Motion',
    desc: 'The restoration begins. Mind-body reset techniques. Cognitive reframing. The rewriting of beliefs that were never yours to begin with. You learn that healing is not a single event but a practice — a daily discipline of tenderness.',
    tools: ['Mind-Body Reset Protocol', 'Belief Rewriting Framework', 'Daily Healing Practice'],
  },
  {
    num: '05',
    title: 'Rebuilding Resilience',
    desc: 'The fresh cut needs maintenance. Resilience is not something you achieve; it is something you cultivate. You build the Boundaries Builder — the framework for protecting the person you are becoming.',
    tools: ['30-Day Resilience Tracker', 'Boundaries Builder', 'Daily Affirmation Practice'],
  },
  {
    num: '06',
    title: 'The Cipher of the Future',
    desc: 'You visualize the healed self. Not as fantasy but as destination. You write a Legacy Letter — declaring what you choose to pass down and what you choose to end. The cipher statement: who you are now.',
    tools: ['Healed Self Visualization', 'Legacy Letter', 'Cipher Statement Declaration'],
  },
];

const PILLARS = [
  { name: 'Awareness',     desc: 'You cannot heal what you cannot see' },
  { name: 'Understanding', desc: 'Healing requires context, not just compassion' },
  { name: 'Practice',      desc: 'Transformation is built in small, daily repetitions' },
  { name: 'Legacy',        desc: 'Your healing is not just for you — it echoes forward' },
];

export default function AcademyPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div>
      {/* Hero — Heritage Brown */}
      <section
        className="py-24 md:py-32 relative overflow-hidden"
        style={{ backgroundColor: '#2C1810' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 50%, transparent 28%, rgba(201,168,76,0.05) 28%, rgba(201,168,76,0.05) 28.5%, transparent 28.5%), radial-gradient(circle at 50% 50%, transparent 50%, rgba(201,168,76,0.03) 50%, rgba(201,168,76,0.03) 50.5%, transparent 50.5%)',
          }}
        />
        <div className="relative max-w-4xl mx-auto px-6 sm:px-10 text-center">
          <motion.p {...fade()} className="uppercase tracking-[0.25em] mb-6"
            style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '11px', color: '#C9A84C' }}
          >
            The Academy
          </motion.p>
          <motion.h1 {...fade(0.1)}
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              color: '#F5ECD7',
              fontSize: 'clamp(2rem, 6vw, 4rem)',
              lineHeight: 1.15,
            }}
          >
            The Cipher of Healing
          </motion.h1>
          <motion.p {...fade(0.2)}
            className="mt-3 italic"
            style={{
              fontFamily: '"Libre Baskerville", Georgia, serif',
              color: '#C9A84C',
              fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
            }}
          >
            Transforming Trauma into Resilience
          </motion.p>
          <motion.p {...fade(0.3)}
            className="mt-6 mx-auto"
            style={{
              fontFamily: '"Libre Baskerville", Georgia, serif',
              color: '#E8DCBE',
              fontSize: '16px',
              lineHeight: 1.85,
              maxWidth: '560px',
            }}
          >
            A 6-station self-paced journey that decodes the patterns of your past, inhabits the
            zero of the present, and restores the future you were always meant to live.
            12–18 hours. Built for real life.
          </motion.p>
          <motion.div {...fade(0.4)} className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/store" className="btn btn-primary" style={{ fontSize: '13px' }}>
              Enroll — $197
            </Link>
            <span style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#704214', fontSize: '12px' }}>
              6 stations · 12–18 hrs · Self-paced
            </span>
          </motion.div>
        </div>
      </section>

      {/* Pull quote — Parchment */}
      <section style={{ backgroundColor: '#E8DCBE' }} className="py-16">
        <div className="max-w-3xl mx-auto px-6 sm:px-10 text-center">
          <motion.div {...fade()} className="my-8 text-center" style={{ color: '#C9A84C', fontSize: '1.25rem' }}>◆</motion.div>
          <motion.blockquote {...fade(0.1)}>
            <p
              className="italic"
              style={{
                fontFamily: '"Libre Baskerville", Georgia, serif',
                color: '#2C1810',
                fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
                lineHeight: 1.8,
              }}
            >
              "A cipher is a code. A system of hidden knowledge that must be decoded to be
              understood. This course gives you both: the code to understand what happened, and
              the key to unlock the future you were meant to live."
            </p>
            <footer
              className="mt-5"
              style={{
                fontFamily: '"DM Sans", sans-serif',
                color: '#704214',
                fontSize: '12px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              — The Cipher of Healing
            </footer>
          </motion.blockquote>
          <motion.div {...fade(0.15)} className="mt-8 text-center" style={{ color: '#C9A84C', fontSize: '1.25rem' }}>◆</motion.div>
        </div>
      </section>

      {/* Six Stations — Ivory */}
      <section style={{ backgroundColor: '#F5ECD7' }} className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6 sm:px-10">
          <motion.div {...fade()} className="mb-4">
            <p
              className="uppercase tracking-[0.2em] mb-4"
              style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '11px', color: '#C9A84C' }}
            >
              The Six Stations of Restoration
            </p>
            <p
              style={{
                fontFamily: '"Libre Baskerville", Georgia, serif',
                color: '#704214',
                fontSize: '15px',
                lineHeight: 1.8,
              }}
            >
              We call them stations rather than modules — because a station is a place you arrive at,
              rest in, and depart from transformed.
            </p>
          </motion.div>

          <div className="mt-8 space-y-2">
            {STATIONS.map((s, i) => {
              const isOpen = open === s.num;
              return (
                <motion.div key={s.num} {...fade(i * 0.05)}>
                  <div
                    style={{
                      border: '1px solid',
                      borderColor: isOpen ? '#C9A84C' : '#8B5E3C',
                      borderRadius: '3px',
                      backgroundColor: isOpen ? '#2C1810' : 'transparent',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    <button
                      onClick={() => setOpen(isOpen ? null : s.num)}
                      className="w-full text-left flex items-center gap-5 px-6 py-5"
                    >
                      <span
                        style={{
                          fontFamily: '"IBM Plex Mono", Menlo, monospace',
                          fontSize: '13px',
                          color: '#C9A84C',
                          flexShrink: 0,
                          width: '2.2rem',
                        }}
                      >
                        {s.num}
                      </span>
                      <span
                        style={{
                          fontFamily: '"Playfair Display", Georgia, serif',
                          fontSize: '18px',
                          fontWeight: 700,
                          color: isOpen ? '#F5ECD7' : '#2C1810',
                          flex: 1,
                        }}
                      >
                        {s.title}
                      </span>
                      <span style={{ color: '#C9A84C', fontSize: '20px', flexShrink: 0 }}>
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>

                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="px-6 pb-7"
                        style={{ borderTop: '1px solid rgba(201,168,76,0.2)' }}
                      >
                        <p
                          className="mt-5 mb-5"
                          style={{
                            fontFamily: '"Libre Baskerville", Georgia, serif',
                            color: '#E8DCBE',
                            fontSize: '15px',
                            lineHeight: 1.85,
                          }}
                        >
                          {s.desc}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {s.tools.map((t) => (
                            <span
                              key={t}
                              style={{
                                fontFamily: '"DM Sans", sans-serif',
                                fontSize: '11px',
                                color: '#C9A84C',
                                border: '1px solid rgba(201,168,76,0.35)',
                                borderRadius: '2px',
                                padding: '3px 10px',
                                letterSpacing: '0.06em',
                              }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Four Pillars — Heritage Brown */}
      <section style={{ backgroundColor: '#2C1810' }} className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6 sm:px-10">
          <motion.p {...fade()} className="text-center uppercase tracking-[0.25em] mb-12"
            style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '11px', color: '#C9A84C' }}
          >
            The Four Pillars
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {PILLARS.map((p, i) => (
              <motion.div key={p.name} {...fade(i * 0.08)} className="text-center">
                <div style={{ color: '#C9A84C', fontSize: '1.5rem', marginBottom: '0.75rem' }}>◆</div>
                <h3
                  style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    color: '#F5ECD7',
                    fontSize: '18px',
                    marginBottom: '0.5rem',
                  }}
                >
                  {p.name}
                </h3>
                <p
                  style={{
                    fontFamily: '"Libre Baskerville", Georgia, serif',
                    color: '#8B5E3C',
                    fontSize: '13px',
                    lineHeight: 1.7,
                    fontStyle: 'italic',
                  }}
                >
                  {p.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — Parchment */}
      <section style={{ backgroundColor: '#E8DCBE' }} className="py-20 text-center">
        <div className="max-w-xl mx-auto px-6">
          <motion.p {...fade()} className="uppercase tracking-[0.25em] mb-4"
            style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '11px', color: '#C9A84C' }}
          >
            The cipher is open
          </motion.p>
          <motion.h2 {...fade(0.1)}
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              color: '#2C1810',
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              lineHeight: 1.2,
            }}
          >
            Step in.
          </motion.h2>
          <motion.p {...fade(0.2)}
            className="mt-4 italic mb-8"
            style={{
              fontFamily: '"Libre Baskerville", Georgia, serif',
              color: '#704214',
              fontSize: '16px',
              lineHeight: 1.8,
            }}
          >
            Once you are in the cipher, you are held. And what is held can heal.
          </motion.p>
          <motion.div {...fade(0.3)}>
            <Link to="/store" className="btn btn-primary" style={{ fontSize: '13px' }}>
              Enroll Now — $197
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
