
import { useEffect, useState } from "react";
import AuthPage from "./conextionPage";
import "./App.css";

type Admin = {
  id: string;
  username: string;
  email: string;
};

export default function App() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then(async (response) => {
        if (!response.ok) return null;
        const data = await response.json();
        return data.admin || null;
      })
      .then(setAdmin)
      .catch(() => setAdmin(null))
      .finally(() => setChecking(false));
  }, []);

  async function login(email: string, password: string) {
    setError("");
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.statusMessage || "Identifiants incorrects.");
    }
    setAdmin(data.admin);
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    setAdmin(null);
  }

  if (checking) {
    return (
      <main className="loading-screen">
        <span className="loading loading-spinner loading-lg" />
        <p>Préparation de votre espace...</p>
      </main>
    );
  }

  if (!admin) {
    return (
      <>
        {error && <p className="global-error">{error}</p>}
        <AuthPage onLogin={login} />
      </>
    );
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <div className="brand-logo small">H</div>
          <strong>HOSTWARE <span>AI</span></strong>
        </div>
        <div className="account-area">
          <span>{admin.username}</span>
          <button className="btn btn-outline btn-sm" onClick={logout}>
            Déconnexion
          </button>
        </div>
      </header>

      <section className="welcome-area">
        <p className="eyebrow">ESPACE PERSONNEL</p>
        <h1>Bienvenue, {admin.username}.</h1>
        <p>Votre espace Hostware AI est prêt.</p>
        <div className="welcome-card">
          <div className="welcome-icon">✦</div>
          <div>
            <h2>Hostware AI</h2>
            <p>La connexion est active. L'assistant sera bientôt disponible ici.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
