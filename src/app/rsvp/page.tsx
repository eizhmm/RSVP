import Link from "next/link";
import { RsvpForm } from "@/components/RsvpForm";
import { getSessionsWithSeats } from "@/lib/rsvp/queries";

export const dynamic = "force-dynamic";

export default async function RsvpPage() {
  const sessions = await getSessionsWithSeats();

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="inner">
          <Link className="brand-mark" href="/">
            Kind Table
          </Link>
          <Link href="/">← Back</Link>
        </div>
      </header>
      <main className="page-main">
        <div className="container">
          <h1 className="page-title">Reserve your seat</h1>
          <p className="page-lead">
            Book for yourself and guests you bring. Party size cannot exceed seats left in the
            sitting you choose.
          </p>
          <RsvpForm sessions={sessions} />
        </div>
      </main>
    </div>
  );
}
