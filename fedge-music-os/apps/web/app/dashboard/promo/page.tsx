import { prisma } from '@fedge/database';
import Link from 'next/link';

export default async function PromoRadioDashboard() {
  const interactions = await prisma.contactRelationship.findMany({
    include: { contact: true },
    orderBy: { id: 'desc' }, // Fallback to id since createdAt isn't on contactRelationship
    take: 50
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
              <Link href="/dashboard/promo" className="block text-zinc-900 bg-zinc-100/50 rounded-md px-3 py-2 transition-colors">Radio Play Tracking</Link>
              <Link href="/dashboard/scouting" className="block hover:text-zinc-900 hover:bg-zinc-50 rounded-md px-3 py-2 transition-colors">A&R Scouting</Link>
            </div>
          </div>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <header className="mb-12">
           <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">Radio & Mixshow CRM</h1>
           <p className="text-zinc-500 mt-2">AI-logged broadcast impacts and tracked DJ relationships.</p>
        </header>

        <section className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm overflow-hidden">
           {interactions.length === 0 ? (
              <div className="p-12 text-center text-zinc-400">
                 No confirmed radio spins logged by the AI Agent yet.
              </div>
           ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                 <thead className="bg-zinc-50 border-b border-zinc-200/60 text-zinc-500 font-medium">
                    <tr>
                       <th className="px-6 py-4">Status</th>
                       <th className="px-6 py-4">DJ / Programmer</th>
                       <th className="px-6 py-4">AI Notes & Context</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-100">
                    {interactions.map(rel => (
                       <tr key={rel.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4">
                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                {rel.status.replace('_', ' ')}
                             </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-zinc-900">{rel.contact.name}</td>
                          <td className="px-6 py-4 text-zinc-600 truncate max-w-sm">{rel.notes}</td>
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
