import React from "react";
import { BookOpen, Layers, Users, Type, CheckCircle2, Server } from "lucide-react";

export function DsaExplanationView() {
  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="rounded-2xl bg-navy-950 text-white p-6 shadow-sm border border-navy-900">
        <div className="flex items-center gap-2.5 text-teal-400 text-xs font-mono font-bold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          DSA Project Academic Documentation
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white mt-1">
          Data Structures &amp; Algorithms Implemented in CareQueue
        </h2>
        <p className="mt-2 text-xs text-slate-300 max-w-2xl leading-relaxed">
          This system replaces standard library collections with custom Java data structures to demonstrate 
          First-In First-Out (FIFO) Queues, Last-In First-Out (LIFO) Stacks, Singly Linked Lists, 
          and robust String manipulation for real-world healthcare workflow orchestration.
        </p>
      </div>

      {/* Grid of Concept Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Custom LinkedPatientQueue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">1. Singly-Linked FIFO Queue</h3>
              <code className="text-[11px] text-teal-700 font-mono">com.carequeue.dsa.LinkedPatientQueue</code>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Maintains two private internal references (<code>head</code> and <code>tail</code>) and an exact <code>size</code> counter. 
            Does not use <code>java.util.Queue</code> or <code>LinkedList</code>.
          </p>

          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Enqueue (Tail Insertion):</strong> Appends new patients to tail in <strong>O(1)</strong> constant time.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Dequeue (Head Removal):</strong> Advances head pointer to call the next patient in <strong>O(1)</strong> constant time.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Remove by ID:</strong> Reliably splices head, middle, or tail nodes in <strong>O(n)</strong> while maintaining pointer integrity.</span>
            </li>
          </ul>
        </div>

        {/* 2. Custom RecentCallsStack */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">2. Singly-Linked LIFO Stack</h3>
              <code className="text-[11px] text-indigo-700 font-mono">com.carequeue.dsa.RecentCallsStack&lt;T&gt;</code>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Maintains an internal <code>top</code> reference to store called patients in reverse chronological order.
            Does not use <code>java.util.Stack</code> or <code>ArrayDeque</code>.
          </p>

          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Push:</strong> Every successful call operation prepends the called patient snapshot in <strong>O(1)</strong>.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Peek:</strong> &quot;Repeat Last Call&quot; inspects the top node without mutating stack state or queue order.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Startup Reconstruction:</strong> Historical calls are loaded oldest to newest and pushed sequentially so the newest call is at the top.</span>
            </li>
          </ul>
        </div>

        {/* 3. Strings & Validation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">3. Java String Operations</h3>
              <code className="text-[11px] text-amber-700 font-mono">com.carequeue.dsa.StringUtil</code>
            </div>
          </div>

          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Whitespace Trimming:</strong> Removes leading and trailing whitespace while preserving inner spacing.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Unicode &amp; Accents:</strong> Preserves full Unicode formatting for non-English and accented names (e.g. José, Müller, आरव).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Search Normalization:</strong> Queries normalized using <code>Locale.ROOT</code> to prevent locale-specific casing anomalies.</span>
            </li>
          </ul>
        </div>

        {/* 4. State Synchronization & Persistence */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">4. Hybrid Architecture</h3>
              <code className="text-[11px] text-purple-700 font-mono">Persistence &amp; In-Memory Synchronization</code>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            The service layer coordinates in-memory custom data structures with PostgreSQL persistence:
          </p>

          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>All queue state is saved to the database upon registration, status transitions, and cancellations.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>On backend restart, custom DSA structures are automatically reconstructed from persisted records.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Complexity Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Time and Space Complexity Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Data Structure</th>
                <th className="py-2.5 px-3">Operation</th>
                <th className="py-2.5 px-3">Time Complexity</th>
                <th className="py-2.5 px-3">Space Complexity</th>
                <th className="py-2.5 px-3">Implementation Mechanism</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-800">LinkedPatientQueue</td>
                <td className="py-2.5 px-3 font-mono">enqueue()</td>
                <td className="py-2.5 px-3 font-bold text-teal-700">O(1)</td>
                <td className="py-2.5 px-3">O(1)</td>
                <td className="py-2.5 px-3">Tail pointer insertion</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-800">LinkedPatientQueue</td>
                <td className="py-2.5 px-3 font-mono">dequeue()</td>
                <td className="py-2.5 px-3 font-bold text-teal-700">O(1)</td>
                <td className="py-2.5 px-3">O(1)</td>
                <td className="py-2.5 px-3">Head pointer advancement</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-800">LinkedPatientQueue</td>
                <td className="py-2.5 px-3 font-mono">peek()</td>
                <td className="py-2.5 px-3 font-bold text-teal-700">O(1)</td>
                <td className="py-2.5 px-3">O(1)</td>
                <td className="py-2.5 px-3">Head node inspection</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-800">LinkedPatientQueue</td>
                <td className="py-2.5 px-3 font-mono">removeById()</td>
                <td className="py-2.5 px-3 font-bold text-amber-700">O(n)</td>
                <td className="py-2.5 px-3">O(1)</td>
                <td className="py-2.5 px-3">Linear singly-linked traversal</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-800">RecentCallsStack</td>
                <td className="py-2.5 px-3 font-mono">push()</td>
                <td className="py-2.5 px-3 font-bold text-teal-700">O(1)</td>
                <td className="py-2.5 px-3">O(1)</td>
                <td className="py-2.5 px-3">Top node prepending</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-800">RecentCallsStack</td>
                <td className="py-2.5 px-3 font-mono">pop() / peek()</td>
                <td className="py-2.5 px-3 font-bold text-teal-700">O(1)</td>
                <td className="py-2.5 px-3">O(1)</td>
                <td className="py-2.5 px-3">Top node reference access</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-800">RecentCallsStack</td>
                <td className="py-2.5 px-3 font-mono">toListNewestFirst()</td>
                <td className="py-2.5 px-3 font-bold text-amber-700">O(n)</td>
                <td className="py-2.5 px-3">O(n)</td>
                <td className="py-2.5 px-3">Top-to-bottom traversal snapshot</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
