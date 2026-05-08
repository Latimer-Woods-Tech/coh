import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrackedLink as Link } from '@/components/TrackedLink';
import {
  showEpisodeSeeds,
  showFeaturedEpisode,
  showFormatPoints,
  showGuardrails,
  showHero,
} from '@/content/siteContent';

const API = import.meta.env.VITE_API_URL ?? 'https://api.cypherofhealing.com';

interface Episode {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  episodeNumber: number;
  season: number | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  guestName: string | null;
  membershipGated: boolean;
  publishedAt: string | null;
  viewCount: number | null;
}

interface EpisodeDetail extends Episode {
  streamVideoUid: string | null;
  audioUrl: string | null;
  showNotes: string | null;
  guestBio: string | null;
}

interface EpisodeListResponse {
  data: Episode[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface EpisodeDetailResponse {
  episode: EpisodeDetail;
  entitled: boolean;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function EpisodePlayer({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [data, setData] = useState<EpisodeDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/api/show/${encodeURIComponent(slug)}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
        if (payload.entitled) {
          // Fire-and-forget view count increment on first load
          fetch(`${API}/api/show/${encodeURIComponent(slug)}/view`, { method: 'POST' }).catch(() => {});
        }
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Failed to load'));
    return () => { cancelled = true; };
  }, [slug]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Episode player"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(20,12,6,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#F5ECD7', maxWidth: '900px', width: '100%',
          maxHeight: '90vh', overflow: 'auto', border: '1px solid #C9A84C',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            float: 'right', padding: '12px 16px', background: 'transparent',
            border: 'none', cursor: 'pointer', fontSize: '20px', color: '#2C1810',
          }}
        >
          ×
        </button>
        {error && <p style={{ padding: 24, color: '#8B5E3C' }}>Could not load episode: {error}</p>}
        {!error && !data && <p style={{ padding: 24, fontFamily: '"IBM Plex Mono", monospace' }}>Loading…</p>}
        {data && (
          <div style={{ padding: 24 }}>
            <p style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, color: '#8B5E3C', letterSpacing: '0.08em' }}>
              S{data.episode.season ?? 1} · E{data.episode.episodeNumber}
              {data.episode.guestName && ` · with ${data.episode.guestName}`}
            </p>
            <h3 style={{ fontFamily: '"Playfair Display", serif', color: '#2C1810', fontSize: '1.8rem', marginTop: 8, marginBottom: 16 }}>
              {data.episode.title}
            </h3>

            {data.entitled && data.episode.streamVideoUid ? (
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, marginBottom: 20 }}>
                <iframe
                  src={`https://customer-${data.episode.streamVideoUid}.cloudflarestream.com/${data.episode.streamVideoUid}/iframe?autoplay=true`}
                  title={data.episode.title}
                  loading="lazy"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                />
              </div>
            ) : (
              <div style={{ padding: 32, backgroundColor: '#E8DCBE', border: '1px solid #8B5E3C', textAlign: 'center', marginBottom: 20 }}>
                <p style={{ fontFamily: '"Libre Baskerville", serif', color: '#2C1810', marginBottom: 16 }}>
                  This episode is reserved for VIP and Inner Circle members.
                </p>
                <Link to="/membership" className="btn btn-primary" style={{ fontSize: 13 }}>
                  Become a member
                </Link>
              </div>
            )}

            {data.episode.description && (
              <p style={{ fontFamily: '"Libre Baskerville", serif', color: '#3D2B1F', lineHeight: 1.85 }}>
                {data.episode.description}
              </p>
            )}
            {data.entitled && data.episode.showNotes && (
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #C9A84C' }}>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#704214', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Show notes
                </p>
                <p style={{ fontFamily: '"Libre Baskerville", serif', color: '#3D2B1F', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
                  {data.episode.showNotes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LiveEpisodes() {
  const [episodes, setEpisodes] = useState<Episode[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/api/show?page=1&limit=12`)
      .then((r) => r.json() as Promise<EpisodeListResponse>)
      .then((payload) => !cancelled && setEpisodes(payload.data ?? []))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Failed to load'));
    return () => { cancelled = true; };
  }, []);

  if (error) return null; // Silently degrade to editorial content if the API is down
  if (episodes === null) return null; // Don't flash empty state while loading
  if (episodes.length === 0) return null;

  return (
    <section className="py-16 md:py-20" style={{ backgroundColor: '#E8DCBE' }}>
      <div className="max-w-5xl mx-auto px-6">
        <p
          className="uppercase tracking-widest text-xs mb-4"
          style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C', letterSpacing: '0.2em' }}
        >
          Latest Episodes
        </p>
        <h2 className="mb-8" style={{ fontFamily: '"Playfair Display", serif', color: '#2C1810', fontSize: '2.2rem' }}>
          Watch the conversation.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {episodes.map((ep) => (
            <button
              key={ep.id}
              onClick={() => setActiveSlug(ep.slug)}
              type="button"
              style={{
                backgroundColor: '#F5ECD7', border: '1px solid #8B5E3C', cursor: 'pointer',
                padding: 0, textAlign: 'left', display: 'flex', flexDirection: 'column',
              }}
            >
              {ep.thumbnailUrl && (
                <div style={{ aspectRatio: '16/9', overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={ep.thumbnailUrl}
                    alt={ep.title}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {ep.membershipGated && (
                    <span style={{
                      position: 'absolute', top: 12, right: 12,
                      backgroundColor: '#C9A84C', color: '#2C1810', padding: '4px 10px',
                      fontFamily: 'DM Sans, sans-serif', fontSize: 11, letterSpacing: '0.1em',
                      textTransform: 'uppercase', fontWeight: 700,
                    }}>VIP</span>
                  )}
                  {ep.durationSeconds && (
                    <span style={{
                      position: 'absolute', bottom: 12, right: 12,
                      backgroundColor: 'rgba(20,12,6,0.85)', color: '#F5ECD7', padding: '3px 8px',
                      fontFamily: '"IBM Plex Mono", monospace', fontSize: 11,
                    }}>{formatDuration(ep.durationSeconds)}</span>
                  )}
                </div>
              )}
              <div style={{ padding: 18 }}>
                <p style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, color: '#8B5E3C', letterSpacing: '0.08em', marginBottom: 6 }}>
                  S{ep.season ?? 1} · E{ep.episodeNumber}
                  {ep.guestName && ` · ${ep.guestName}`}
                </p>
                <h3 style={{ fontFamily: '"Playfair Display", serif', color: '#2C1810', fontSize: '1.2rem', marginBottom: 10, lineHeight: 1.3 }}>
                  {ep.title}
                </h3>
                {ep.description && (
                  <p style={{ fontFamily: '"Libre Baskerville", serif', color: '#3D2B1F', lineHeight: 1.7, fontSize: 14 }}>
                    {ep.description.length > 120 ? `${ep.description.slice(0, 120)}…` : ep.description}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
      {activeSlug && <EpisodePlayer slug={activeSlug} onClose={() => setActiveSlug(null)} />}
    </section>
  );
}

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: 'easeOut' },
});

export default function ShowPage() {
  return (
    <div style={{ backgroundColor: '#F5ECD7', minHeight: '100vh' }}>
      <section className="py-20 md:py-28" style={{ backgroundColor: '#2C1810' }}>
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
          <motion.div {...fade(0.02)} className="overflow-hidden" style={{ border: '1px solid rgba(201,168,76,0.24)' }}>
            <img
              src={showHero.image}
              alt={showHero.title}
              className="w-full h-full object-cover"
              style={{ minHeight: '320px', filter: 'sepia(0.28) contrast(1.08) brightness(0.74)' }}
            />
          </motion.div>
          <div>
            <motion.p
              {...fade(0)}
              className="uppercase tracking-widest text-xs mb-5"
              style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C', letterSpacing: '0.25em' }}
            >
              {showHero.eyebrow}
            </motion.p>
            <motion.h1
              {...fade(0.08)}
              className="text-4xl md:text-6xl font-bold leading-tight mb-6"
              style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
            >
              {showHero.title}
            </motion.h1>
            <motion.p
              {...fade(0.16)}
              className="text-lg max-w-3xl leading-relaxed"
              style={{ fontFamily: '"Libre Baskerville", serif', color: '#E8DCBE' }}
            >
              {showHero.description} It lets people feel the voice of the brand before they ever
              book, enroll, or join a gathering.
            </motion.p>
          </div>
        </div>
      </section>

      <LiveEpisodes />

      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
          <motion.div {...fade()}>
            <p className="uppercase tracking-widest text-xs mb-4" style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C', letterSpacing: '0.2em' }}>
              Flagship Episode Direction
            </p>
            <h2 className="mb-4" style={{ fontFamily: '"Playfair Display", serif', color: '#2C1810', fontSize: '2.2rem' }}>
              {showFeaturedEpisode.title}
            </h2>
            <p className="mb-5" style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#8B5E3C', fontSize: '12px', letterSpacing: '0.08em' }}>
              {showFeaturedEpisode.focus} · {showFeaturedEpisode.runtime}
            </p>
            <p style={{ fontFamily: '"Libre Baskerville", serif', color: '#3D2B1F', lineHeight: 1.85 }}>
              {showFeaturedEpisode.description}
            </p>
            <div className="mt-6">
              <Link
                to={showFeaturedEpisode.ctaPath}
                className="btn btn-primary"
                style={{ fontSize: '13px' }}
                eventName="show_featured_episode_cta_clicked"
                trackingContext="show_featured_episode"
                trackingLabel={showFeaturedEpisode.title}
              >
                {showFeaturedEpisode.ctaLabel}
              </Link>
            </div>
          </motion.div>

          <motion.div {...fade(0.08)} className="overflow-hidden" style={{ border: '1px solid #8B5E3C' }}>
            <img
              src={showFeaturedEpisode.image}
              alt={showFeaturedEpisode.title}
              className="w-full h-full object-cover"
              style={{ minHeight: '360px', filter: 'sepia(0.32) contrast(1.08) brightness(0.8)' }}
            />
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <motion.div {...fade()}>
            <p className="uppercase tracking-widest text-xs mb-4" style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C', letterSpacing: '0.2em' }}>
              Role in the System
            </p>
            <h2 className="mb-4" style={{ fontFamily: '"Playfair Display", serif', color: '#2C1810', fontSize: '2.2rem' }}>
              The low-friction entry point.
            </h2>
            <p style={{ fontFamily: '"Libre Baskerville", serif', color: '#3D2B1F', lineHeight: 1.85 }}>
              The show should not behave like separate content marketing. It should function as the
              editorial expression of the doctrine: the chair as sanctuary, the conversation as
              restoration, and the takeaway as a bridge into deeper work.
            </p>
          </motion.div>

          <motion.div {...fade(0.08)} className="p-6" style={{ backgroundColor: '#E8DCBE', border: '1px solid #8B5E3C' }}>
            <p className="uppercase tracking-widest text-xs mb-4" style={{ fontFamily: 'DM Sans, sans-serif', color: '#704214', letterSpacing: '0.2em' }}>
              Audience Job
            </p>
            <p style={{ fontFamily: '"Libre Baskerville", serif', color: '#2C1810', lineHeight: 1.85 }}>
              For the visitor who is not ready to buy or book yet, the show answers a simpler
              question: what does this worldview feel like in action?
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-20" style={{ backgroundColor: '#E8DCBE' }}>
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div {...fade()} className="p-6" style={{ backgroundColor: '#F5ECD7', border: '1px solid #8B5E3C' }}>
            <h2 className="mb-5" style={{ fontFamily: '"Playfair Display", serif', color: '#2C1810', fontSize: '1.9rem' }}>
              Recommended format
            </h2>
            <div className="space-y-3">
              {showFormatPoints.map((point, index) => (
                <div key={point} className="flex gap-3">
                  <span style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#C9A84C', flexShrink: 0 }}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p style={{ fontFamily: '"Libre Baskerville", serif', color: '#3D2B1F', lineHeight: 1.8 }}>
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...fade(0.08)} className="p-6" style={{ backgroundColor: '#2C1810', borderLeft: '4px solid #C9A84C' }}>
            <h2 className="mb-5" style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7', fontSize: '1.9rem' }}>
              Editorial guardrails
            </h2>
            <div className="space-y-3">
              {showGuardrails.map((point) => (
                <p key={point} style={{ fontFamily: '"Libre Baskerville", serif', color: '#E8DCBE', lineHeight: 1.8 }}>
                  {point}
                </p>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.p
            {...fade()}
            className="uppercase tracking-widest text-xs mb-4"
            style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C', letterSpacing: '0.2em' }}
          >
            Episode Seeds
          </motion.p>
          <motion.h2 {...fade(0.08)} className="mb-8" style={{ fontFamily: '"Playfair Display", serif', color: '#2C1810', fontSize: '2.2rem' }}>
            Sample editorial directions.
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {showEpisodeSeeds.map((episode, index) => (
              <motion.div key={episode.title} {...fade(index * 0.06)} className="p-6" style={{ backgroundColor: '#E8DCBE', border: '1px solid #8B5E3C' }}>
                <p className="uppercase tracking-widest text-xs mb-3" style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C', letterSpacing: '0.14em' }}>
                  {episode.format}
                </p>
                <h3 className="mb-3" style={{ fontFamily: '"Playfair Display", serif', color: '#2C1810', fontSize: '1.35rem' }}>
                  {episode.title}
                </h3>
                <p style={{ fontFamily: '"Libre Baskerville", serif', color: '#3D2B1F', lineHeight: 1.8 }}>
                  {episode.takeaway}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.p
            {...fade()}
            className="uppercase tracking-widest text-xs mb-4"
            style={{ fontFamily: 'DM Sans, sans-serif', color: '#C9A84C', letterSpacing: '0.2em' }}
          >
            Where it should lead
          </motion.p>
          <motion.h2 {...fade(0.08)} className="mb-5" style={{ fontFamily: '"Playfair Display", serif', color: '#2C1810', fontSize: '2.3rem' }}>
            Watch, then choose the next depth.
          </motion.h2>
          <motion.p {...fade(0.16)} className="max-w-3xl mx-auto mb-8" style={{ fontFamily: '"Libre Baskerville", serif', color: '#704214', lineHeight: 1.85 }}>
            The show should point people into the right next step: book a session, enter the
            Academy, or join a live gathering. It is the invitation, not the whole journey.
          </motion.p>
          <motion.div {...fade(0.24)} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/booking" className="btn btn-primary" style={{ fontSize: '13px' }}>
              Start with the Chair
            </Link>
            <Link to="/academy" className="btn btn-outline" style={{ fontSize: '13px' }}>
              Enter the Academy
            </Link>
            <Link to="/events" className="btn btn-outline" style={{ fontSize: '13px' }}>
              Join a Gathering
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}