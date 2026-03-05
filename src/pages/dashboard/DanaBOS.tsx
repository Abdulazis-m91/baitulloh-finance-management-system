import { Construction } from 'lucide-react';

export default function DanaBOS() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <Construction className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">404</h1>
        <h2 className="text-xl font-semibold text-foreground mb-2">Dalam Pengembangan</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Halaman Dana BOS sedang dalam tahap pengembangan. Silakan kembali lagi nanti.
        </p>
      </div>
    </div>
  );
}
