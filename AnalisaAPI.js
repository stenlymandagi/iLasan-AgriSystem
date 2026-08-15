/**
 * AnalisaAPI.gs
 * Prinsip kunci: tidak ada alokasi biaya ke komoditas. Yang dihitung adalah
 * "Laba/Rugi Usahatani Per Periode" (agregat), sedangkan performa per
 * komoditas disajikan terpisah sebagai "Kinerja Penerimaan Komoditas".
 */

/**
 * Laba/Rugi Usahatani Per Periode (pendekatan cash basis):
 * Total Penerimaan Periode - (Total Biaya Kas Periode + Penyusutan Periode).
 */
function getProfitLoss(startDate, endDate) {
  const summary = getFinancialSummary(startDate, endDate);
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  // Penyusutan periode: cocokkan PERIODE (yyyy-MM) yang jatuh dalam rentang tanggal.
  const penyusutan = getRecords_(SHEETS.PENYUSUTAN).filter(p => {
    if (!p.PERIODE) return false;
    const d = new Date(p.PERIODE + '-01');
    return inRange_(d, start, end ? new Date(new Date(end).getFullYear(), new Date(end).getMonth()+1, 0) : null);
  });
  const totalPenyusutan = penyusutan.reduce((s,p) => s + Number(p.NILAI_PENYUSUTAN||0), 0);

  const totalBiaya = summary.keluar + totalPenyusutan;
  const labaRugi = summary.masuk - totalBiaya;

  return {
    startDate, endDate,
    totalPenerimaan: summary.masuk,
    totalBiayaKas: summary.keluar,
    totalPenyusutan,
    totalBiaya,
    labaRugi,
    byKategori: summary.byKategori
  };
}

/**
 * Kinerja Penerimaan Komoditas (dari data PEMASARAN, bukan dari alokasi biaya):
 * volume, rata-rata harga jual, dan total penerimaan per komoditas pada suatu periode.
 */
function getCommodityPerformance(startDate, endDate) {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (end) end.setHours(23,59,59,999);

  const rows = getRecords_(SHEETS.PEMASARAN).filter(r => inRange_(r.TANGGAL, start, end));

  const byKomoditas = {};
  rows.forEach(r => {
    const k = r.KOMODITAS || 'Lainnya';
    if (!byKomoditas[k]) byKomoditas[k] = {KOMODITAS:k, VOLUME:0, PENERIMAAN:0};
    byKomoditas[k].VOLUME += Number(r.VOLUME||0);
    byKomoditas[k].PENERIMAAN += Number(r.TOTAL||0);
  });

  const result = Object.values(byKomoditas).map(x => {
    x.HARGA_RATA_RATA = x.VOLUME ? Math.round(x.PENERIMAAN / x.VOLUME) : 0;
    return x;
  }).sort((a,b) => b.PENERIMAAN - a.PENERIMAAN);

  return {startDate, endDate, data: result, totalPenerimaan: result.reduce((s,x)=>s+x.PENERIMAAN,0)};
}
