// Dashboard.jsx
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, FolderOpen, FileText, Plus, Download, ArrowRight, TrendingUp, Tag, Clock, Sparkles } from "lucide-react";
import { useNotes } from "../Context/NotesContext";
import ClickSpark from "../Components/ClickSpark";

export default function Dashboard() {
  const { notes = [], loading, error } = useNotes();
  const [searchQuery, setSearchQuery] = useState("");

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
      {/* Hero Section with Gradient */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-linear-to-r from-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-8 overflow-hidden"
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl font-bold text-white mb-3 flex items-center gap-3"
              >
                Welcome back! <span className="animate-wave">👋</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-indigo-100 max-w-2xl text-lg"
              >
                Continue your learning journey. Here's a quick summary of your notes and activity.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 flex flex-wrap gap-3"
              >
                <ClickSpark sparkColor="#fff" sparkCount={8}>
                  <button className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition cursor-target">
                    <Plus className="w-5 h-5" />
                    Create Note
                  </button>
                </ClickSpark>

                <ClickSpark sparkColor="#fff" sparkCount={6}>
                  <button
                    onClick={exportCSV}
                    className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition cursor-target"
                  >
                    <Download className="w-5 h-5" />
                    Export CSV
                  </button>
                </ClickSpark>
              </motion.div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 cursor-target"
              >
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5 text-white" />
                  <div className="text-xs text-indigo-100">Total Notes</div>
                </div>
                <div className="text-3xl font-bold text-white">{totals.totalNotes}</div>
                <div className="text-xs text-indigo-200 mt-1">Recent: {recentNotes.length}</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 cursor-target"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Tag className="w-5 h-5 text-white" />
                  <div className="text-xs text-indigo-100">Tags</div>
                </div>
                <div className="text-3xl font-bold text-white">{totals.tagCount}</div>
                <div className="text-xs text-indigo-200 mt-1">Categories</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 cursor-target"
              >
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-white" />
                  <div className="text-xs text-indigo-100">Avg / Week</div>
                </div>
                <div className="text-3xl font-bold text-white">{totals.avgPerWeek}</div>
                <div className="text-xs text-indigo-200 mt-1 flex items-center gap-2">
                  <Sparkline points={activity} />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 cursor-target"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-white" />
                  <div className="text-xs text-indigo-100">Folders</div>
                </div>
                <div className="text-3xl font-bold text-white">{folderCounts.length}</div>
                <div className="text-xs text-indigo-200 mt-1">Categories</div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Notes - Takes 2 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              Recent Notes
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes..."
                  className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm w-64 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition cursor-target"
                />
              </div>
            </div>
          </div>

          {loading && <p className="text-sm text-gray-500">Loading notes...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotes.slice(0, 6).map((note, index) => (
              <motion.article
                key={note._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="border border-gray-200 rounded-2xl p-5 hover:shadow-2xl hover:border-indigo-300 transition-all cursor-pointer bg-white cursor-target group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition">
                      {note.title}
                    </h3>
                    <div className="text-xs text-gray-500 mt-1">
                      {note.folder || "General"} • {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : ""}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {note.structuredNotes?.summary || (note.fullContent || note.content || "").slice(0, 160)}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {(note.structuredNotes?.tags || note.tags || []).slice(0, 2).map((t) => (
                      <span key={t} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <ClickSpark sparkColor="#6366f1" sparkCount={4} sparkRadius={10}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
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
                      className="p-2 bg-gray-100 rounded-lg hover:bg-indigo-100 transition cursor-target"
                    >
                      <Download className="w-4 h-4 text-gray-600" />
                    </button>
                  </ClickSpark>
                </div>
              </motion.article>
            ))}

            {!loading && filteredNotes.length === 0 && (
              <div className="col-span-full text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No notes match your search.</p>
                <p className="text-gray-400 text-sm">Try creating new notes or generate from a transcript.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions Sidebar - Takes 1 column */}
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* Quick Actions */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <ClickSpark sparkColor="#6366f1" sparkCount={6}>
                <button className="w-full px-4 py-3 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition cursor-target">
                  Generate New Notes
                </button>
              </ClickSpark>
              <ClickSpark sparkColor="#6366f1" sparkCount={4}>
                <button className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition cursor-target flex items-center justify-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Browse All Notes
                </button>
              </ClickSpark>
              <ClickSpark sparkColor="#6366f1" sparkCount={4}>
                <button
                  onClick={exportCSV}
                  className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition cursor-target flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Export All Data
                </button>
              </ClickSpark>
            </div>
          </div>

          {/* Folders Breakdown */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📁 Folders</h3>
            <FolderBarChart data={folderCounts} />
          </div>

          {/* Top Tags */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🏷️ Top Tags</h3>
            <div className="flex flex-wrap gap-2">
              {topTags.length === 0 && <p className="text-xs text-gray-500">No tags yet</p>}
              {topTags.map((t) => (
                <motion.button
                  key={t.tag}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSearchQuery(t.tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-target ${
                    t.count > 3
                      ? "bg-indigo-600 text-white"
                      : "bg-indigo-50 text-indigo-700"
                  }`}
                  title={`${t.count} notes`}
                >
                  #{t.tag} {t.count > 1 && <span className="ml-1 opacity-70">({t.count})</span>}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Activity Chart */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Activity (14 days)</h3>
            <div className="flex items-center justify-between">
              <Sparkline points={activity} />
              <div className="text-right">
                <div className="text-2xl font-bold text-indigo-600">
                  {activity.reduce((a, b) => a + b, 0)}
                </div>
                <div className="text-xs text-gray-500">notes</div>
              </div>
            </div>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
