
import { useState } from "react";

type Props = {
  onLogin: (email: string, password: string) => Promise<void>;
};

export default function AuthPage({ onLogin }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (mode === "register" && username.trim().length < 3) {
      setError("Le pseudo doit contenir au moins 3 caractères.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await onLogin(email, password);
      } else {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.statusMessage || data.message || "Inscription impossible.");
        }

        setSuccess("Compte créé ! Tu peux maintenant te connecter.");
        setMode("login");
        setPassword("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-brand">
        <div className="brand-logo">H</div>
        <p className="brand-label">HOSTWARE AI</p>
        <h1>Votre espace de travail, <span>en plus intelligent.</span></h1>
        <p className="brand-description">
          Retrouvez votre assistant Hostware et échangez avec lui dans un
          espace sécurisé.
        </p>
        <div className="brand-status">
          <span className="status-dot" /> Espace Hostware sécurisé
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="mobile-logo">HOSTWARE AI</div>
          <p className="eyebrow">ESPACE MEMBRE</p>
          <h2>{mode === "login" ? "Bon retour." : "Créer un compte."}</h2>
          <p className="auth-subtitle">
            {mode === "login"
              ? "Connectez-vous pour accéder à votre assistant."
              : "Créez votre accès à l'espace Hostware."}
          </p>

          <div className="auth-tabs">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
              type="button"
            >
              Connexion
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
              type="button"
            >
              Créer un compte
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={submit} className="auth-form">
            {mode === "register" && (
              <label className="form-control">
                <span className="label-text">Nom d'utilisateur</span>
                <input
                  className="input input-bordered"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex. alex"
                  minLength={3}
                  maxLength={40}
                  required
                />
              </label>
            )}

            <label className="form-control">
              <span className="label-text">Adresse e-mail</span>
              <input
                className="input input-bordered"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@hostware.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="form-control">
              <span className="label-text">Mot de passe</span>
              <div className="password-wrap">
                <input
                  className="input input-bordered"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  minLength={8}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "Masquer" : "Afficher"}
                </button>
              </div>
            </label>

            <button className="btn btn-primary submit-btn" disabled={loading}>
              {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
            </button>
          </form>

          <p className="auth-footer">
            En continuant, vous acceptez les conditions d'utilisation de Hostware.
          </p>
        </div>
      </section>
    </main>
  );
}
