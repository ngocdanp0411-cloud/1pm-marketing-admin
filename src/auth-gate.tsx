import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { LoaderCircle, LockKeyhole, LogIn } from "lucide-react";

import { fetchAuthStatus, loginWithPassword, logoutSession } from "./operations-api";

type AuthState = "checking" | "authenticated" | "unauthenticated";

interface AuthGateProps {
  children: (session: { logout: () => Promise<void>; logoutBusy: boolean }) => ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetchAuthStatus(controller.signal)
      .then((status) => setAuthState(status.authenticated ? "authenticated" : "unauthenticated"))
      .catch((requestError) => {
        if (controller.signal.aborted) return;
        setError(requestError instanceof Error ? requestError.message : "Không thể kiểm tra phiên đăng nhập.");
        setAuthState("unauthenticated");
      });

    return () => controller.abort();
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password || loginBusy) return;

    setLoginBusy(true);
    setError("");

    try {
      const status = await loginWithPassword(password);
      if (!status.authenticated) {
        throw new Error("Không tạo được phiên đăng nhập.");
      }

      setPassword("");
      setAuthState("authenticated");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Đăng nhập thất bại.");
    } finally {
      setLoginBusy(false);
    }
  }

  async function handleLogout() {
    if (logoutBusy) return;

    setLogoutBusy(true);
    try {
      await logoutSession();
      setPassword("");
      setError("");
      setAuthState("unauthenticated");
    } catch {
      window.alert("Không thể đăng xuất. Hãy kiểm tra kết nối và thử lại.");
    } finally {
      setLogoutBusy(false);
    }
  }

  if (authState === "checking") {
    return (
      <main className="auth-screen" aria-busy="true">
        <section className="auth-card auth-loading" role="status">
          <LoaderCircle className="auth-spinner" />
          <strong>Đang kiểm tra phiên đăng nhập…</strong>
        </section>
      </main>
    );
  }

  if (authState === "unauthenticated") {
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <div className="auth-brand" aria-hidden="true">1<span>PM</span></div>
          <div className="auth-heading">
            <span className="auth-lock"><LockKeyhole /></span>
            <div>
              <h1>1PM Marketing Admin</h1>
              <p>Nhập mật khẩu quản trị nội bộ để tiếp tục.</p>
            </div>
          </div>
          <form className="auth-form" onSubmit={handleLogin}>
            <label>
              <span>Mật khẩu</span>
              <input
                autoComplete="current-password"
                autoFocus
                disabled={loginBusy}
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="primary-btn" disabled={!password || loginBusy} type="submit">
              {loginBusy ? <LoaderCircle className="auth-spinner" /> : <LogIn />}
              {loginBusy ? "Đang đăng nhập…" : "Đăng nhập"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return children({ logout: handleLogout, logoutBusy });
}
