import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { getSessionsWithSeats } from "@/lib/rsvp/queries";
import { VENUE } from "@/lib/event";

export const revalidate = 60;
export const preferredRegion = "sin1";

export default async function HomePage() {
  let sessions: Awaited<ReturnType<typeof getSessionsWithSeats>> = [];
  let loadError = false;

  try {
    sessions = await getSessionsWithSeats();
  } catch {
    loadError = true;
  }

  return (
    <>
      <header className="hero">
        <nav className="site-nav" aria-label="Primary">
          <BrandMark />
          <div className="nav-links">
            <a href="#about">About</a>
            <Link href="/rsvp">RSVP</Link>
            <Link href="/admin/login">Admin</Link>
          </div>
        </nav>

        <div className="hero-inner">
          <p className="hero-eyebrow">A dinner for charity</p>
          <h1>Kind Table</h1>
          <p className="hero-lead">
            Join us for an intimate donation dinner supporting local community kitchens. Limited
            seats — two evenings, two sittings.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/rsvp">
              Reserve your seat
            </Link>
            <a className="btn btn-ghost" href="#about">
              Learn more
            </a>
          </div>
        </div>
      </header>

      <section className="section" id="about">
        <div className="container split">
          <div>
            <div className="section-head">
              <h2>An evening that feeds more than the table</h2>
              <p className="muted">
                Kind Table is a charity donation dinner. Guests share a meal while proceeds help
                fund meals and groceries for families in need.
              </p>
            </div>
            <ul className="feature-list">
              <li>
                <span className="dot" aria-hidden="true" />
                <div>
                  <strong>Venue</strong>
                  <span className="muted">
                    {VENUE.name} · {VENUE.address}
                  </span>
                </div>
              </li>
              <li>
                <span className="dot" aria-hidden="true" />
                <div>
                  <strong>Two evenings</strong>
                  <span className="muted">Saturday 15 Aug &amp; Sunday 16 Aug 2026</span>
                </div>
              </li>
              <li>
                <span className="dot" aria-hidden="true" />
                <div>
                  <strong>Two sittings each night</strong>
                  <span className="muted">6:00 PM early seating · 8:00 PM main seating</span>
                </div>
              </li>
              <li>
                <span className="dot" aria-hidden="true" />
                <div>
                  <strong>30 seats across four sittings</strong>
                  <span className="muted">Intimate by design — reserve early</span>
                </div>
              </li>
            </ul>
          </div>
          <div>
            {loadError ? (
              <p className="muted">Unable to load live seat counts right now.</p>
            ) : (
              <>
                <div className="seat-strip" aria-label="Remaining seats by session">
                  {sessions.map((s) => {
                    const d = new Date(`${s.event_date}T12:00:00`);
                    const day = d.toLocaleDateString("en-MY", { weekday: "short" });
                    const [h] = s.starts_at.split(":");
                    const hour = Number(h);
                    const label = `${day} · ${((hour + 11) % 12) + 1} ${hour >= 12 ? "PM" : "AM"}`;
                    return (
                      <div
                        className={`seat-cell${s.seats_left === 0 ? " is-full" : ""}`}
                        key={s.id}
                      >
                        <div className="label">{label}</div>
                        <div className="count">{s.seats_left}</div>
                        <div className="sub">
                          {s.seats_left === 0 ? "full" : `of ${s.capacity} left`}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="muted" style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
                  Live seat counts.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container" style={{ textAlign: "center", maxWidth: "36rem" }}>
          <h2>Ready to join us?</h2>
          <p className="muted">
            Tell us who you are, pick one evening and sitting, and we will hold your place at the
            table.
          </p>
          <Link className="btn btn-primary" href="/rsvp" style={{ marginTop: "0.5rem" }}>
            Reserve your seat
          </Link>
        </div>
      </section>

      <footer className="footer-mini">
        <div className="container">
          Kind Table · {VENUE.name} · <Link href="/admin/login">Admin</Link>
        </div>
      </footer>
    </>
  );
}
