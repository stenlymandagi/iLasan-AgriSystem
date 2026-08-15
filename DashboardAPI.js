/**
 * DashboardAPI.gs
 * Indikator ringkas lintas modul untuk halaman Dashboard.
 */

function getDashboardData() {
  const data = {
    petani: countRows_(SHEETS.PETANI),
    lahan: countRows_(SHEETS.LAHAN),
    blok: countRows_(SHEETS.BLOK),
    siklus: countRows_(SHEETS.SIKLUS),
    unitBudidaya: countRows_(SHEETS.UNIT_BUDIDAYA),
    aktivitas: countRows_(SHEETS.AKTIVITAS),
    panen: countRows_(SHEETS.PANEN),
    kasMasuk: sumByType_(SHEETS.KEUANGAN, 'KAS MASUK'),
    kasKeluar: sumByType_(SHEETS.KEUANGAN, 'KAS KELUAR'),
    assets: countRows_(SHEETS.ASET)
  };
  data.saldo = data.kasMasuk - data.kasKeluar;

  // Aktivitas terjadwal yang belum "Selesai" dan tanggalnya sudah lewat
  const today = new Date(); today.setHours(0,0,0,0);
  data.aktivitasTerlambat = getRecords_(SHEETS.AKTIVITAS).filter(a => {
    if (!a.TANGGAL || a.STATUS === 'Selesai') return false;
    const d = new Date(a.TANGGAL);
    return d < today;
  }).length;

  // Siklus yang masih berjalan (tanpa TANGGAL_SELESAI atau status Aktif)
  data.siklusAktif = getRecords_(SHEETS.SIKLUS).filter(s => s.STATUS === 'Aktif' || !s.TANGGAL_SELESAI).length;

  return data;
}
