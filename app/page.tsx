
"use client";

import { useEffect, useMemo, useState } from "react";

type Priority = "Low" | "Medium" | "High";
type Category = "Work" | "Personal" | "Study" | "Health";

type Task = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: Priority;
  category: Category;
  dueDate: string;
  createdAt: number;
};

const STORAGE_KEY = "taskzenia-futuristic-v1";

const initialTasks: Task[] = [
  {
    id: "demo-1",
    title: "Finish the important project",
    description: "Focus on the next milestone and review progress.",
    completed: false,
    priority: "High",
    category: "Work",
    dueDate: "",
    createdAt: Date.now(),
  },
  {
    id: "demo-2",
    title: "Learn something new",
    description: "Spend some time building a useful skill.",
    completed: false,
    priority: "Medium",
    category: "Study",
    dueDate: "",
    createdAt: Date.now() - 1000,
  },
  {
    id: "demo-3",
    title: "Take a proper break",
    description: "Recharge your energy and clear your mind.",
    completed: true,
    priority: "Low",
    category: "Health",
    dueDate: "",
    createdAt: Date.now() - 2000,
  },
];

const navItems = [
  { id: "all", label: "Overview", icon: "◈" },
  { id: "today", label: "Today", icon: "◷" },
  { id: "upcoming", label: "Upcoming", icon: "▦" },
  { id: "completed", label: "Completed", icon: "✓" },
];

const categoryColors: Record<Category, string> = {
  Work: "text-violet-300 bg-violet-400/10 border-violet-400/20",
  Personal: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20",
  Study: "text-amber-300 bg-amber-400/10 border-amber-400/20",
  Health: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
};

const priorityColors: Record<Priority, string> = {
  High: "text-rose-300 bg-rose-400/10",
  Medium: "text-amber-300 bg-amber-400/10",
  Low: "text-emerald-300 bg-emerald-400/10",
};

function todayString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatDate(date: string) {
  if (!date) return "No deadline";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [loaded, setLoaded] = useState(false);
  const [activeView, setActiveView] = useState("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("Work");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [dueDate, setDueDate] = useState("");
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [notice, setNotice] = useState("");

useEffect(() => {
  setToday(todayString());
}, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setTasks(parsed);
      }
    } catch {
      // Start with demo tasks if stored data cannot be read.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // The app remains usable if browser storage is unavailable.
    }
  }, [tasks, loaded]);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setFocusSeconds((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(interval);
          setTimerRunning(false);
          setNotice("Focus session complete. Take a short break!");
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

const [today, setToday] = useState("");

  const completedCount = tasks.filter((task) => task.completed).length;
  const remainingCount = tasks.length - completedCount;
  const progress =
    tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  const todayTasks = tasks.filter(
    (task) => !task.dueDate || task.dueDate === today
  );

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (
          activeView === "today" &&
          task.dueDate &&
          task.dueDate !== today
        ) return false;

        if (activeView === "upcoming" && (!task.dueDate || task.dueDate <= today))
          return false;

        if (activeView === "completed" && !task.completed) return false;

        if (categoryFilter !== "All" && task.category !== categoryFilter)
          return false;

        if (priorityFilter !== "All" && task.priority !== priorityFilter)
          return false;

        const query = search.toLowerCase();
        return (
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
        const rank = { High: 0, Medium: 1, Low: 2 };
        return rank[a.priority] - rank[b.priority] || b.createdAt - a.createdAt;
      });
  }, [tasks, activeView, categoryFilter, priorityFilter, search, today]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setCategory("Work");
    setPriority("Medium");
    setDueDate("");
    setEditingId(null);
    setShowForm(false);
  }

  function saveTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    if (editingId) {
      setTasks((current) =>
        current.map((task) =>
          task.id === editingId
            ? { ...task, title: cleanTitle, description: description.trim(), category, priority, dueDate }
            : task
        )
      );
      setNotice("Task updated successfully.");
    } else {
      const newTask: Task = {
        id: makeId(),
        title: cleanTitle,
        description: description.trim(),
        completed: false,
        category,
        priority,
        dueDate,
        createdAt: Date.now(),
      };
      setTasks((current) => [newTask, ...current]);
      setNotice("Your new task is ready.");
    }
    resetForm();
  }

  function editTask(task: Task) {
    setTitle(task.title);
    setDescription(task.description);
    setCategory(task.category);
    setPriority(task.priority);
    setDueDate(task.dueDate);
    setEditingId(task.id);
    setShowForm(true);
  }

  function toggleTask(id: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }

  function deleteTask(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id));
    setNotice("Task deleted.");
  }

  function clearCompleted() {
    setTasks((current) => current.filter((task) => !task.completed));
    setNotice("Completed tasks cleared.");
  }

  function resetDemo() {
    setTasks([]);
    setNotice("Your task list is now clear.");
  }

  function resetTimer() {
    setTimerRunning(false);
    setFocusSeconds(25 * 60);
  }

  const timerDisplay = `${String(Math.floor(focusSeconds / 60)).padStart(2, "0")}:${String(focusSeconds % 60).padStart(2, "0")}`;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080914] text-slate-100 selection:bg-violet-500/40">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-48 -top-40 h-[480px] w-[480px] rounded-full bg-violet-700/15 blur-[130px]" />
        <div className="absolute right-[-180px] top-[25%] h-[420px] w-[420px] rounded-full bg-indigo-600/10 blur-[130px]" />
        <div className="absolute bottom-[-180px] left-[35%] h-[350px] w-[350px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)", backgroundSize: "42px 42px" }} />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[250px] shrink-0 flex-col border-r border-white/[0.07] bg-black/10 p-6 lg:flex">
          <div className="mb-12 flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-300/30 bg-gradient-to-br from-violet-500 to-indigo-700 text-2xl font-black shadow-lg shadow-violet-900/40">
              <span className="absolute inset-x-2 top-1 h-3 rounded-full bg-white/20 blur-sm" />
              <span className="relative">✓</span>
            </div>
            <div>
              <div className="text-xl font-black tracking-tight">Task<span className="text-violet-400">zenia</span></div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Personal workspace</div>
            </div>
          </div>

          <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-600">Workspace</div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${activeView === item.id ? "border border-violet-400/20 bg-violet-500/10 font-semibold text-violet-200 shadow-[inset_0_0_20px_rgba(139,92,246,.04)]" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"}`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.id === "today" && <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs">{todayTasks.length}</span>}
                {item.id === "completed" && <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs">{completedCount}</span>}
              </button>
            ))}
          </nav>

          <div className="mb-3 mt-9 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-600">Categories</div>
          <div className="space-y-2 px-3">
            {(["Work", "Personal", "Study", "Health"] as Category[]).map((item) => (
              <button key={item} onClick={() => { setCategoryFilter(item); setActiveView("all"); }} className="flex w-full items-center gap-3 text-sm text-slate-400 transition hover:text-white">
                <span className={`h-2 w-2 rounded-full ${item === "Work" ? "bg-violet-400" : item === "Personal" ? "bg-cyan-400" : item === "Study" ? "bg-amber-400" : "bg-emerald-400"}`} />
                {item}
              </button>
            ))}
            <button onClick={() => setCategoryFilter("All")} className="pt-1 text-xs text-slate-600 transition hover:text-violet-300">Show all categories</button>
          </div>

          <div className="mt-auto rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.12] to-indigo-500/[0.04] p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-violet-200"><span>✦</span> YOUR MOMENTUM</div>
            <div className="text-2xl font-bold">{progress}%</div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">Every completed task is progress. Keep going.</p>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-4 py-5 sm:px-7 sm:py-8 lg:px-10">
          <header className="mb-9 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs font-medium text-violet-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                YOUR PRODUCTIVITY SPACE
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Your day, <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">reimagined.</span></h1>
             <p className="mt-2 text-sm text-slate-500">
  {today
    ? new Date(`${today}T12:00:00`).toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Your day starts here"}
  <span className="mx-2 text-slate-700">/</span> Make space for what matters.
</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 sm:block">
                <div className="text-[10px] uppercase tracking-widest text-slate-600">Tasks done</div>
                <div className="mt-0.5 text-sm font-semibold">{completedCount} <span className="text-slate-600">/ {tasks.length}</span></div>
              </div>
              <button onClick={() => { setShowForm(true); setEditingId(null); setTitle(""); }} className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-950/40 transition hover:-translate-y-0.5 hover:shadow-violet-900/60">
                <span className="mr-2">＋</span> New task
              </button>
            </div>
          </header>

          {notice && (
            <div className="mb-5 flex items-center justify-between rounded-xl border border-violet-400/20 bg-violet-500/[0.08] px-4 py-3 text-sm text-violet-200">
              {notice}
              <button onClick={() => setNotice("")} className="ml-4 text-violet-300 hover:text-white">✕</button>
            </div>
          )}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 transition hover:border-violet-400/25">
              <div className="absolute -right-5 -top-8 h-28 w-28 rounded-full bg-violet-500/10 blur-2xl" />
              <div className="relative flex items-start justify-between"><span className="text-sm text-slate-400">Total tasks</span><span className="rounded-lg bg-violet-400/10 px-2.5 py-1 text-violet-300">◈</span></div>
              <div className="relative mt-4 text-4xl font-bold tracking-tight">{tasks.length.toString().padStart(2, "0")}</div>
              <div className="relative mt-2 text-xs text-slate-600">Everything on your radar</div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 transition hover:border-cyan-400/25">
              <div className="absolute -right-5 -top-8 h-28 w-28 rounded-full bg-cyan-500/10 blur-2xl" />
              <div className="relative flex items-start justify-between"><span className="text-sm text-slate-400">Completed</span><span className="rounded-lg bg-cyan-400/10 px-2.5 py-1 text-cyan-300">✓</span></div>
              <div className="relative mt-4 text-4xl font-bold tracking-tight">{completedCount.toString().padStart(2, "0")}</div>
              <div className="relative mt-2 text-xs text-slate-600">{progress}% overall completion</div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 transition hover:border-amber-400/25">
              <div className="absolute -right-5 -top-8 h-28 w-28 rounded-full bg-amber-500/10 blur-2xl" />
              <div className="relative flex items-start justify-between"><span className="text-sm text-slate-400">In progress</span><span className="rounded-lg bg-amber-400/10 px-2.5 py-1 text-amber-300">◷</span></div>
              <div className="relative mt-4 text-4xl font-bold tracking-tight">{remainingCount.toString().padStart(2, "0")}</div>
              <div className="relative mt-2 text-xs text-slate-600">Your next wins are waiting</div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Your workflow</div>
                  <h2 className="mt-1 text-lg font-bold">Task universe</h2>
                </div>
                <span className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-slate-500">{filteredTasks.length} shown</span>
              </div>

              <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">⌕</span>
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your tasks..." className="w-full rounded-xl border border-white/[0.08] bg-black/20 py-3 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-violet-400/50" />
                </div>
                <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="rounded-xl border border-white/[0.08] bg-[#11111f] px-3 py-3 text-sm text-slate-300 outline-none focus:border-violet-400/50">
                  <option value="All">All priorities</option>
                  <option value="High">High priority</option>
                  <option value="Medium">Medium priority</option>
                  <option value="Low">Low priority</option>
                </select>
              </div>

              <div className="mb-5 flex flex-wrap gap-2">
                {navItems.map((item) => (
                  <button key={item.id} onClick={() => setActiveView(item.id)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${activeView === item.id ? "bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/20" : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-200"}`}>{item.label}</button>
                ))}
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="ml-auto rounded-lg border border-white/[0.08] bg-[#11111f] px-3 py-2 text-xs text-slate-400 outline-none">
                  <option value="All">All categories</option>
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Study">Study</option>
                  <option value="Health">Health</option>
                </select>
              </div>

              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div key={task.id} className={`group rounded-xl border p-4 transition-all hover:border-violet-400/25 ${task.completed ? "border-white/[0.04] bg-black/10 opacity-70" : "border-white/[0.07] bg-white/[0.025] hover:bg-violet-500/[0.035]"}`}>
                    <div className="flex items-start gap-3">
                      <button aria-label={task.completed ? "Mark incomplete" : "Complete task"} onClick={() => toggleTask(task.id)} className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${task.completed ? "border-violet-400 bg-violet-500 text-white" : "border-slate-600 hover:border-violet-400 hover:bg-violet-400/10"}`}>{task.completed ? "✓" : ""}</button>
                      <div className="min-w-0 flex-1">
                        <div className={`break-words text-sm font-semibold ${task.completed ? "text-slate-500 line-through" : "text-slate-100"}`}>{task.title}</div>
                        {task.description && <p className="mt-1 break-words text-xs leading-relaxed text-slate-500">{task.description}</p>}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className={`rounded-md border px-2 py-1 text-[10px] font-semibold ${categoryColors[task.category]}`}>{task.category}</span>
                          <span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${priorityColors[task.priority]}`}>{task.priority} priority</span>
                          {task.dueDate && <span className={`text-[10px] ${!task.completed && task.dueDate < today ? "text-rose-300" : "text-slate-500"}`}>◷ {formatDate(task.dueDate)}{!task.completed && task.dueDate < today ? " · Overdue" : ""}</span>}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                        <button aria-label="Edit task" onClick={() => editTask(task)} className="rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-violet-400/10 hover:text-violet-200">Edit</button>
                        <button aria-label="Delete task" onClick={() => deleteTask(task.id)} className="rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-rose-400/10 hover:text-rose-300">✕</button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredTasks.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/[0.1] px-5 py-12 text-center">
                    <div className="mb-3 text-3xl text-violet-300">✧</div>
                    <div className="font-semibold text-slate-300">Nothing on your radar</div>
                    <p className="mt-1 text-sm text-slate-600">Try another filter or create a fresh task.</p>
                    <button onClick={() => { setShowForm(true); setTitle(""); setEditingId(null); }} className="mt-4 text-sm font-semibold text-violet-300 hover:text-white">＋ Create a task</button>
                  </div>
                )}
              </div>

              {completedCount > 0 && (
                <button onClick={clearCompleted} className="mt-5 text-xs text-slate-600 transition hover:text-rose-300">Clear completed tasks</button>
              )}
            </div>

            <div className="space-y-5">
              <div className="relative overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.12] via-[#171328] to-[#10101d] p-5 sm:p-6">
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border border-violet-400/10" />
                <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full border border-violet-400/10" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Focus chamber</div>
                    <h2 className="mt-1 text-lg font-bold">Deep work</h2>
                  </div>
                  <span className="text-2xl text-violet-300">◎</span>
                </div>
                <div className="relative my-7 flex justify-center">
                  <div className="flex h-44 w-44 items-center justify-center rounded-full border border-violet-400/20 bg-[#0b0a17]/70 shadow-[0_0_50px_rgba(139,92,246,.12)]">
                    <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full border border-white/[0.06]">
                      <div className="text-4xl font-light tracking-widest tabular-nums">{timerDisplay}</div>
                      <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Focus time</div>
                    </div>
                  </div>
                </div>
                <div className="relative flex gap-2">
                  <button onClick={() => { if (focusSeconds === 0) setFocusSeconds(25 * 60); setTimerRunning((running) => !running); }} className="flex-1 rounded-xl bg-violet-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-400">{timerRunning ? "Ⅱ  Pause session" : "▶  Start focus"}</button>
                  <button onClick={resetTimer} aria-label="Reset focus timer" className="rounded-xl border border-white/10 px-4 text-slate-400 transition hover:bg-white/5 hover:text-white">↺</button>
                </div>
                <p className="relative mt-3 text-center text-xs text-slate-600">A simple 25-minute focus session.</p>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Your momentum</div>
                    <h2 className="mt-1 text-lg font-bold">Completion rate</h2>
                  </div>
                  <span className="text-xl text-cyan-300">↗</span>
                </div>
                <div className="mt-6 flex items-center gap-5">
                  <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(#8b5cf6 ${progress}%, rgba(255,255,255,.07) ${progress}% 100%)` }}>
                    <div className="flex h-[76px] w-[76px] flex-col items-center justify-center rounded-full bg-[#10101b]">
                      <span className="text-xl font-bold">{progress}%</span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-600">Complete</span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex justify-between text-xs"><span className="text-slate-500">Completed</span><span className="font-semibold text-cyan-300">{completedCount}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-500">Remaining</span><span className="font-semibold text-violet-300">{remainingCount}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-500">Categories</span><span className="font-semibold text-slate-300">{new Set(tasks.map((task) => task.category)).size}</span></div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Quick actions</div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => { setShowForm(true); setEditingId(null); setTitle(""); setCategory("Study"); }} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-left transition hover:border-violet-400/30 hover:bg-violet-400/[0.05]"><div className="mb-2 text-lg text-violet-300">＋</div><div className="text-xs font-semibold">New task</div><div className="mt-1 text-[10px] text-slate-600">Capture an idea</div></button>
                  <button onClick={() => { setActiveView("today"); setCategoryFilter("All"); setPriorityFilter("All"); setSearch(""); }} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-left transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.05]"><div className="mb-2 text-lg text-cyan-300">◷</div><div className="text-xs font-semibold">Today's view</div><div className="mt-1 text-[10px] text-slate-600">See your agenda</div></button>
                  <button onClick={() => { setActiveView("completed"); setCategoryFilter("All"); setPriorityFilter("All"); setSearch(""); }} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-left transition hover:border-emerald-400/30 hover:bg-emerald-400/[0.05]"><div className="mb-2 text-lg text-emerald-300">✓</div><div className="text-xs font-semibold">Achievements</div><div className="mt-1 text-[10px] text-slate-600">Review your wins</div></button>
                  <button onClick={() => { setSearch(""); setCategoryFilter("All"); setPriorityFilter("All"); setActiveView("all"); }} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-left transition hover:border-amber-400/30 hover:bg-amber-400/[0.05]"><div className="mb-2 text-lg text-amber-300">⌕</div><div className="text-xs font-semibold">Reset filters</div><div className="mt-1 text-[10px] text-slate-600">See everything</div></button>
                </div>
              </div>
            </div>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] py-5 text-xs text-slate-600">
            <span>Taskzenia <span className="text-violet-400">◆</span> Make every moment count.</span>
            <span>Local storage enabled · Your tasks stay in this browser</span>
            <button onClick={resetDemo} className="text-slate-700 transition hover:text-rose-300">Clear all tasks</button>
          </footer>
        </section>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-md" onMouseDown={(event) => { if (event.target === event.currentTarget) resetForm(); }}>
          <div className="my-auto w-full max-w-lg rounded-2xl border border-violet-400/20 bg-[#11111e] p-5 shadow-2xl shadow-violet-950/40 sm:p-7">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">{editingId ? "Refine your plan" : "Make it happen"}</div>
                <h2 className="mt-1 text-2xl font-bold">{editingId ? "Edit task" : "Create a task"}</h2>
                <p className="mt-1 text-sm text-slate-500">Give your next action a clear direction.</p>
              </div>
              <button onClick={resetForm} aria-label="Close form" className="rounded-lg px-3 py-2 text-slate-500 hover:bg-white/5 hover:text-white">✕</button>
            </div>
            <form onSubmit={saveTask} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-400">Task title *</label>
                <input autoFocus required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What do you want to accomplish?" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-violet-400/50" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-400">Description</label>
                <textarea maxLength={500} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add details, notes, or your next step..." className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-violet-400/50" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-400">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="w-full rounded-xl border border-white/10 bg-[#0b0b15] px-3 py-3 text-sm outline-none focus:border-violet-400/50">
                    <option value="Work">Work</option><option value="Personal">Personal</option><option value="Study">Study</option><option value="Health">Health</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-400">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-full rounded-xl border border-white/10 bg-[#0b0b15] px-3 py-3 text-sm outline-none focus:border-violet-400/50">
                    <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-400">Due date (optional)</label>
                <input type="date" min={today} value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300 outline-none focus:border-violet-400/50" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white">Cancel</button>
                <button type="submit" className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110">{editingId ? "Save changes" : "Create task →"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {focusMode && (
        <div className="fixed bottom-5 right-5 z-40 rounded-xl border border-violet-400/20 bg-[#11111e] px-4 py-3 text-sm shadow-xl">
          Focus mode is active.
          <button onClick={() => setFocusMode(false)} className="ml-3 text-violet-300">Exit</button>
        </div>
      )}
    </main>
  );
}

