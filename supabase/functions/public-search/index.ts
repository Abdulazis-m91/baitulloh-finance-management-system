import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const nama = url.searchParams.get("nama") || "";
    const jenjang = url.searchParams.get("jenjang") || "";
    const kelas = url.searchParams.get("kelas") || "";

    if (!nama && !kelas) {
      return new Response(JSON.stringify({ error: "Masukkan nama atau kelas" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Query students table
    let studentsQuery = supabaseAdmin.from("students").select("nama_lengkap, nisn, jenjang, kelas, tunggakan_sekolah, tunggakan_pesantren, biaya_per_bulan, kategori");
    if (nama) studentsQuery = studentsQuery.ilike("nama_lengkap", `%${nama}%`);
    if (jenjang) studentsQuery = studentsQuery.eq("jenjang", jenjang);
    if (kelas) studentsQuery = studentsQuery.eq("kelas", kelas);
    const { data: students } = await studentsQuery.limit(20);

    // Query santri table
    let santriQuery = supabaseAdmin.from("santri").select("nama_lengkap, nisn, jenjang, kelas, tunggakan_pesantren, biaya_per_bulan, kategori");
    if (nama) santriQuery = santriQuery.ilike("nama_lengkap", `%${nama}%`);
    if (jenjang) santriQuery = santriQuery.eq("jenjang", jenjang);
    if (kelas) santriQuery = santriQuery.eq("kelas", kelas);
    const { data: santriList } = await santriQuery.limit(20);

    // Get petugas phone numbers
    const { data: petugasSekolah } = await supabaseAdmin
      .from("user_roles").select("user_id").eq("role", "petugas_sekolah").limit(1);
    const { data: petugasPesantren } = await supabaseAdmin
      .from("user_roles").select("user_id").eq("role", "petugas_pesantren").limit(1);

    let waSekolah = "";
    let waPesantren = "";

    if (petugasSekolah?.[0]) {
      const { data: profile } = await supabaseAdmin
        .from("profiles").select("phone").eq("user_id", petugasSekolah[0].user_id).single();
      waSekolah = profile?.phone || "";
    }
    if (petugasPesantren?.[0]) {
      const { data: profile } = await supabaseAdmin
        .from("profiles").select("phone").eq("user_id", petugasPesantren[0].user_id).single();
      waPesantren = profile?.phone || "";
    }

    // Merge results by nama_lengkap
    const mergedMap = new Map<string, any>();

    for (const s of students || []) {
      const key = s.nama_lengkap.toLowerCase().trim();
      mergedMap.set(key, {
        nama_lengkap: s.nama_lengkap,
        nisn_sekolah: s.nisn,
        jenjang_sekolah: s.jenjang,
        kelas_sekolah: s.kelas,
        tunggakan_sekolah: s.tunggakan_sekolah || [],
        biaya_sekolah: s.biaya_per_bulan,
        nisn_pesantren: null,
        jenjang_pesantren: null,
        kelas_pesantren: null,
        kategori_pesantren: null,
        tunggakan_pesantren: [],
        biaya_pesantren: 0,
        is_siswa: true,
        is_santri: false,
      });
    }

    for (const s of santriList || []) {
      const key = s.nama_lengkap.toLowerCase().trim();
      if (mergedMap.has(key)) {
        const existing = mergedMap.get(key);
        existing.nisn_pesantren = s.nisn;
        existing.jenjang_pesantren = s.jenjang;
        existing.kelas_pesantren = s.kelas;
        existing.kategori_pesantren = s.kategori;
        existing.tunggakan_pesantren = s.tunggakan_pesantren || [];
        existing.biaya_pesantren = s.biaya_per_bulan;
        existing.is_santri = true;
      } else {
        mergedMap.set(key, {
          nama_lengkap: s.nama_lengkap,
          nisn_sekolah: null,
          jenjang_sekolah: null,
          kelas_sekolah: null,
          tunggakan_sekolah: [],
          biaya_sekolah: 0,
          nisn_pesantren: s.nisn,
          jenjang_pesantren: s.jenjang,
          kelas_pesantren: s.kelas,
          kategori_pesantren: s.kategori,
          tunggakan_pesantren: s.tunggakan_pesantren || [],
          biaya_pesantren: s.biaya_per_bulan,
          is_siswa: false,
          is_santri: true,
        });
      }
    }

    return new Response(JSON.stringify({
      results: Array.from(mergedMap.values()),
      wa_sekolah: waSekolah,
      wa_pesantren: waPesantren,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
