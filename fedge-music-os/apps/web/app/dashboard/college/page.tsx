import { prisma } from '@fedge/database';
import Link from 'next/link';

export default async function CollegeCircuitDashboard() {
  const campaigns = await prisma.campaign.findMany({
    where: { name: { startsWith: 'NACA Circuit:' } },
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
              <Link href="/dashboard/college" className="block text-zinc-900 bg-zinc-100/50 rounded-md px-3 py-2 transition-colors">College Routing</Link>
              <Link href="/dashboard/sponsorship" className="block hover:text-zinc-900 hover:bg-zinc-50 rounded-md px-3 py-2 transition-colors">Brand & Sync Docs</Link>
            </div>
          </div>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <header className="mb-12">
           <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">NACA College Circuit</h1>
           <p className="text-zinc-500 mt-2">AI-computed routing logistics strictly for the University booking grid.</p>
        </header>

        <section className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm overflow-hidden">
           {campaigns.length === 0 ? (
              <div className="p-12 text-center text-zinc-400">
                 No College booking offers parsed by the AI agent yet.
              </div>
           ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                 <thead className="bg-zinc-50 border-b border-zinc-200/60 text-zinc-500 font-medium">
                    <tr>
                       <th className="px-6 py-4">Circuit Block</th>
                       <th className="px-6 py-4">Status</th>
                       <th className="px-6 py-4">Financials & Details</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-100">
                    {campaigns.map(camp => (
                       <tr key={camp.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-zinc-900">{camp.name.replace('NACA Circuit: ', '')}</td>
                          <td className="px-6 py-4">
                             <span className={\`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold \${camp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}\`}>
                                {camp.status}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-zinc-600 truncate max-w-sm">{camp.description}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           )}
        </section>
      </main>
    </div>
  );
}
