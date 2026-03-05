import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CreditCard, Users, TrendingUp, TrendingDown,
  BookOpen, FileText, LogOut, Menu, X, Bell
} from 'lucide-react';
import { useState } from 'react';
import logoYB from '@/assets/logo-yb.png';

const menuItemsSekolah = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: CreditCard, label: 'Pembayaran', path: '/dashboard/pembayaran' },
  { icon: Users, label: 'Data Siswa', path: '/dashboard/data-siswa' },
  { icon: TrendingUp, label: 'Pendapatan', path: '/dashboard/pendapatan' },
  { icon: TrendingDown, label: 'Pengeluaran', path: '/dashboard/pengeluaran' },
  { icon: BookOpen, label: 'Dana BOS', path: '/dashboard/dana-bos' },
  { icon: FileText, label: 'Laporan', path: '/dashboard/laporan' },
];

const menuItemsPesantren = [
  { icon: LayoutDashboard, label: 'Dashboard Pesantren', path: '/dashboard/pesantren' },
  { icon: CreditCard, label: 'Pembayaran Pesantren', path: '/dashboard/pembayaran-pesantren' },
  { icon: Users, label: 'Data Santri Pesantren', path: '/dashboard/data-santri' },
  { icon: TrendingUp, label: 'Pendapatan Pesantren', path: '/dashboard/pendapatan-pesantren' },
  { icon: TrendingDown, label: 'Pengeluaran Pesantren', path: '/dashboard/pengeluaran-pesantren' },
  { icon: FileText, label: 'Laporan Pesantren', path: '/dashboard/laporan-pesantren' },
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
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 gradient-sidebar flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <motion.img
              src={logoYB}
              alt="Logo Yayasan Baitulloh"
              whileHover={{ rotate: 10, scale: 1.05 }}
              className="w-11 h-11 rounded-xl object-contain"
            />
            <div>
              <h2 className="text-sm font-bold text-sidebar-foreground leading-tight tracking-tight">Yayasan Baitulloh</h2>
              <p className="text-[10px] text-sidebar-foreground/40 font-medium uppercase tracking-[0.2em]">Sistem Bendahara</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/50">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto mt-2">
          <p className="px-4 py-2 text-[10px] font-bold text-sidebar-foreground/30 uppercase tracking-[0.2em]">Menu Utama</p>
          {(role === 'petugas_pesantren' ? menuItemsPesantren : menuItemsSekolah).map((item, i) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard' || item.path === '/dashboard/pesantren'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-sidebar-accent text-white shadow-sm'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${isActive ? 'bg-white/20 shadow-sm' : 'bg-sidebar-accent/50 group-hover:bg-sidebar-accent'}`}>
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-sidebar-foreground/60 group-hover:text-sidebar-foreground'}`} />
                  </div>
                  <span>{getLabel(item.label, role)}</span>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-sidebar-accent/30 mb-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
              <span className="text-sm font-bold text-primary-foreground">{userName.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">{userName}</p>
              <p className="text-[10px] text-sidebar-foreground/40 uppercase tracking-wider">{roleLabel}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/50 hover:bg-destructive/10 hover:text-destructive w-full transition-all"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </motion.button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-card/80 backdrop-blur-lg border-b border-border flex items-center px-4 lg:px-8 gap-4 sticky top-0 z-30">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2.5 rounded-xl hover:bg-muted transition-colors"
          >
            <Menu className="w-5 h-5" />
          </motion.button>

          <div className="flex-1" />

          <p className="text-sm text-muted-foreground hidden sm:block font-medium">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2.5 rounded-xl hover:bg-muted transition-colors"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive animate-bounce-gentle" />
          </motion.button>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function getLabel(label: string, role: string | null) {
  if (role === 'petugas_sekolah') {
    const suffixed = ['Dashboard', 'Pembayaran', 'Data Siswa', 'Pendapatan', 'Pengeluaran', 'Laporan'];
    if (suffixed.includes(label)) return `${label} Sekolah`;
  }
  return label;
}
