export interface Student {
  id: string;
  nisn: string;
  namaLengkap: string;
  jenjang: 'SMP' | 'SMA';
  kelas: string;
  namaOrangTua: string;
  nomorWhatsApp: string;
  foto?: string;
  barcode: string;
  tunggakanSekolah: string[];
  tunggakanPesantren: string[];
  biayaPerBulan: number;
  deposit: number;
  cicilan: CicilanRecord[];
}

export interface CicilanRecord {
  id: string;
  siswaId: string;
  bulan: string;
  nominal: number;
  tanggal: string;
  petugas: string;
}

export interface PembayaranRecord {
  id: string;
  siswaId: string;
  namaSiswa: string;
  nisn: string;
  jenjang: 'SMP' | 'SMA';
  kelas: string;
  bulan: string;
  nominal: number;
  metode: 'Lunas' | 'Cicil' | 'Deposit';
  tanggal: string;
  petugas: string;
}

export interface PengeluaranRecord {
  id: string;
  keterangan: string;
  sumberDana: 'SMP' | 'SMA';
  jenisKeperluan: string;
  nominal: number;
  tanggal: string;
  petugas: string;
}

export interface DepositRecord {
  id: string;
  siswaId: string;
  namaSiswa: string;
  nominal: number;
  bulanUntuk: string;
  tanggal: string;
  petugas: string;
}

const bulanList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const kelasOptions: Record<string, string[]> = {
  SMP: ['7A', '7B', '8A', '8B', '9A', '9B'],
  SMA: ['10A', '10B', '11A', '11B', '12A', '12B'],
};

export { bulanList, kelasOptions };

const mockStudents: Student[] = [
  { id: '1', nisn: '0012345601', namaLengkap: 'Ahmad Fauzan', jenjang: 'SMP', kelas: '7A', namaOrangTua: 'Bapak Hasan', nomorWhatsApp: '628123456701', barcode: 'BC001', tunggakanSekolah: ['Januari', 'Februari'], tunggakanPesantren: ['Januari'], biayaPerBulan: 125000, deposit: 0, cicilan: [] },
  { id: '2', nisn: '0012345602', namaLengkap: 'Siti Aisyah', jenjang: 'SMP', kelas: '7B', namaOrangTua: 'Bapak Ahmad', nomorWhatsApp: '628123456702', barcode: 'BC002', tunggakanSekolah: [], tunggakanPesantren: [], biayaPerBulan: 125000, deposit: 125000, cicilan: [] },
  { id: '3', nisn: '0012345603', namaLengkap: 'Muhammad Rizki', jenjang: 'SMA', kelas: '10A', namaOrangTua: 'Bapak Usman', nomorWhatsApp: '628123456703', barcode: 'BC003', tunggakanSekolah: ['Januari', 'Februari', 'Maret'], tunggakanPesantren: ['Februari', 'Maret'], biayaPerBulan: 150000, deposit: 0, cicilan: [{ id: 'c1', siswaId: '3', bulan: 'Januari', nominal: 75000, tanggal: '2026-01-15', petugas: 'Petugas A' }] },
  { id: '4', nisn: '0012345604', namaLengkap: 'Fatimah Zahra', jenjang: 'SMA', kelas: '10B', namaOrangTua: 'Ibu Khadijah', nomorWhatsApp: '628123456704', barcode: 'BC004', tunggakanSekolah: ['Maret'], tunggakanPesantren: [], biayaPerBulan: 150000, deposit: 0, cicilan: [] },
  { id: '5', nisn: '0012345605', namaLengkap: 'Abdullah Rahman', jenjang: 'SMP', kelas: '8A', namaOrangTua: 'Bapak Ibrahim', nomorWhatsApp: '628123456705', barcode: 'BC005', tunggakanSekolah: [], tunggakanPesantren: ['Januari', 'Februari'], biayaPerBulan: 125000, deposit: 0, cicilan: [] },
  { id: '6', nisn: '0012345606', namaLengkap: 'Nur Halimah', jenjang: 'SMP', kelas: '8B', namaOrangTua: 'Ibu Maryam', nomorWhatsApp: '628123456706', barcode: 'BC006', tunggakanSekolah: ['Februari', 'Maret'], tunggakanPesantren: ['Maret'], biayaPerBulan: 125000, deposit: 0, cicilan: [] },
  { id: '7', nisn: '0012345607', namaLengkap: 'Umar Faruq', jenjang: 'SMA', kelas: '11A', namaOrangTua: 'Bapak Salim', nomorWhatsApp: '628123456707', barcode: 'BC007', tunggakanSekolah: [], tunggakanPesantren: [], biayaPerBulan: 150000, deposit: 300000, cicilan: [] },
  { id: '8', nisn: '0012345608', namaLengkap: 'Zainab Putri', jenjang: 'SMA', kelas: '11B', namaOrangTua: 'Ibu Aminah', nomorWhatsApp: '628123456708', barcode: 'BC008', tunggakanSekolah: ['Januari', 'Februari', 'Maret'], tunggakanPesantren: ['Januari', 'Februari'], biayaPerBulan: 150000, deposit: 0, cicilan: [] },
  { id: '9', nisn: '0012345609', namaLengkap: 'Bilal Hakim', jenjang: 'SMP', kelas: '9A', namaOrangTua: 'Bapak Yusuf', nomorWhatsApp: '628123456709', barcode: 'BC009', tunggakanSekolah: ['Maret'], tunggakanPesantren: [], biayaPerBulan: 125000, deposit: 0, cicilan: [] },
  { id: '10', nisn: '0012345610', namaLengkap: 'Khadijah Amira', jenjang: 'SMP', kelas: '9B', namaOrangTua: 'Ibu Fatimah', nomorWhatsApp: '628123456710', barcode: 'BC010', tunggakanSekolah: [], tunggakanPesantren: [], biayaPerBulan: 125000, deposit: 0, cicilan: [] },
  { id: '11', nisn: '0012345611', namaLengkap: 'Hamzah Alwi', jenjang: 'SMA', kelas: '12A', namaOrangTua: 'Bapak Ali', nomorWhatsApp: '628123456711', barcode: 'BC011', tunggakanSekolah: ['Januari'], tunggakanPesantren: ['Januari', 'Maret'], biayaPerBulan: 150000, deposit: 0, cicilan: [] },
  { id: '12', nisn: '0012345612', namaLengkap: 'Maryam Salsabila', jenjang: 'SMA', kelas: '12B', namaOrangTua: 'Ibu Zainab', nomorWhatsApp: '628123456712', barcode: 'BC012', tunggakanSekolah: [], tunggakanPesantren: [], biayaPerBulan: 150000, deposit: 150000, cicilan: [] },
];

const mockPembayaran: PembayaranRecord[] = [
  { id: 'p1', siswaId: '2', namaSiswa: 'Siti Aisyah', nisn: '0012345602', jenjang: 'SMP', kelas: '7B', bulan: 'Maret', nominal: 125000, metode: 'Lunas', tanggal: '2026-03-05', petugas: 'Petugas A' },
  { id: 'p2', siswaId: '7', namaSiswa: 'Umar Faruq', nisn: '0012345607', jenjang: 'SMA', kelas: '11A', bulan: 'Maret', nominal: 150000, metode: 'Lunas', tanggal: '2026-03-04', petugas: 'Petugas A' },
  { id: 'p3', siswaId: '10', namaSiswa: 'Khadijah Amira', nisn: '0012345610', jenjang: 'SMP', kelas: '9B', bulan: 'Maret', nominal: 125000, metode: 'Lunas', tanggal: '2026-03-03', petugas: 'Petugas B' },
  { id: 'p4', siswaId: '12', namaSiswa: 'Maryam Salsabila', nisn: '0012345612', jenjang: 'SMA', kelas: '12B', bulan: 'Maret', nominal: 150000, metode: 'Deposit', tanggal: '2026-03-02', petugas: 'Petugas A' },
  { id: 'p5', siswaId: '5', namaSiswa: 'Abdullah Rahman', nisn: '0012345605', jenjang: 'SMP', kelas: '8A', bulan: 'Maret', nominal: 125000, metode: 'Lunas', tanggal: '2026-03-01', petugas: 'Petugas B' },
];

const mockPengeluaran: PengeluaranRecord[] = [
  { id: 'e1', keterangan: 'Pembelian ATK', sumberDana: 'SMP', jenisKeperluan: 'Perlengkapan Sekolah', nominal: 250000, tanggal: '2026-03-04', petugas: 'Petugas A' },
  { id: 'e2', keterangan: 'Gaji Guru Honorer', sumberDana: 'SMA', jenisKeperluan: 'Gaji', nominal: 1500000, tanggal: '2026-03-03', petugas: 'Petugas A' },
  { id: 'e3', keterangan: 'Kertas Print', sumberDana: 'SMP', jenisKeperluan: 'Kebutuhan Kantor', nominal: 150000, tanggal: '2026-03-02', petugas: 'Petugas B' },
  { id: 'e4', keterangan: 'Gaji Staff TU', sumberDana: 'SMP', jenisKeperluan: 'Gaji', nominal: 2000000, tanggal: '2026-03-01', petugas: 'Petugas A' },
];

export { mockStudents, mockPembayaran, mockPengeluaran };
