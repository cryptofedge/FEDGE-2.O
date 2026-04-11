import { prisma } from '@fedge/database';
import Link from 'next/link';

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
     include: { artist: true },
     orderBy: { status: 'asc' }
  });

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
              <Link href="/dashboard/projects" className="block text-zinc-900 bg-zinc-100/50 rounded-md px-3 py-2 transition-colors">Project Hub</Link>
              <Link href="/dashboard/rights" className="block hover:text-zinc-900 hover:bg-zinc-50 rounded-md px-3 py-2 transition-colors">Rights Registry</Link>
            </div>
          </div>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <header className="mb-12">
           <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">Release & Project Pipeline</h1>
           <p className="text-zinc-500 mt-2">Manage your impending drops and strategic campaigns.</p>
        </header>

        <section className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-8 min-h-[400px]">
           {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                 <p className="mb-4">No active projects found.</p>
                 <button className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium">Create Project</button>
              </div>
           ) : (
              <div className="grid grid-cols-3 gap-6">
                 {/* Kanban logic would go here */}
              </div>
           )}
        </section>
      </main>
    </div>
  );
}
