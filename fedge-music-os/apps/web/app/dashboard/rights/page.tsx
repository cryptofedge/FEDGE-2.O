import { prisma } from '@fedge/database';
import Link from 'next/link';

export default async function RightsRegistryPage() {
  // Fetch existing rights checklist, or fallback mock
  const rightsState = await prisma.rightsChecklist.findFirst() || {
      bmiProStatus: 'PENDING',
      mlcStatus: 'APPROVED',
      soundExchangeStatus: 'MISSING',
      copyrightStatus: 'PENDING'
  };

  return (
    <div className="flex h-screen w-full bg-zinc-50 font-[family-name:var(--font-geist-sans)] text-zinc-900">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200/60 bg-white/50 backdrop-blur-xl p-6 hidden md:block">
        <div className="flex items-center gap-3 mb-10">
          <div className="h-8 w-8 rounded-lg bg-zinc-900"></div>
          <h2 className="text-lg font-semibold tracking-tight">Artist OS</h2>
        </div>
        
        <nav className="space-y-6 text-sm font-medium text-zinc-500">
          <div>
            <p className="text-xs font-semibold text-zinc-400 mb-3 tracking-wider uppercase">Operating System</p>
            <div className="space-y-1">
              <Link href="/dashboard" className="block hover:text-zinc-900 hover:bg-zinc-50 rounded-md px-3 py-2 transition-colors">Commander</Link>
              <Link href="/dashboard/projects" className="block hover:text-zinc-900 hover:bg-zinc-50 rounded-md px-3 py-2 transition-colors">Project Hub</Link>
              <Link href="/dashboard/rights" className="block text-zinc-900 bg-zinc-100/50 rounded-md px-3 py-2 transition-colors">Rights Registry</Link>
            </div>
          </div>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <header className="mb-12 cursor-default">
           <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">Rights & Registrations</h1>
           <p className="text-zinc-500 mt-2">Legal boundary managed heavily separated across Performance, Mechanical, and Digital rights.</p>
        </header>

        <section className="grid grid-cols-2 gap-6">
           <div className="rounded-2xl border border-zinc-200/60 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <h3 className="text-lg font-medium text-zinc-900">PRO Registration</h3>
                    <p className="text-xs text-zinc-500">BMI / ASCAP / SESAC</p>
                 </div>
                 <span className={\`text-xs font-bold px-3 py-1 rounded-full \${rightsState.bmiProStatus === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}\`}>
                    {rightsState.bmiProStatus}
                 </span>
              </div>
              <p className="text-sm text-zinc-600 mb-6">Manages your public performance royalties for broadcast, live venues, and streaming.</p>
           </div>

           <div className="rounded-2xl border border-zinc-200/60 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <h3 className="text-lg font-medium text-zinc-900">The MLC</h3>
                    <p className="text-xs text-zinc-500">Mechanical Licensing Collective</p>
                 </div>
                 <span className={\`text-xs font-bold px-3 py-1 rounded-full \${rightsState.mlcStatus === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}\`}>
                    {rightsState.mlcStatus}
                 </span>
              </div>
              <p className="text-sm text-zinc-600 mb-6">Collects and pays digital mechanical royalties directly to songwriters in the USA.</p>
           </div>
           
           <div className="rounded-2xl border border-red-100 bg-red-50/50 p-8 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <h3 className="text-lg font-medium text-red-900">SoundExchange</h3>
                    <p className="text-xs text-red-700/70">Digital Performance Rights</p>
                 </div>
                 <span className="text-xs font-bold px-3 py-1 bg-red-100 text-red-800 rounded-full">
                    {rightsState.soundExchangeStatus}
                 </span>
              </div>
              <p className="text-sm text-red-800/80 mb-6">Required for the featured performer and master owner to collect non-interactive streaming royalties (e.g., Pandora, SiriusXM).</p>
              <button className="text-sm font-medium text-red-700 hover:underline">Identify Assets &rarr;</button>
           </div>
        </section>
      </main>
    </div>
  );
}
