import { prisma } from '@fedge/database';
import Link from 'next/link';

export default async function SponsorshipDashboard() {
  const projects = await prisma.project.findMany({
    where: { title: { startsWith: 'Brand Sync:' } },
    orderBy: { createdAt: 'desc' }
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
              <Link href="/dashboard/college" className="block hover:text-zinc-900 hover:bg-zinc-50 rounded-md px-3 py-2 transition-colors">College Routing</Link>
              <Link href="/dashboard/sponsorship" className="block text-zinc-900 bg-zinc-100/50 rounded-md px-3 py-2 transition-colors">Brand & Sync Docs</Link>
            </div>
          </div>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <header className="mb-12">
           <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">Sponsorship & Brand Sync</h1>
           <p className="text-zinc-500 mt-2">AI-computed demographic fit scores to protect platform aesthetic.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {projects.length === 0 ? (
              <div className="col-span-full p-12 text-center border-2 border-dashed border-zinc-200 rounded-2xl text-zinc-400">
                 No brand synergies proposed yet. Send a pitch deck context to the Sync Agent.
              </div>
           ) : (
              projects.map(proj => {
                 const isArchived = proj.status === 'ARCHIVED';
                 const scoreMatch = proj.description?.match(/Fit Score: (\\d+)/);
                 const fitScore = scoreMatch ? parseInt(scoreMatch[1]) : 0;
                 
                 return (
                    <div key={proj.id} className={\`bg-white rounded-2xl border pb-3 shadow-sm flex flex-col \${isArchived ? 'opacity-60 border-red-200' : 'border-zinc-200'}\`}>
                       <div className="flex justify-between items-center p-6 border-b border-zinc-100">
                          <h3 className="font-semibold text-zinc-900 line-clamp-1">{proj.title.replace('Brand Sync: ', '')}</h3>
                          {isArchived ? (
                             <span className="text-xs font-bold px-2 py-1 bg-red-100 text-red-800 rounded-md">AI REJECTED</span>
                          ) : (
                             <span className="text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md">IN REVIEW</span>
                          )}
                       </div>
                       <div className="p-6">
                           <div className="flex items-end gap-3 mb-4">
                               <span className="text-3xl font-light tracking-tighter tabular-nums">{fitScore}</span>
                               <span className="text-sm font-semibold text-zinc-400 mb-1">/ 100 FIT SCORE</span>
                           </div>
                           <p className="text-sm text-zinc-600 line-clamp-3 leading-relaxed">
                              {proj.description?.replace(/Fit Score: \\d+\\/100\\.\\s*/, '')}
                           </p>
                       </div>
                    </div>
                 );
              })
           )}
        </div>
      </main>
    </div>
  );
}
