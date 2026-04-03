import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// ——— Reusable pieces ———

const GoldRule = () => (
  <div className="gold-rule my-10 text-lg tracking-[0.4em]">◆</div>
);

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7, delay, ease: 'easeOut' },
});

// ——— Movement 1: The Threshold ———
function Threshold() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#2C1810' }}
    >
      {/* Sepia vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(44,24,16,0.2) 0%, rgba(44,24,16,0.85) 100%)',
        }}
      />

      {/* Aaron Douglas concentric circles — decorative bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, transparent 18%, rgba(201,168,76,0.06) 18%, rgba(201,168,76,0.06) 18.5%, transparent 18.5%), radial-gradient(circle at 50% 50%, transparent 32%, rgba(201,168,76,0.04) 32%, rgba(201,168,76,0.04) 32.5%, transparent 32.5%), radial-gradient(circle at 50% 50%, transparent 48%, rgba(201,168,76,0.025) 48%, rgba(201,168,76,0.025) 48.5%, transparent 48.5%)',
          backgroundSize: '100% 100%',
        }}
      />

      <div className="relative z-10 text-center max-w-4xl mx-auto px-6 sm:px-10">
        <motion.div {...fade(0)}>
          <p
            className="uppercase tracking-[0.25em] mb-8"
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '11px',
              color: '#C9A84C',
            }}
          >
            CypherOfHealing · Est. 2026
          </p>
        </motion.div>

        <motion.h1
          {...fade(0.1)}
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            color: '#F5ECD7',
            fontSize: 'clamp(2.4rem, 7vw, 5.5rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
          }}
        >
          The outer is a reflection<br />
          <em style={{ color: '#C9A84C' }}>of the inner.</em>
        </motion.h1>

        <motion.p
          {...fade(0.22)}
          style={{
            fontFamily: '"Libre Baskerville", Georgia, serif',
            fontStyle: 'italic',
            color: '#E8DCBE',
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            lineHeight: 1.75,
            maxWidth: '560px',
            margin: '1.75rem auto 0',
          }}
        >
          Step into the space where craft meets restoration, and leave carrying
          something you didn't know you were missing.
        </motion.p>

        <motion.div {...fade(0.34)} className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/booking" className="btn btn-primary" style={{ fontSize: '13px' }}>
            Begin Your Session
          </Link>
          <Link
            to="/academy"
            className="btn"
            style={{
              background: 'transparent',
              border: '1px solid rgba(201,168,76,0.5)',
              color: '#E8DCBE',
              fontSize: '13px',
            }}
          >
            Enter the Academy
          </Link>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          {...fade(0.5)}
          className="mt-20 flex flex-col items-center gap-2"
          style={{ color: '#4A2C0E' }}
        >
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '10px',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
            }}
          >
            scroll
          </div>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            ↓
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ——— Movement 2: The Lineage ———
function Lineage() {
  const streams = [
    {
      label: 'The Chair',
      path: '/booking',
      desc: 'Precision work attended to with care — and a conversation that goes wherever it needs to go.',
      num: 'I',
    },
    {
      label: 'The Vault',
      path: '/store',
      desc: 'Restoration oils, books, journals. Extensions of the healing, not retail products.',
      num: 'II',
    },
    {
      label: 'The Academy',
      path: '/academy',
      desc: 'The Cipher of Healing — six stations, one journey, the code of your life decoded.',
      num: 'III',
    },
    {
      label: 'The Stage',
      path: '/events',
      desc: 'The Open Cipher — live webinars and workshops. The circle, open.',
      num: 'IV',
    },
    {
      label: 'The Inner Circle',
      path: '/events',
      desc: 'Quarterly gatherings and the retreat at The Factory. The cipher, sustained.',
      num: 'V',
    },
  ];

  return (
    <section style={{ backgroundColor: '#F5ECD7' }} className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6 sm:px-10">

        <motion.div {...fade()} className="max-w-2xl mb-16">
          <p
            className="uppercase tracking-[0.2em] mb-5"
            style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '11px', color: '#C9A84C' }}
          >
            The Lineage
          </p>
          <h2
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              color: '#2C1810',
              fontSize: 'clamp(1.8rem, 4vw, 3rem)',
              lineHeight: 1.2,
            }}
          >
            Before the barber was a barber,<br />
            <em>he was a healer.</em>
          </h2>
          <p
            className="mt-5"
            style={{
              fontFamily: '"Libre Baskerville", Georgia, serif',
              color: '#704214',
              fontSize: '16px',
              lineHeight: 1.85,
            }}
          >
            For centuries, the man with steady hands and a blade was the most accessible healer
            the common person would ever know. The barbershop carried that lineage through slavery,
            through Jim Crow, through the civil rights movement. CypherOfHealing honors that
            tradition. We decode what needs healing. We restore what was always there.
          </p>
        </motion.div>

        <GoldRule />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-12">
          {streams.map((s, i) => (
            <motion.div key={s.label} {...fade(i * 0.08)}>
              <Link to={s.path} className="block h-full group">
                <div
                  className="h-full p-6 transition-all duration-300"
                  style={{
                    backgroundColor: '#E8DCBE',
                    border: '1px solid #8B5E3C',
                    borderRadius: '3px',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#2C1810';
                    (e.currentTarget as HTMLElement).style.borderColor = '#C9A84C';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#E8DCBE';
                    (e.currentTarget as HTMLElement).style.borderColor = '#8B5E3C';
                  }}
                >
                  <div
                    className="mb-3"
                    style={{
                      fontFamily: '"IBM Plex Mono", Menlo, monospace',
                      fontSize: '11px',
                      color: '#C9A84C',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {s.num}
                  </div>
                  <h3
                    className="mb-2 group-hover:text-gold-DEFAULT transition-colors"
                    style={{
                      fontFamily: '"Playfair Display", Georgia, serif',
                      fontSize: '16px',
                      fontWeight: 700,
                      color: 'inherit',
                    }}
                  >
                    {s.label}
                  </h3>
                  <p
                    style={{
                      fontFamily: '"Libre Baskerville", Georgia, serif',
                      fontSize: '12px',
                      lineHeight: 1.7,
                      color: 'inherit',
                      opacity: 0.75,
                    }}
                  >
                    {s.desc}
                  </p>
                  <div
                    className="mt-4"
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: '11px',
                      letterSpacing: '0.1em',
                      color: '#C9A84C',
                      textTransform: 'uppercase',
                    }}
                  >
                    Explore →
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ——— Movement 3: The Craft ———
function TheCraft() {
  // Placeholder cards — in production replace with real barbershop photography
  const shots = [
    { label: 'The Consultation', sub: 'Before the blade — the conversation' },
    { label: 'The Fade',         sub: 'Precision is care made visible' },
    { label: 'The Line-Up',      sub: 'Edges sharp enough to declare intention' },
    { label: 'The Restoration',  sub: 'Oil, blade, and steady hands' },
  ];

  return (
    <section style={{ backgroundColor: '#2C1810' }} className="py-24 md:py-32 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 sm:px-10">
        <motion.div {...fade()} className="mb-12">
          <p
            className="uppercase tracking-[0.2em] mb-4"
            style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '11px', color: '#C9A84C' }}
          >
            The Craft
          </p>
          <h2
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              color: '#F5ECD7',
              fontSize: 'clamp(1.8rem, 4vw, 3rem)',
              lineHeight: 1.2,
            }}
          >
            Every session is a restoration.
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {shots.map((s, i) => (
            <motion.div key={s.label} {...fade(i * 0.1)}>
              <div
                className="relative overflow-hidden"
                style={{ aspectRatio: '3/4', borderRadius: '3px' }}
              >
                {/* Placeholder sepia panel — replace with <img className="parks-img"> */}
                <div
                  className="absolute inset-0 flex flex-col justify-end p-4"
                  style={{
                    background:
                      'linear-gradient(160deg, #3D2B1F 0%, #1A0E09 55%, #2C1810 100%)',
                    border: '1px solid rgba(201,168,76,0.15)',
                  }}
                >
                  {/* Vintage grain overlay */}
                  <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                      backgroundImage:
                        'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
                    }}
                  />
                  {/* Vignette */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'radial-gradient(ellipse at center, transparent 40%, rgba(26,14,9,0.7) 100%)',
                    }}
                  />
                  <div className="relative z-10">
                    <div
                      style={{
                        fontFamily: '"Playfair Display", Georgia, serif',
                        color: '#F5ECD7',
                        fontSize: '13px',
                        fontWeight: 700,
                      }}
                    >
                      {s.label}
                    </div>
                    <div
                      style={{
                        fontFamily: '"Libre Baskerville", Georgia, serif',
                        fontStyle: 'italic',
                        color: '#8B5E3C',
                        fontSize: '11px',
                        marginTop: '3px',
                      }}
                    >
                      {s.sub}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div {...fade(0.3)} className="mt-12 text-center">
          <Link
            to="/booking"
            className="btn"
            style={{
              border: '1px solid rgba(201,168,76,0.5)',
              color: '#C9A84C',
              background: 'transparent',
              fontSize: '13px',
            }}
          >
            Book Your Session
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ——— Movement 4: The Knowledge ———
function TheKnowledge() {
  const stations = [
    ['01', 'The Cipher Framework'],
    ['02', 'Roots of the Past'],
    ['03', 'Breaking the Code'],
    ['04', 'Healing in Motion'],
    ['05', 'Rebuilding Resilience'],
    ['06', 'The Cipher of the Future'],
  ];

  return (
    <section style={{ backgroundColor: '#E8DCBE' }} className="py-24 md:py-32 relative overflow-hidden">
      {/* Aaron Douglas pattern */}
      <div className="absolute inset-0 pattern-circles pointer-events-none" aria-hidden />

      <div className="relative max-w-6xl mx-auto px-6 sm:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* Left: course info */}
          <motion.div {...fade()}>
            <p
              className="uppercase tracking-[0.2em] mb-5"
              style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '11px', color: '#C9A84C' }}
            >
              The Academy
            </p>
            <h2
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                color: '#2C1810',
                fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                lineHeight: 1.2,
              }}
            >
              The Cipher of Healing:<br />
              <em>Transforming Trauma into Resilience</em>
            </h2>

            <p
              className="mt-5"
              style={{
                fontFamily: '"Libre Baskerville", Georgia, serif',
                color: '#704214',
                fontSize: '16px',
                lineHeight: 1.85,
              }}
            >
              Six stations. One journey. The code of your life, decoded. A self-paced, 12–18 hour
              structured methodology for interrupting inherited patterns and becoming the first
              fully healed version of your lineage.
            </p>

            <div className="mt-8">
              <Link to="/academy" className="btn btn-primary" style={{ fontSize: '13px' }}>
                Enter the Academy
              </Link>
            </div>
          </motion.div>

          {/* Right: station list */}
          <motion.div {...fade(0.15)}>
            <div className="space-y-0">
              {stations.map(([num, title], i) => (
                <motion.div
                  key={num}
                  {...fade(i * 0.06)}
                  className="flex items-center gap-5 py-4"
                  style={{ borderBottom: '1px solid rgba(112,66,20,0.2)' }}
                >
                  <span
                    style={{
                      fontFamily: '"IBM Plex Mono", Menlo, monospace',
                      fontSize: '12px',
                      color: '#C9A84C',
                      letterSpacing: '0.08em',
                      flexShrink: 0,
                      width: '2rem',
                    }}
                  >
                    {num}
                  </span>
                  <span
                    style={{
                      fontFamily: '"Playfair Display", Georgia, serif',
                      color: '#2C1810',
                      fontSize: '16px',
                    }}
                  >
                    {title}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ——— Movement 5: The Cipher (testimonials + CTA) ———
function TheCipherClose() {
  const testimonials = [
    {
      quote:
        'I came in for a cut and left having talked about my father for the first time in years. That\'s not a barbershop. That\'s a sanctuary.',
      name: 'Marcus T.',
      via: 'The Chair',
    },
    {
      quote:
        'Station 3 broke something open in me. I finally understood why I react the way I do. The Trigger Tracker changed my relationships.',
      name: 'DeShawn W.',
      via: 'The Academy',
    },
    {
      quote:
        'The restoration oil sits on my bathroom shelf. Every morning I use it, I remember — I am worth this care even when no one is watching.',
      name: 'Jordan M.',
      via: 'The Vault',
    },
  ];

  return (
    <section style={{ backgroundColor: '#2C1810' }} className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6 sm:px-10">

        {/* Testimonials */}
        <motion.p
          {...fade()}
          className="uppercase tracking-[0.2em] mb-12 text-center"
          style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '11px', color: '#C9A84C' }}
        >
          From the Cipher
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {testimonials.map((t, i) => (
            <motion.div key={t.name} {...fade(i * 0.1)}>
              <div
                className="p-8 h-full"
                style={{
                  backgroundColor: '#3D2B1F',
                  borderLeft: '3px solid #C9A84C',
                  borderRadius: '3px',
                }}
              >
                <p
                  className="italic mb-6"
                  style={{
                    fontFamily: '"Libre Baskerville", Georgia, serif',
                    color: '#E8DCBE',
                    fontSize: '15px',
                    lineHeight: 1.8,
                  }}
                >
                  "{t.quote}"
                </p>
                <div>
                  <div
                    style={{
                      fontFamily: '"Playfair Display", Georgia, serif',
                      color: '#F5ECD7',
                      fontSize: '14px',
                      fontWeight: 700,
                    }}
                  >
                    {t.name}
                  </div>
                  <div
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      color: '#8B5E3C',
                      fontSize: '11px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      marginTop: '2px',
                    }}
                  >
                    {t.via}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <GoldRule />

        {/* Manifesto close */}
        <motion.div {...fade(0.1)} className="text-center mt-10">
          <h2
            className="mb-3"
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              color: '#C9A84C',
              fontSize: 'clamp(1.6rem, 4vw, 2.8rem)',
              lineHeight: 1.2,
            }}
          >
            The cipher is open.
          </h2>
          <p
            className="mb-10 italic"
            style={{
              fontFamily: '"Libre Baskerville", Georgia, serif',
              color: '#E8DCBE',
              fontSize: '18px',
            }}
          >
            Step in.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/booking" className="btn btn-primary" style={{ fontSize: '13px' }}>
              Begin Your Session
            </Link>
            <Link
              to="/academy"
              className="btn"
              style={{
                background: 'transparent',
                border: '1px solid rgba(201,168,76,0.4)',
                color: '#E8DCBE',
                fontSize: '13px',
              }}
            >
              Enter the Academy
            </Link>
            <Link
              to="/store"
              className="btn"
              style={{
                background: 'transparent',
                border: '1px solid rgba(201,168,76,0.4)',
                color: '#E8DCBE',
                fontSize: '13px',
              }}
            >
              Explore the Vault
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ——— Page ———

// ——— Page ———
export default function HomePage() {
  return (
    <div>
      <Threshold />
      <Lineage />
      <TheCraft />
      <TheKnowledge />
      <TheCipherClose />
    </div>
  );
}
