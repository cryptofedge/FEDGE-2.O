import { prisma } from '@fedge/database';
import Link from 'next/link';

export default async function ScoutingDashboard() {
  const reports = await prisma.scoutingReport.findMany({
    orderBy: { score: 'desc' }
  });

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
              <Link href="/dashboard/promo" className="block hover:text-zinc-900 hover:bg-zinc-50 rounded-md px-3 py-2 transition-colors">Radio Play Tracking</Link>
              <Link href="/dashboard/scouting" className="block text-zinc-900 bg-zinc-100/50 rounded-md px-3 py-2 transition-colors">A&R Scouting</Link>
            </div>
          </div>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <header className="mb-12">
           <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">A&R Scouting Analytics</h1>
           <p className="text-zinc-500 mt-2">Incoming prospect evaluations and AI-computed viability scores.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {reports.length === 0 ? (
              <div className="col-span-full p-12 text-center border-2 border-dashed border-zinc-200 rounded-2xl text-zinc-400">
                 No active reports generated. Send a prospect to the Talent Scout AI.
              </div>
           ) : (
              reports.map(report => {
                 // Determine grade color
                 let gradeColor = 'bg-zinc-100 text-zinc-800 border-zinc-200';
                 if (report.score >= 85) gradeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100';
                 else if (report.score >= 65) gradeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                 else gradeColor = 'bg-red-50 text-red-700 border-red-200';

                 return (
                    <div key={report.id} className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-6 flex flex-col">
                       <div className="flex justify-between items-start mb-6">
                          <h3 className="font-semibold text-zinc-900 line-clamp-1">{report.notes.match(/\\[Prospect: ([^\]]+)\\]/)?.[1] || 'Unknown Prospect'}</h3>
                          <div className={\`flex items-center justify-center h-12 w-12 rounded-full border-2 font-bold text-lg \${gradeColor}\`}>
                             {report.score}
                          </div>
                       </div>
                       
                       <p className="text-sm text-zinc-600 flex-1 bg-zinc-50 p-4 rounded-xl border border-zinc-100 line-clamp-4 leading-relaxed">
                          {report.notes.replace(/\\[Prospect:.*?\\]\\s*/, '')}
                       </p>
                    </div>
                 );
              })
           )}
        </div>
      </main>
    </div>
  );
}
