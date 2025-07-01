import Header from '@/components/dashboard/Header';

export default function RegisterPage() {
  return (
    <div>
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Register</h1>
          <p className="text-slate-600">
            Registration functionality will be implemented based on authentication requirements.
          </p>
        </div>
      </main>
    </div>
  );
}