import { currentUser } from '@clerk/nextjs';
import { prisma } from '@fedge/database';
import Link from 'next/link';

export default async function DashboardPage() {
  const user = await currentUser();
  
  // Connect to the DB
  // For the scaffold, we fallback to finding the first artist if auth isn't strictly mapping yet.
  const profile = await prisma.artistProfile.findFirst() || await prisma.artistProfile.create({
      data: {
          userId: 'guest-id',
          stageName: 'Mock Architecture Artist'
      }
  });

  const tasks = await prisma.task.findMany({
      where: { artistId: profile.id, status: 'TODO' },
      orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="flex h-screen w-full bg-zinc-50 font-[family-name:var(--font-geist-sans)] text-zinc-900 selection:bg-blue-100">
      
      {/* Sidebar Overlaying Glassmorphism effect */}
      <aside className="w-64 border-r border-zinc-200/60 bg-white/50 backdrop-blur-xl p-6 hidden md:block">
        <div className="flex items-center gap-3 mb-10">
          <div className="h-8 w-8 rounded-lg bg-zinc-900"></div>
          <h2 className="text-lg font-semibold tracking-tight">Artist OS</h2>
        </div>
        
        <nav className="space-y-6 text-sm font-medium text-zinc-500">
          <div>
            <p className="text-xs font-semibold text-zinc-400 mb-3 tracking-wider uppercase">Operating System</p>
            <div className="space-y-1">
              <Link href="/dashboard" className="block text-zinc-900 bg-zinc-100/50 rounded-md px-3 py-2 transition-colors">Commander</Link>
              <Link href="/dashboard/projects" className="block hover:text-zinc-900 hover:bg-zinc-50 rounded-md px-3 py-2 transition-colors">Project Hub</Link>
              <Link href="/dashboard/rights" className="block hover:text-zinc-900 hover:bg-zinc-50 rounded-md px-3 py-2 transition-colors">Rights Registry</Link>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-400 mb-3 tracking-wider uppercase">System Config</p>
            <div className="space-y-1">
              <Link href="/dashboard/approvals" className="block hover:text-zinc-900 hover:bg-zinc-50 rounded-md px-3 py-2 transition-colors">Admin Gate</Link>
            </div>
          </div>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <header className="flex justify-between items-center mb-12">
           <div>
             <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">Chief of Staff Briefing</h1>
             <p className="text-zinc-500 mt-2">Welcome back, {profile.stageName}.</p>
           </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <div className="col-span-2 rounded-2xl border border-zinc-200/60 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-medium tracking-tight text-zinc-900 mb-6">Today's Operating Timeline</h3>
            <div className="h-48 flex items-center justify-center border-2 border-dashed border-zinc-100 rounded-xl">
               <p className="text-zinc-400 text-sm">No external events synchronized from GCal.</p>
            </div>
          </div>
          
          <div className="rounded-2xl border border-red-200/50 bg-gradient-to-b from-red-50/50 to-white p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
              <h3 className="text-lg font-medium text-red-900">System Blockers</h3>
            </div>
            <ul className="space-y-4 text-sm text-red-800/80">
              <li className="flex gap-3 leading-relaxed">
                 <span className="shrink-0 mt-0.5">⚠️</span> 
                 <span>Missing BMI split sheet from Thursday's studio session</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200/60 bg-white p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium tracking-tight text-zinc-900">Agent-Delegated Tasks</h3>
            <span className="bg-zinc-100 text-zinc-600 text-xs font-semibold px-2 py-1 rounded-full">{tasks.length} Active</span>
          </div>
          
          {tasks.length === 0 ? (
            <p className="text-zinc-400 text-sm italic">You are completely caught up. The AI has not assigned any tasks.</p>
          ) : (
            <div className="grid gap-3">
              {tasks.map(task => (
                <div key={task.id} className="group flex items-center justify-between p-4 rounded-xl border border-zinc-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer">
                   <div className="flex items-center gap-4">
                     <div className="h-5 w-5 rounded-full border-2 border-zinc-300 group-hover:border-blue-500 transition-colors"></div>
                     <span className="text-zinc-700 font-medium">{task.title}</span>
                   </div>
                   {task.dueDate && (
                     <span className="text-xs font-medium text-zinc-400 bg-zinc-50 px-2 py-1 rounded-md">
                        Due: {task.dueDate.toLocaleDateString()}
                     </span>
                   )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
