import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, CreditCard, Users, TrendingUp, TrendingDown,
  BookOpen, FileText, LogOut, Menu, X, ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: CreditCard, label: 'Pembayaran', path: '/dashboard/pembayaran' },
  { icon: Users, label: 'Data Siswa', path: '/dashboard/data-siswa' },
  { icon: TrendingUp, label: 'Pendapatan', path: '/dashboard/pendapatan' },
  { icon: TrendingDown, label: 'Pengeluaran', path: '/dashboard/pengeluaran' },
  { icon: BookOpen, label: 'Dana BOS', path: '/dashboard/dana-bos' },
  { icon: FileText, label: 'Laporan', path: '/dashboard/laporan' },
];

export default function DashboardLayout() {
  const { userName, role, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roleLabel = role === 'petugas_sekolah' ? 'Petugas Sekolah' : role === 'petugas_pesantren' ? 'Petugas Pesantren' : 'Administrator';

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-sidebar flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center shadow-sm">
              <span className="text-lg font-bold font-arabic text-foreground">ب</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-sidebar-foreground leading-tight">Yayasan Baitulloh</h2>
              <p className="text-xs text-sidebar-foreground/50">Sistem Bendahara</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{label(item, role)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-4 py-3 mb-3">
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">{userName.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
              <p className="text-xs text-sidebar-foreground/50">{roleLabel}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive w-full transition-all"
          >
            <LogOut className="w-5 h-5" /> Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-16 bg-card border-b border-border flex items-center px-4 lg:px-8 gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <p className="text-sm text-muted-foreground hidden sm:block">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function label(item: typeof menuItems[0], role: string | null) {
  if (role === 'petugas_sekolah') {
    const suffixed = ['Dashboard', 'Pembayaran', 'Data Siswa', 'Pendapatan', 'Pengeluaran', 'Laporan'];
    if (suffixed.includes(item.label)) return `${item.label} Sekolah`;
  }
  return item.label;
}
