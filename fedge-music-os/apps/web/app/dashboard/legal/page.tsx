import { prisma } from '@fedge/database';
import Link from 'next/link';

export default async function LegalTriageDashboard() {
  const triageTasks = await prisma.task.findMany({
    where: { title: { startsWith: 'LEGAL REVIEW REQUIRED:' } },
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
              <Link href="/dashboard/legal" className="block text-zinc-900 bg-zinc-100/50 rounded-md px-3 py-2 transition-colors">Legal & Contracts</Link>
            </div>
          </div>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <header className="mb-12">
           <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">Contract Defense Module</h1>
           <p className="text-zinc-500 mt-2">AI-assisted split-sheet parsing and predatory deal identification.</p>
        </header>

        <div className="grid grid-cols-1 gap-8">
           {triageTasks.length === 0 ? (
              <div className="p-16 text-center border-2 border-dashed border-zinc-200 rounded-2xl text-zinc-400">
                 <p className="text-lg mb-2">Defense Net is Clear.</p>
                 <p className="text-sm">No incoming documents flagged by the triage agent.</p>
              </div>
           ) : (
              triageTasks.map(task => {
                 const isHighRisk = task.description?.includes('RISK: HIGH') || task.description?.includes('RISK: CRITICAL');
                 const documentName = task.title.replace('LEGAL REVIEW REQUIRED: ', '');
                 
                 return (
                    <div key={task.id} className={\`bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden \${isHighRisk ? 'border-red-300' : 'border-zinc-200'}\`}>
                       <div className={\`flex justify-between items-center p-6 border-b \${isHighRisk ? 'bg-red-50/50 border-red-100' : 'border-zinc-100'}\`}>
                          <div className="flex items-center gap-4">
                             {isHighRisk && <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></span>}
                             <h3 className="font-semibold text-zinc-900">{documentName}</h3>
                          </div>
                          {task.status === 'DONE' ? (
                             <span className="text-xs font-bold px-3 py-1 bg-zinc-100 text-zinc-600 rounded-md">CLEARED BY HUMAN</span>
                          ) : (
                             <span className="text-xs font-bold px-3 py-1 bg-red-100 text-red-800 rounded-md">HUMAN REVIEW REQUIRED</span>
                          )}
                       </div>
                       
                       <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                               <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Extracted Splits</h4>
                               <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed text-zinc-700">
                                  {task.description?.match(/SPLITS: (.*?)\\nRED FLAGS:/s)?.[1] || "No splits parsed."}
                               </p>
                           </div>
                           
                           <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                               <h4 className="text-xs font-semibold uppercase tracking-wider text-red-500 mb-3 flex items-center gap-2">
                                  ⚠️ AI Detected Flags
                               </h4>
                               <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed text-red-800">
                                  {task.description?.match(/RED FLAGS: (.*?)\\n\\[SYSTEM HALT\\]/s)?.[1] || task.description}
                               </p>
                           </div>
                       </div>
                       
                       {task.status !== 'DONE' && (
                          <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
                             <button className="px-5 py-2.5 bg-zinc-900 text-white font-medium text-sm rounded-lg hover:bg-zinc-800 transition-colors">
                                Override & Approve Contract
                             </button>
                          </div>
                       )}
                    </div>
                 );
              })
           )}
        </div>
      </main>
    </div>
  );
}
