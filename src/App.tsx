import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardSekolah from "./pages/dashboard/DashboardSekolah";
import PembayaranSekolah from "./pages/dashboard/PembayaranSekolah";
import DataSiswaSekolah from "./pages/dashboard/DataSiswaSekolah";
import PendapatanSekolah from "./pages/dashboard/PendapatanSekolah";
import PengeluaranSekolah from "./pages/dashboard/PengeluaranSekolah";
import DanaBOS from "./pages/dashboard/DanaBOS";
import LaporanSekolah from "./pages/dashboard/LaporanSekolah";
import DashboardPesantren from "./pages/dashboard/DashboardPesantren";
import PembayaranPesantren from "./pages/dashboard/PembayaranPesantren";
import DataSantriPesantren from "./pages/dashboard/DataSantriPesantren";
import PendapatanPesantren from "./pages/dashboard/PendapatanPesantren";
import PengeluaranPesantren from "./pages/dashboard/PengeluaranPesantren";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
      <Route index element={<DashboardSekolah />} />
      <Route path="pembayaran" element={<PembayaranSekolah />} />
      <Route path="data-siswa" element={<DataSiswaSekolah />} />
      <Route path="pendapatan" element={<PendapatanSekolah />} />
      <Route path="pengeluaran" element={<PengeluaranSekolah />} />
      <Route path="dana-bos" element={<DanaBOS />} />
      <Route path="laporan" element={<LaporanSekolah />} />
      <Route path="pesantren" element={<DashboardPesantren />} />
      <Route path="pembayaran-pesantren" element={<PembayaranPesantren />} />
      <Route path="data-santri" element={<DataSantriPesantren />} />
      <Route path="pendapatan-pesantren" element={<PendapatanPesantren />} />
      <Route path="pengeluaran-pesantren" element={<div className="flex items-center justify-center min-h-[40vh]"><p className="text-muted-foreground text-lg">🚧 Pengeluaran Pesantren — Dalam Pengembangan</p></div>} />
      <Route path="laporan-pesantren" element={<div className="flex items-center justify-center min-h-[40vh]"><p className="text-muted-foreground text-lg">🚧 Laporan Pesantren — Dalam Pengembangan</p></div>} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
