import { useEffect, useState } from "react";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  useEffect(()=>{
    if (token) localStorage.setItem("token", token);
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.06),transparent_50%)]"></div>
      <div className="relative min-h-screen p-6">
        <header className="max-w-6xl mx-auto flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-300 font-bold">SG</div>
            <div>
              <div className="text-white font-semibold">Styring & Internrevisjon</div>
              <div className="text-blue-300/80 text-xs">Målkort • Handlingsplan • Tidslinje</div>
            </div>
          </div>
          {token && (
            <button onClick={()=>{localStorage.removeItem("token"); setToken(null);}} className="text-blue-300/80 text-sm underline">Logg ut</button>
          )}
        </header>

        <main className="max-w-6xl mx-auto">
          {!token ? (
            <div className="flex items-center justify-center">
              <Auth onAuthenticated={setToken} />
            </div>
          ) : (
            <Dashboard token={token} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
