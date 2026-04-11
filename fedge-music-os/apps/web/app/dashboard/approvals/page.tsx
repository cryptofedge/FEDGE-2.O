import { prisma } from '@fedge/database';
// In a production app, the Approve/Deny buttons would trigger Server Actions or API routes.

export default async function ApprovalsPage() {
  const requests = await prisma.approvalRequest.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: { requester: true }
  });

  return (
    <div className="flex h-screen w-full bg-zinc-50">
      <main className="flex-1 overflow-y-auto p-12">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Admin Gatekeeper Queue</h1>
          <p className="text-zinc-500 mt-2">Manage incoming tracking codes and onboarding requests.</p>
        </header>
        
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          {requests.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              <p>No pending approvals at this time.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((req) => {
                const payload = req.payload as any; // Type hack for JSON payload
                return (
                  <div key={req.id} className="flex justify-between items-center border-b border-zinc-100 pb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900">
                        {payload?.profileName || 'Unknown Profile'}
                      </h3>
                      <div className="flex gap-4 mt-2 text-sm text-zinc-500">
                        <span>📱 {payload?.phone}</span>
                        <span className="bg-zinc-100 px-2 rounded tracking-wide font-mono">
                          {payload?.trackingCode || 'F2O-????'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-all focus:ring-4 focus:ring-green-100">
                        Approve
                      </button>
                      <button className="px-5 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium text-sm transition-all">
                        Deny
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
