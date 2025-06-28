import Header from '@/components/dashboard/Header';
import MainContent from '@/components/dashboard/MainContent';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <MainContent />
    </div>
  );
}