/**
 * KeuanganAPI.gs
 * Transaksi keuangan dicatat berdasarkan transaksi aktual dan periode
 * waktu - TIDAK dialokasikan ke komoditas/blok/aktivitas tertentu.
 */

function getKeuanganData() {
  return getRecords_(SHEETS.KEUANGAN)
    .sort((a,b) => new Date(b.TANGGAL||0) - new Date(a.TANGGAL||0));
}

function saveKeuangan(data) { return saveRecord_(SHEETS.KEUANGAN, data, 'TRX'); }

/**
 * Ringkasan arus kas & biaya per jenis belanja pada rentang tanggal tertentu.
 * Mendukung analisa: total kas masuk, kas keluar, saldo, dan biaya per kategori/item.
 */
function getFinancialSummary(startDate, endDate) {
  const rows = getRecords_(SHEETS.KEUANGAN);
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (end) end.setHours(23,59,59,999);

  const filtered = rows.filter(r => inRange_(r.TANGGAL, start, end));

  const masuk = filtered.filter(r => r.JENIS === 'KAS MASUK')
    .reduce((s,r) => s + Number(r.TOTAL || 0), 0);
  const keluar = filtered.filter(r => r.JENIS === 'KAS KELUAR')
    .reduce((s,r) => s + Number(r.TOTAL || 0), 0);

  const byKategori = {};
  const byItem = {};
  filtered.forEach(r => {
    const k = r.KATEGORI || 'Lainnya';
    byKategori[k] = (byKategori[k] || 0) + Number(r.TOTAL || 0);
    if (r.ITEM) {
      byItem[r.ITEM] = (byItem[r.ITEM] || 0) + Number(r.TOTAL || 0);
    }
  });

  return {
    startDate, endDate, masuk, keluar, saldo: masuk-keluar,
    byKategori, byItem, jumlahTransaksi: filtered.length,
    transaksi: filtered.sort((a,b)=> new Date(b.TANGGAL||0) - new Date(a.TANGGAL||0))
  };
}
