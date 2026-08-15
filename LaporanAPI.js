/**
 * LaporanAPI.gs
 * Lapisan output: menyusun data dari modul lain menjadi laporan siap cetak.
 * Tidak menyimpan data baru - murni agregasi untuk ditampilkan/diekspor.
 */

/** Laporan Budidaya: seluruh aktivitas pada satu siklus. */
function getLaporanBudidaya(idSiklus) {
  const siklus = getRecordById_(SHEETS.SIKLUS, idSiklus);
  if (!siklus) return {ok:false, message:'Siklus tidak ditemukan.'};
  const unit = getUnitBudidayaBySiklus(idSiklus);
  const aktivitas = getRecords_(SHEETS.AKTIVITAS)
    .filter(a => a.ID_SIKLUS === idSiklus)
    .sort((a,b) => new Date(a.TANGGAL||0) - new Date(b.TANGGAL||0));
  return {ok:true, siklus, unit, aktivitas};
}

/** Laporan Keuangan: bungkus tipis di atas getFinancialSummary untuk konsistensi penamaan. */
function getLaporanKeuangan(startDate, endDate) {
  return getFinancialSummary(startDate, endDate);
}

/** Laporan Produksi: rekap panen dan penjualan pada suatu rentang tanggal. */
function getLaporanProduksi(startDate, endDate) {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (end) end.setHours(23,59,59,999);

  const panen = getRecords_(SHEETS.PANEN).filter(p => inRange_(p.TANGGAL_PANEN, start, end));
  const penjualan = getRecords_(SHEETS.PEMASARAN).filter(p => inRange_(p.TANGGAL, start, end));

  const totalBerat = panen.reduce((s,p) => s + Number(p.BERAT_TOTAL||0), 0);
  const totalPenjualan = penjualan.reduce((s,p) => s + Number(p.TOTAL||0), 0);

  return {startDate, endDate, panen, penjualan, totalBerat, totalPenjualan};
}

/** Laporan Traceability: alias getTraceability agar konsisten di menu Laporan. */
function getLaporanTraceability(batchId) {
  return getTraceability(batchId);
}
