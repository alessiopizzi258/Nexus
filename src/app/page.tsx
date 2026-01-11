'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Zap, FileUp, X, Eye, RefreshCw, MailOpen, Send, 
  ChevronLeft, ChevronRight, Search, ArrowUpRight, ShieldCheck 
} from 'lucide-react';
import Papa from 'papaparse';

const ALL_INDUSTRIES = [
  "Luxury Furniture", "Healthcare", "Tech Startup", "Real Estate", "Fintech", "SaaS", 
  "E-commerce", "Manufacturing", "Automotive", "Fashion & Apparel", "Food & Beverage",
  "Education", "Renewable Energy", "Legal Services", "Marketing & Ads", "Biotech",
  "Logistics", "Hospitality", "Cybersecurity", "Architecture", "Art & Design"
].sort();

export default function NexusDashboard() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedMail, setSelectedMail] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ 
    sent: 0, opened: 0, replied: 0, 
    deliverability: "100", healthStatus: "Excellent" 
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [targetIndustry, setTargetIndustry] = useState('all');
  const [campaignBrief, setCampaignBrief] = useState('');
  const [industrySearch, setIndustrySearch] = useState('');

  const filteredIndustries = useMemo(() => 
    ALL_INDUSTRIES.filter(i => i.toLowerCase().includes(industrySearch.toLowerCase())),
    [industrySearch]
  );

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      refreshAllData(1);
      setPage(1);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusFilter]);

  const refreshAllData = async (targetPage = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: targetPage.toString(),
        limit: '6',
        status: statusFilter,
        search: searchTerm
      });
      const [s, h] = await Promise.all([
        fetch('/api/stats'),
        fetch(`/api/automation/history?${params}`)
      ]);
      if (s.ok) setStats(await s.json());
      if (h.ok) {
        const historyData = await h.json();
        setLogs(historyData.data || []);
        setTotalPages(historyData.pagination?.totalPages || 1);
      }
    } finally {
      setLoading(false);
    }
  };

  const startAutomation = async () => {
    if (!campaignBrief) return alert("Definisci l'obiettivo della campagna prima di procedere.");
    setLoading(true);
    await fetch('/api/automation', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetIndustry, campaignBrief })
    });
    await refreshAllData(1);
    setLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (results) => {
        await fetch('/api/users/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leads: results.data }),
        });
        refreshAllData(1);
      }
    });
  };

  return (
    <main className="min-h-screen bg-white text-black font-sans tracking-tight antialiased">
      <nav className="border-b border-zinc-100 px-8 py-6 sticky top-0 bg-white/80 backdrop-blur-md z-40">
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-black p-1.5 rounded-sm"><Zap size={18} className="text-white" fill="white" /></div>
            <span className="text-xl font-bold tracking-tighter uppercase">Nexus</span>
          </div>
          <div className="bg-zinc-50 px-3 py-1 rounded-full border border-zinc-100 flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest">
            <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
            Core Active
          </div>
        </div>
      </nav>

      {/* REPUTATION MONITOR */}
      <div className="max-w-screen-2xl mx-auto px-8 pt-12">
        <div className="flex flex-col md:flex-row justify-between items-center border-b border-zinc-100 pb-10 gap-6">
          <div className="flex items-center gap-6">
            <div className={`p-4 rounded-full ${Number(stats.deliverability) > 95 ? 'bg-zinc-100 text-black' : 'bg-red-50 text-red-600'}`}>
              <ShieldCheck size={32} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-300 mb-1">Domain Health</p>
              <h4 className="text-2xl font-black italic tracking-tighter">{stats.deliverability}% — {stats.healthStatus}</h4>
            </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Identity</p>
             <p className="text-sm font-bold italic underline decoration-zinc-200">designlabstudio.it</p>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto p-8">
        {/* METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20 py-4">
          {[
            { label: 'Broadcasts', value: stats.sent, icon: Send },
            { label: 'Engagement', value: stats.opened, icon: MailOpen },
            { label: 'Growth/ROI', value: stats.replied, icon: ArrowUpRight },
          ].map((card, idx) => (
            <div key={idx} className="flex flex-col border-l border-zinc-100 pl-8 transition-all hover:border-black">
              <div className="flex items-center gap-2 text-zinc-300 mb-2">
                <card.icon size={14} />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{card.label}</span>
              </div>
              <h3 className="text-7xl font-bold tracking-tighter tabular-nums">{card.value.toLocaleString()}</h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* STRATEGY SIDEBAR */}
          <div className="lg:col-span-4 space-y-12">
            <section className="space-y-8 bg-zinc-50/50 p-8 rounded-xl border border-zinc-100">
              <h2 className="text-xl font-bold tracking-tighter uppercase">Campaign Strategy</h2>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest">Industry Target</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-zinc-300" size={14} />
                    <input type="text" placeholder="Search industries..." className="w-full pl-9 pr-4 py-2 text-xs border border-zinc-200 rounded-md outline-none mb-2 focus:border-black" value={industrySearch} onChange={(e) => setIndustrySearch(e.target.value)} />
                    <select value={targetIndustry} onChange={(e) => setTargetIndustry(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-md px-4 py-3 text-xs font-bold uppercase outline-none">
                      <option value="all">Global (All Leads)</option>
                      {filteredIndustries.map(ind => (<option key={ind} value={ind}>{ind}</option>))}
                    </select>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest">Mission Brief</label>
                  <textarea placeholder="Inserisci cosa vuoi vendere in questa campagna..." value={campaignBrief} onChange={(e) => setCampaignBrief(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-md px-4 py-4 text-xs min-h-[140px] outline-none focus:border-black transition-all resize-none" />
                </div>
              </div>
              <button onClick={startAutomation} disabled={loading || !campaignBrief} className="w-full bg-black text-white py-5 rounded-md font-bold text-xs tracking-widest uppercase hover:invert transition-all flex items-center justify-center gap-3 shadow-xl">
                {loading ? <RefreshCw className="animate-spin" size={16} /> : 'Deploy Sequence'}
              </button>
            </section>

            <label className="flex items-center justify-between border border-zinc-100 p-6 rounded-xl hover:bg-zinc-50 cursor-pointer group transition-all">
                <div className="font-bold text-sm">Ingest Leads (CSV)</div>
                <FileUp size={20} className="text-zinc-200 group-hover:text-black" />
                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>

          {/* ACTIVITY STREAM */}
          <div className="lg:col-span-8">
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-xl font-bold tracking-tighter uppercase">Activity Buffer</h2>
              <div className="flex gap-4">
                <input type="text" placeholder="Search..." className="border-b border-zinc-200 py-1 text-xs outline-none focus:border-black" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <select className="bg-transparent border-b border-zinc-200 text-[10px] font-bold uppercase" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Logs</option>
                  <option value="sent">Sent</option>
                  <option value="failed">Error</option>
                </select>
              </div>
            </div>

            <div className="border border-zinc-100 overflow-hidden rounded-sm min-h-[480px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50/50 border-b border-zinc-100">
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Target Entity</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-right pr-8 text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Detail</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-zinc-50 ${loading ? 'opacity-30' : 'opacity-100'}`}>
                  {logs.map((log, i) => (
                    <tr key={i} className="hover:bg-zinc-50/50">
                      <td className="px-6 py-5">
                        <div className="font-bold text-sm tracking-tight">{log.email}</div>
                        <div className="text-[9px] font-black uppercase text-zinc-300 mt-1">{log.industry} // {new Date(log.created_at).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-[10px] font-black uppercase ${log.status === 'sent' ? 'text-black' : 'text-zinc-300'}`}>
                          {log.status === 'sent' ? '● Sent' : '○ Fail'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right pr-8">
                        <button onClick={() => setSelectedMail(log.ai_decision)} className="text-zinc-200 hover:text-black"><Eye size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex items-center justify-between text-[10px] font-bold uppercase text-zinc-300 tracking-widest">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-4">
                <button onClick={() => { const n = Math.max(1, page - 1); setPage(n); refreshAllData(n); }} disabled={page === 1} className="hover:text-black disabled:opacity-10"><ChevronLeft size={20} /></button>
                <button onClick={() => { const n = Math.min(totalPages, page + 1); setPage(n); refreshAllData(n); }} disabled={page === totalPages} className="hover:text-black disabled:opacity-10"><ChevronRight size={20} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INSPECTOR MODAL */}
      {selectedMail && (
        <div className="fixed inset-0 bg-white/98 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl p-12 relative border border-zinc-100 shadow-2xl">
            <button onClick={() => setSelectedMail(null)} className="absolute top-8 right-8 text-zinc-300 hover:text-black"><X size={28} /></button>
            <div className="mb-12">
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 mb-4 italic">Protocol Intelligence Core</p>
               <h3 className="text-4xl font-bold tracking-tighter italic">{selectedMail.subject}</h3>
            </div>
            <div className="text-sm leading-relaxed text-zinc-800 space-y-6 max-h-[50vh] overflow-y-auto pr-6" dangerouslySetInnerHTML={{ __html: selectedMail.body.replace(/\n/g, '<br>') }} />
            <div className="mt-16 pt-8 border-t border-zinc-100 flex justify-end">
               <button onClick={() => setSelectedMail(null)} className="bg-black text-white px-10 py-4 rounded-full text-xs font-black uppercase tracking-widest hover:invert shadow-xl">Dismiss</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}