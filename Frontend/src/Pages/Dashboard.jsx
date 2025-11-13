// Dashboard.jsx
import { useMemo, useState } from "react";
import { Search, FolderOpen, FileText, Plus, Download, ArrowRight } from "lucide-react";
import { useNotes } from "../Context/NotesContext";
import { useNavigate } from "react-router-dom"; // optional if you use react-router

export default function Dashboard() {
  const { notes = [], loading, error } = useNotes();
  const [searchQuery, setSearchQuery] = useState("");
  // Call useNavigate unconditionally (hook) but guard runtime errors
  // (e.g. when not inside a Router) and fall back to null.
  let navigate;
  try {
    navigate = useNavigate();
  } catch (err) {
    navigate = null;
  }

  // ----- Filtering for small preview on the dashboard -----
  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter((note) => {
      const titleMatch = note.title?.toLowerCase().includes(q);
      const tagMatch = (note.structuredNotes?.tags || note.tags || []).some((tag) =>
        tag?.toLowerCase().includes(q)
      );
      const contentMatch = (note.fullContent || note.content || "").toLowerCase().includes(q);
      return titleMatch || tagMatch || contentMatch;
    });
  }, [notes, searchQuery]);

  // ----- KPI Calculations -----
  const totals = useMemo(() => {
    const totalNotes = notes.length;
    const pinned = notes.filter((n) => n.isPinned).length;
    const allTags = notes.flatMap((n) => (n.structuredNotes?.tags || n.tags || []));
    const uniqueTags = Array.from(new Set(allTags.map((t) => t?.toLowerCase()).filter(Boolean)));
    // average notes per week (last 12 weeks)
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const last12Weeks = notes.filter((n) => new Date(n.createdAt).getTime() > now - 12 * oneWeek);
    const avgPerWeek = Math.round((last12Weeks.length / 12) * 10) / 10;
    return { totalNotes, pinned, tagCount: uniqueTags.length, avgPerWeek };
  }, [notes]);

  // ----- Folder breakdown (counts) -----
  const folderCounts = useMemo(() => {
    const map = {};
    for (const n of notes) {
      const f = (n.folder || "General").trim();
      map[f] = (map[f] || 0) + 1;
    }
    // convert to sorted array
    const arr = Object.entries(map).map(([folder, count]) => ({ folder, count }));
    arr.sort((a, b) => b.count - a.count);
    return arr;
  }, [notes]);

  // ----- Top tags -----
  const topTags = useMemo(() => {
    const freq = {};
    for (const n of notes) {
      const tags = n.structuredNotes?.tags || n.tags || [];
      for (const t of tags || []) {
        if (!t) continue;
        const k = t.toLowerCase();
        freq[k] = (freq[k] || 0) + 1;
      }
    }
    const arr = Object.entries(freq).map(([tag, count]) => ({ tag, count }));
    arr.sort((a, b) => b.count - a.count);
    return arr.slice(0, 24);
  }, [notes]);

  // ----- Recent activity sparkline: notes per day (last 14 days) -----
  const activity = useMemo(() => {
    const days = 14;
    const buckets = new Array(days).fill(0);
    const now = new Date();
    for (const n of notes) {
      const d = n.createdAt ? new Date(n.createdAt) : null;
      if (!d) continue;
      const diffDays = Math.floor((now - d) / (24 * 60 * 60 * 1000));
      if (diffDays >= 0 && diffDays < days) buckets[days - 1 - diffDays]++; // newest on right
    }
    return buckets;
  }, [notes]);

  // ----- Recent notes (most recent 6) -----
  const recentNotes = useMemo(() => {
    return [...notes]
      .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0))
      .slice(0, 6);
  }, [notes]);

  // ----- Utility: Export all notes CSV -----
  const exportCSV = () => {
    const header = ["_id", "title", "folder", "createdAt", "tags", "summary", "content"];
    const rows = notes.map((n) => [
      n._id,
      `"${(n.title || "").replace(/"/g, '""')}"`,
      `"${(n.folder || "General").replace(/"/g, '""')}"`,
      n.createdAt || n.updatedAt || "",
      `"${((n.structuredNotes?.tags || n.tags || []) || []).join("|").replace(/"/g, '""')}"`,
      `"${(n.structuredNotes?.summary || "").replace(/"/g, '""')}"`,
      `"${(n.fullContent || n.content || "").replace(/"/g, '""')}"`,
    ]);
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `edunote_export_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ----- Small SVG bar chart for folders (simple) -----
  const FolderBarChart = ({ data }) => {
    if (!data || data.length === 0) return <p className="text-sm text-gray-500">No folder data</p>;
    const max = Math.max(...data.map((d) => d.count));
    return (
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.folder} className="flex items-center gap-3">
            <div className="w-28 text-sm text-gray-600">{d.folder}</div>
            <div className="flex-1 bg-gray-100 h-3 rounded overflow-hidden">
              <div
                style={{ width: `${(d.count / max) * 100}%` }}
                className="h-3 bg-indigo-500 rounded"
              />
            </div>
            <div className="w-10 text-right text-sm text-gray-700">{d.count}</div>
          </div>
        ))}
      </div>
    );
  };

  // ----- Small sparkline SVG (activity) -----
  const Sparkline = ({ points }) => {
    const w = 120;
    const h = 36;
    const max = Math.max(...points, 1);
    const stepX = w / Math.max(1, points.length - 1);
    const path = points.map((v, i) => `${i === 0 ? "M" : "L"} ${i * stepX} ${h - (v / max) * h}`).join(" ");
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="inline-block align-middle">
        <path d={path} fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* small dots */}
        {points.map((v, i) => (
          <circle key={i} cx={i * stepX} cy={h - (v / max) * h} r={1.6} fill="#4f46e5" />
        ))}
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-linear-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white lg:flex lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
          <p className="text-indigo-100 max-w-2xl">
            Continue your learning journey. Here's a quick summary of your notes and activity.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => navigate ? navigate("/notes/new") : window.location.assign("/notes/new")}
              className="inline-flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-xl font-medium shadow"
            >
              <Plus className="w-4 h-4" />
              Create Note
            </button>
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 bg-indigo-700/20 hover:bg-indigo-700/25 text-white px-4 py-2 rounded-xl"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => navigate ? navigate("/notes") : window.location.assign("/notes")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-white rounded-xl"
            >
              View All Notes
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 lg:mt-0 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* KPI cards */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="text-xs text-indigo-100">Total notes</div>
            <div className="text-2xl font-bold">{totals.totalNotes}</div>
            <div className="text-xs text-indigo-100 mt-2">Recent: {recentNotes.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="text-xs text-indigo-100">Pinned</div>
            <div className="text-2xl font-bold">{totals.pinned}</div>
            <div className="text-xs text-indigo-100 mt-2">Keep important notes handy</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="text-xs text-indigo-100">Tags</div>
            <div className="text-2xl font-bold">{totals.tagCount}</div>
            <div className="text-xs text-indigo-100 mt-2">Top tags below</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="text-xs text-indigo-100">Avg / week</div>
            <div className="text-2xl font-bold">{totals.avgPerWeek}</div>
            <div className="text-xs text-indigo-100 mt-2">
              Activity
              <span className="ml-2 inline-block align-middle">
                <Sparkline points={activity} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent notes preview */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent notes</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your recent notes..."
                  className="pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm w-64"
                />
              </div>
              <button
                onClick={() => navigate ? navigate("/notes") : window.location.assign("/notes")}
                className="px-3 py-2 bg-gray-100 rounded-xl text-sm"
              >
                <FolderOpen className="w-4 h-4 inline-block mr-1" /> All notes
              </button>
            </div>
          </div>

          {loading && <p className="text-sm text-gray-500">Loading notes...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotes.slice(0, 6).map((note) => (
              <article
                key={note._id}
                className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition cursor-pointer"
                onClick={() => (navigate ? navigate(`/notes/${note._id}`) : (window.location.href = `/notes/${note._id}`))}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{note.title}</h3>
                      <div className="text-xs text-gray-500 mt-1">
                        {note.folder || "General"} • {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : ""}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-3">{note.structuredNotes?.summary || (note.fullContent || note.content || "").slice(0, 160)}</p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex gap-2">
                    {(note.structuredNotes?.tags || note.tags || []).slice(0, 3).map((t) => (
                      <span key={t} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs">#{t}</span>
                    ))}
                  </div>
                  <div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // quick export single note
                        const text = note.fullContent || note.content || note.structuredNotes?.summary || "";
                        const blob = new Blob([text], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${(note.title || "note").replace(/\s+/g, "_")}.txt`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(url);
                      }}
                      className="px-2 py-1 bg-gray-100 rounded text-xs"
                    >
                      <Download className="w-3 h-3 inline-block mr-1" /> Export
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {/* If none */}
            {!loading && filteredNotes.length === 0 && (
              <div className="col-span-full text-center py-8 text-sm text-gray-500">
                No notes match your search. Try creating new notes or generate from a transcript.
              </div>
            )}
          </div>
        </div>

        {/* Right: Insights */}
        <aside className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Insights</h3>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Folders</p>
            <FolderBarChart data={folderCounts} />
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Top tags</p>
            <div className="flex flex-wrap gap-2">
              {topTags.length === 0 && <p className="text-xs text-gray-500">No tags yet</p>}
              {topTags.map((t) => (
                <button
                  key={t.tag}
                  onClick={() => setSearchQuery(t.tag)}
                  className={`px-3 py-1 rounded-full text-xs ${t.count > 3 ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-700"}`}
                  title={`${t.count} notes`}
                >
                  #{t.tag} {t.count > 1 && <span className="text-xs ml-1 opacity-70">({t.count})</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-2">Recent activity (last 14 days)</p>
            <div className="flex items-center justify-between">
              <Sparkline points={activity} />
              <div className="text-right">
                <div className="text-sm font-semibold">{activity.reduce((a, b) => a + b, 0)}</div>
                <div className="text-xs text-gray-500">notes</div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-500">
            Tip: click a tag to quickly filter results. Use Export CSV to backup all notes.
          </div>
        </aside>
      </div>
    </div>
  );
}
