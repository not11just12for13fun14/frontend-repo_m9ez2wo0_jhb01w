import { useState } from "react";

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const backend = import.meta.env.VITE_BACKEND_URL || "";

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${backend}/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Feil ved innlogging");
      localStorage.setItem("token", data.access_token);
      onAuthenticated(data.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto bg-slate-800/60 border border-blue-500/20 rounded-2xl p-6 shadow-xl">
      <h2 className="text-white text-2xl font-semibold mb-2">
        {mode === "login" ? "Logg inn" : "Registrer konto"}
      </h2>
      <p className="text-blue-200/80 mb-4">Tilgang til styring- og internrevisjonsverktøyet</p>
      <form onSubmit={submit} className="space-y-3">
        {mode === "register" && (
          <div>
            <label className="text-blue-200 text-sm">Navn</label>
            <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-900/60 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ditt navn" />
          </div>
        )}
        <div>
          <label className="text-blue-200 text-sm">E-post</label>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-900/60 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="deg@firma.no" />
        </div>
        <div>
          <label className="text-blue-200 text-sm">Passord</label>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-900/60 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
        </div>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 transition text-white font-semibold py-2.5 rounded-lg">
          {loading ? "Laster..." : (mode === "login" ? "Logg inn" : "Registrer")}
        </button>
      </form>
      <div className="text-blue-300/80 text-sm mt-3">
        {mode === "login" ? (
          <button className="underline" onClick={()=>setMode("register")}>Har du ikke konto? Registrer</button>
        ) : (
          <button className="underline" onClick={()=>setMode("login")}>Har du konto? Logg inn</button>
        )}
      </div>
    </div>
  );
}
