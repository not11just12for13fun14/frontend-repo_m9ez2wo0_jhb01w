import { useEffect, useMemo, useState } from "react";

const backend = import.meta.env.VITE_BACKEND_URL || "";

function Section({ title, children, action }) {
  return (
    <div className="bg-slate-800/60 border border-blue-500/20 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-lg">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function Dashboard({ token }) {
  const headers = useMemo(() => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }), [token]);
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState("");
  const [selected, setSelected] = useState(null);

  // Entities
  const [metrics, setMetrics] = useState([]);
  const [actions, setActions] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [tasks, setTasks] = useState({});
  const [comments, setComments] = useState([]);
  const [documents, setDocuments] = useState([]);

  const fetchProjects = async () => {
    const res = await fetch(`${backend}/projects`, { headers });
    if (res.ok) setProjects(await res.json());
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const createProject = async () => {
    if (!newProject) return;
    const res = await fetch(`${backend}/projects`, { method: "POST", headers, body: JSON.stringify({ name: newProject }) });
    if (res.ok) {
      setNewProject("");
      fetchProjects();
    }
  };

  const loadProjectData = async (projectId) => {
    const [m, a, t, c, d] = await Promise.all([
      fetch(`${backend}/metrics/${projectId}`, { headers }),
      fetch(`${backend}/actions/${projectId}`, { headers }),
      fetch(`${backend}/timeline/${projectId}`, { headers }),
      fetch(`${backend}/comments/${projectId}`, { headers }),
      fetch(`${backend}/documents/${projectId}`, { headers }),
    ]);
    const metricsData = (await m.json()) || [];
    const actionsData = (await a.json()) || [];
    const timelineData = (await t.json()) || [];
    const commentsData = (await c.json()) || [];
    const documentsData = (await d.json()) || [];

    setMetrics(metricsData);
    setActions(actionsData);
    setTimeline(timelineData);
    setComments(commentsData);
    setDocuments(documentsData);

    // Load tasks for each timeline item
    const tasksEntries = await Promise.all(
      (timelineData || []).map(async (item) => {
        const r = await fetch(`${backend}/tasks/${item._id}`, { headers });
        return [item._id, (await r.json()) || []];
      })
    );
    const obj = {};
    tasksEntries.forEach(([id, list]) => (obj[id] = list));
    setTasks(obj);
  };

  useEffect(() => {
    if (selected) loadProjectData(selected._id);
  }, [selected]);

  return (
    <div className="max-w-6xl w-full mx-auto grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-4">
        <Section title="Prosjekter" action={<button onClick={createProject} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg">Opprett</button>}>
          <div className="flex gap-2">
            <input value={newProject} onChange={(e)=>setNewProject(e.target.value)} placeholder="Nytt prosjekt" className="flex-1 px-3 py-2 rounded-lg bg-slate-900/60 text-white border border-slate-700" />
          </div>
          <ul className="mt-3 space-y-2">
            {projects.map(p => (
              <li key={p._id}>
                <button onClick={()=>setSelected(p)} className={`w-full text-left px-3 py-2 rounded-lg border ${selected?._id===p._id?"bg-blue-600/20 border-blue-500 text-white":"bg-slate-900/60 border-slate-700 text-blue-100"}`}>{p.name}</button>
              </li>
            ))}
          </ul>
        </Section>

        {selected && (
          <Section title="Målkort (Scorecard)" action={null}>
            <MetricForm projectId={selected._id} headers={headers} onAdded={()=>loadProjectData(selected._id)} />
            <div className="mt-3 space-y-2">
              {metrics.map(m => (
                <div key={m._id} className="p-3 rounded-lg bg-slate-900/60 border border-slate-700 text-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-white">{m.title}</div>
                    <div className="text-sm">{m.current_value}/{m.target_value} {m.unit}</div>
                  </div>
                  {m.description && <div className="text-sm text-blue-200/80 mt-1">{m.description}</div>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {selected && (
          <Section title="Handlingsplan" action={null}>
            <ActionForm projectId={selected._id} headers={headers} onAdded={()=>loadProjectData(selected._id)} />
            <ul className="mt-3 space-y-2">
              {actions.map(a => (
                <li key={a._id} className="p-3 rounded-lg bg-slate-900/60 border border-slate-700 text-blue-100 flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">{a.title}</div>
                    {a.description && <div className="text-sm text-blue-200/80">{a.description}</div>}
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-slate-700">{a.status}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>

      <div className="md:col-span-2 space-y-4">
        {selected ? (
          <Section title="Tidslinje" action={<TimelineForm projectId={selected._id} headers={headers} onAdded={()=>loadProjectData(selected._id)} />}>
            <div className="space-y-4">
              {timeline.map(item => (
                <div key={item._id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm uppercase text-blue-300/80">{item.type}</div>
                      <div className="text-white font-semibold">{item.title}</div>
                    </div>
                    <div className="text-blue-200/70 text-sm">
                      {item.start_date?.slice(0,10)} {item.end_date?`→ ${item.end_date?.slice(0,10)}`:""}
                    </div>
                  </div>

                  {/* Tasks */}
                  <TaskForm timelineItemId={item._id} projectId={selected._id} headers={headers} onAdded={()=>loadProjectData(selected._id)} />
                  <div className="mt-2 space-y-2">
                    {(tasks[item._id]||[]).map(t => (
                      <div key={t._id} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700 text-blue-100 flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">{t.title}</div>
                          {t.description && <div className="text-sm text-blue-200/80">{t.description}</div>}
                        </div>
                        <span className="text-xs px-2 py-1 rounded bg-slate-700">{t.status}</span>
                      </div>
                    ))}
                  </div>

                  {/* Comments & Documents */}
                  <div className="mt-3 grid md:grid-cols-2 gap-3">
                    <div>
                      <CommentForm projectId={selected._id} timelineItemId={item._id} headers={headers} onAdded={()=>loadProjectData(selected._id)} />
                      <ul className="mt-2 space-y-2">
                        {comments.filter(c=>c.timeline_item_id===item._id).map(c => (
                          <li key={c._id} className="text-sm text-blue-200/90 bg-slate-800/60 border border-slate-700 rounded-lg p-2">{c.content}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <DocumentForm projectId={selected._id} timelineItemId={item._id} headers={headers} onAdded={()=>loadProjectData(selected._id)} />
                      <ul className="mt-2 space-y-2">
                        {documents.filter(d=>d.timeline_item_id===item._id).map(d => (
                          <li key={d._id} className="text-sm text-blue-200/90 bg-slate-800/60 border border-slate-700 rounded-lg p-2 flex items-center justify-between">
                            <span>{d.name}</span>
                            <a href={d.url} target="_blank" className="text-blue-400 underline">Åpne</a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        ) : (
          <div className="text-blue-200/80">Velg eller opprett et prosjekt for å starte.</div>
        )}
      </div>
    </div>
  );
}

function MetricForm({ projectId, headers, onAdded }) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(100);
  const [current, setCurrent] = useState(0);
  const [unit, setUnit] = useState("%");
  const submit = async () => {
    if (!title) return;
    await fetch(`${backend}/metrics`, { method: "POST", headers, body: JSON.stringify({ project_id: projectId, title, target_value: Number(target), current_value: Number(current), unit }) });
    setTitle("");
    onAdded();
  };
  return (
    <div className="flex gap-2">
      <input value={title} onChange={(e)=>setTitle(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-slate-900/60 text-white border border-slate-700" placeholder="Mål" />
      <input type="number" value={current} onChange={(e)=>setCurrent(e.target.value)} className="w-24 px-3 py-2 rounded-lg bg-slate-900/60 text-white border border-slate-700" placeholder="Nå" />
      <input type="number" value={target} onChange={(e)=>setTarget(e.target.value)} className="w-24 px-3 py-2 rounded-lg bg-slate-900/60 text-white border border-slate-700" placeholder="Mål" />
      <input value={unit} onChange={(e)=>setUnit(e.target.value)} className="w-16 px-3 py-2 rounded-lg bg-slate-900/60 text-white border border-slate-700" placeholder="Enhet" />
      <button onClick={submit} className="bg-blue-600 text-white px-3 py-2 rounded-lg">Legg til</button>
    </div>
  );
}

function ActionForm({ projectId, headers, onAdded }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const submit = async () => {
    if (!title) return;
    await fetch(`${backend}/actions`, { method: "POST", headers, body: JSON.stringify({ project_id: projectId, title, description }) });
    setTitle("");
    setDescription("");
    onAdded();
  };
  return (
    <div className="space-y-2">
      <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-900/60 text-white border border-slate-700" placeholder="Tiltak" />
      <div className="flex gap-2">
        <input value={description} onChange={(e)=>setDescription(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-slate-900/60 text-white border border-slate-700" placeholder="Beskrivelse" />
        <button onClick={submit} className="bg-blue-600 text-white px-3 py-2 rounded-lg">Legg til</button>
      </div>
    </div>
  );
}

function TimelineForm({ projectId, headers, onAdded }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("milestone");
  const submit = async () => {
    if (!title) return;
    await fetch(`${backend}/timeline`, { method: "POST", headers, body: JSON.stringify({ project_id: projectId, title, type }) });
    setTitle("");
    onAdded();
  };
  return (
    <div className="flex gap-2">
      <select value={type} onChange={(e)=>setType(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-900/60 text-white border border-slate-700">
        <option value="milestone">Milepæl</option>
        <option value="task">Oppgave</option>
        <option value="review">Gjennomgang</option>
        <option value="audit">Revisjon</option>
      </select>
      <input value={title} onChange={(e)=>setTitle(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-slate-900/60 text-white border border-slate-700" placeholder="Tittel" />
      <button onClick={submit} className="bg-blue-600 text-white px-3 py-2 rounded-lg">Legg til</button>
    </div>
  );
}

function TaskForm({ timelineItemId, projectId, headers, onAdded }) {
  const [title, setTitle] = useState("");
  const submit = async () => {
    if (!title) return;
    await fetch(`${backend}/tasks`, { method: "POST", headers, body: JSON.stringify({ project_id: projectId, timeline_item_id: timelineItemId, title }) });
    setTitle("");
    onAdded();
  };
  return (
    <div className="mt-2 flex gap-2">
      <input value={title} onChange={(e)=>setTitle(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-slate-900/60 text-white border border-slate-700" placeholder="Ny oppgave" />
      <button onClick={submit} className="bg-blue-600 text-white px-3 py-2 rounded-lg">Legg til</button>
    </div>
  );
}

function CommentForm({ projectId, timelineItemId, headers, onAdded }) {
  const [content, setContent] = useState("");
  const submit = async () => {
    if (!content) return;
    await fetch(`${backend}/comments`, { method: "POST", headers, body: JSON.stringify({ project_id: projectId, timeline_item_id: timelineItemId, content }) });
    setContent("");
    onAdded();
  };
  return (
    <div className="flex gap-2">
      <input value={content} onChange={(e)=>setContent(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-slate-900/60 text-white border border-slate-700" placeholder="Skriv en kommentar" />
      <button onClick={submit} className="bg-blue-600 text-white px-3 py-2 rounded-lg">Send</button>
    </div>
  );
}

function DocumentForm({ projectId, timelineItemId, headers, onAdded }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const submit = async () => {
    if (!name || !url) return;
    await fetch(`${backend}/documents`, { method: "POST", headers, body: JSON.stringify({ project_id: projectId, timeline_item_id: timelineItemId, name, url }) });
    setName("");
    setUrl("");
    onAdded();
  };
  return (
    <div className="flex gap-2">
      <input value={name} onChange={(e)=>setName(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-slate-900/60 text-white border border-slate-700" placeholder="Dokumentnavn" />
      <input value={url} onChange={(e)=>setUrl(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-slate-900/60 text-white border border-slate-700" placeholder="URL" />
      <button onClick={submit} className="bg-blue-600 text-white px-3 py-2 rounded-lg">Legg til</button>
    </div>
  );
}
