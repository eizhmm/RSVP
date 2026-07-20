import Link from "next/link";
import { adminLoginAction } from "@/app/actions/admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdminAuthenticated()) redirect("/admin");
  const { error } = await searchParams;

  return (
    <main className="login-center">
      <form className="login-card" action={adminLoginAction}>
        <Link
          className="brand-mark"
          href="/"
          style={{ display: "inline-block", marginBottom: "1.25rem", color: "var(--ink)" }}
        >
          Kind Table
        </Link>
        <h1>Admin</h1>
        <p className="lead">Sign in to view registration reports for each dinner sitting.</p>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>
        {error ? (
          <p className="hint" style={{ color: "var(--danger)", marginBottom: "1rem" }}>
            Incorrect password.
          </p>
        ) : null}
        <button className="btn btn-primary btn-block" type="submit">
          View reports
        </button>
      </form>
    </main>
  );
}
