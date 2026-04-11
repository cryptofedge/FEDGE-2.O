import { prisma } from '@fedge/database';
import Link from 'next/link';
import { AnalyticsService } from '@fedge/api/src/services/analytics.service';

export default async function ExecutiveAnalyticsDashboard() {
  const analyticsService = new AnalyticsService();
  const overview = await analyticsService.getSystemOverview();

  return (
    <div className="flex h-screen w-full bg-zinc-50 font-[family-name:var(--font-geist-sans)] text-zinc-900">
      <aside className="w-64 border-r border-zinc-200/60 bg-white/50 backdrop-blur-xl p-6 hidden md:block">
        <div className="flex items-center gap-3 mb-10">
          <div className="h-8 w-8 rounded-lg bg-zinc-900"></div>
          <h2 className="text-lg font-semibold tracking-tight">Artist OS</h2>
        </div>
        <nav className="space-y-6 text-sm font-medium text-zinc-500">
          <div>
            <p className="text-xs font-semibold text-zinc-400 mb-3 tracking-wider uppercase">CRM Hubs</p>
            <div className="space-y-1">
              <Link href="/dashboard" className="block hover:text-zinc-900 hover:bg-zinc-50 rounded-md px-3 py-2 transition-colors">OS Commander</Link>
              <Link href="/dashboard/college" className="block hover:text-zinc-900 hover:bg-zinc-50 rounded-md px-3 py-2 transition-colors">College Routing</Link>
              <Link href="/dashboard/legal" className="block hover:text-zinc-900 hover:bg-zinc-50 rounded-md px-3 py-2 transition-colors">Legal & Contracts</Link>
              <Link href="/dashboard/analytics" className="block text-zinc-900 bg-zinc-100/50 rounded-md px-3 py-2 transition-colors">OS Analytics</Link>
            </div>
          </div>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <header className="mb-12">
           <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">Platform Analytics</h1>
           <p className="text-zinc-500 mt-2">Executive-level telemetry aggregating AI workflows.</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
           <div className="bg-white rounded-2xl border border-zinc-200/60 p-6 shadow-sm">
              <h3 className="text-zinc-500 text-sm font-medium mb-4">Total Profiles Tracked</h3>
              <p className="text-4xl font-semibold tracking-tighter text-zinc-900">{overview.totalArtists}</p>
           </div>
           
           <div className="bg-white rounded-2xl border border-zinc-200/60 p-6 shadow-sm">
              <h3 className="text-zinc-500 text-sm font-medium mb-4">Active AI-Managed Tasks</h3>
              <p className="text-4xl font-semibold tracking-tighter text-blue-600">{overview.activeAITasks}</p>
           </div>

           <div className="bg-red-50 rounded-2xl border border-red-100 p-6 shadow-sm">
              <h3 className="text-red-700/80 text-sm font-medium mb-4">Legal Threats Flagged</h3>
              <p className="text-4xl font-semibold tracking-tighter text-red-700">{overview.blockedLegalThreats}</p>
           </div>

           <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6 shadow-sm">
              <h3 className="text-emerald-700/80 text-sm font-medium mb-4">Network A&R Average (Score)</h3>
              <p className="text-4xl font-semibold tracking-tighter text-emerald-700">{overview.averageProspectScore}</p>
           </div>
        </section>

        <section className="bg-white rounded-2xl border border-zinc-200/60 p-8 shadow-sm">
           <div className="flex justify-between items-center mb-6 border-b border-zinc-100 pb-4">
              <h3 className="text-lg font-medium text-zinc-900">System Activity Heatmap</h3>
              <span className="bg-zinc-100 text-zinc-600 font-semibold px-3 py-1 rounded-full text-xs">Awaiting Real-time Streams</span>
           </div>
           <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-zinc-100 rounded-xl bg-zinc-50/50">
              <p className="text-zinc-400 font-medium">Chart visualization pending Vercel deployment.</p>
           </div>
        </section>
      </main>
    </div>
  );
}
