import { Link } from 'react-router-dom';

const H = ({ children }: { children: React.ReactNode }) => (
  <h4
    style={{
      fontFamily: '"Playfair Display", Georgia, serif',
      color: '#C9A84C',
      fontSize: '13px',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      marginBottom: '1rem',
      fontWeight: 700,
    }}
  >
    {children}
  </h4>
);

const FooterLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <li>
    <Link
      to={to}
      style={{
        fontFamily: '"DM Sans", sans-serif',
        color: '#8B5E3C',
        fontSize: '13px',
        letterSpacing: '0.04em',
        transition: 'color 0.2s',
        display: 'inline-block',
        lineHeight: '1.8',
      }}
      onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#E8DCBE')}
      onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#8B5E3C')}
    >
      {children}
    </Link>
  </li>
);

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#1A0E09', borderTop: '1px solid rgba(201,168,76,0.2)' }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-16">

        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">

          {/* Brand column */}
          <div className="md:col-span-4">
            {/* Cipher mark */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center border flex-shrink-0"
                style={{ borderColor: '#C9A84C' }}
              >
                <div
                  className="w-4 h-4 rounded-full border flex items-center justify-center"
                  style={{ borderColor: '#C9A84C' }}
                >
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#C9A84C' }} />
                </div>
              </div>
              <span
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  color: '#F5ECD7',
                  fontSize: '16px',
                  letterSpacing: '0.04em',
                }}
              >
                CypherOfHealing
              </span>
            </div>

            <p
              style={{
                fontFamily: '"Libre Baskerville", Georgia, serif',
                color: '#704214',
                fontSize: '14px',
                lineHeight: '1.8',
                maxWidth: '280px',
              }}
            >
              Before the barber was a barber, he was a healer. We honor that lineage — through the
              chair, the vault, and the cipher.
            </p>

            {/* Gold rule */}
            <div className="mt-6 divider-gold">
              <span style={{ fontSize: '10px', letterSpacing: '0.3em' }}>◆</span>
            </div>

            <p
              className="mt-4 italic"
              style={{
                fontFamily: '"Libre Baskerville", Georgia, serif',
                color: '#4A2C0E',
                fontSize: '12px',
                lineHeight: '1.7',
              }}
            >
              "The cipher is open."
            </p>
          </div>

          {/* Nav columns */}
          <div className="md:col-span-2">
            <H>The Chair</H>
            <ul>
              <FooterLink to="/booking">Book a Session</FooterLink>
              <FooterLink to="/booking">Services</FooterLink>
              <FooterLink to="/booking">The Chair + Cipher</FooterLink>
            </ul>
          </div>

          <div className="md:col-span-2">
            <H>The Vault</H>
            <ul>
              <FooterLink to="/store">All Products</FooterLink>
              <FooterLink to="/store">Oils &amp; Grooming</FooterLink>
              <FooterLink to="/store">Books &amp; Journals</FooterLink>
            </ul>
          </div>

          <div className="md:col-span-2">
            <H>The Academy</H>
            <ul>
              <FooterLink to="/academy">The Cipher Course</FooterLink>
              <FooterLink to="/academy">Six Stations</FooterLink>
              <FooterLink to="/academy">Enroll</FooterLink>
            </ul>
          </div>

          <div className="md:col-span-2">
            <H>The Stage</H>
            <ul>
              <FooterLink to="/events">The Open Cipher</FooterLink>
              <FooterLink to="/events">Workshops</FooterLink>
              <FooterLink to="/events">The Retreat</FooterLink>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
          style={{ borderTop: '1px solid rgba(112, 66, 20, 0.3)' }}
        >
          <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              color: '#4A2C0E',
              fontSize: '11px',
              letterSpacing: '0.1em',
            }}
          >
            © {new Date().getFullYear()} CypherOfHealing.com · Est. 2026 · Lawrenceville, GA
          </p>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Contact'].map((label) => (
              <Link
                key={label}
                to="#"
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  color: '#4A2C0E',
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#C9A84C')}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#4A2C0E')}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
