/**
 * AktivitasAPI.gs
 * Pencatatan aktivitas budidaya granular pada level siklus/unit budidaya.
 * Tidak ada nominal biaya yang dipaksakan pada aktivitas (lihat KeuanganAPI.gs
 * untuk pencatatan transaksi keuangan yang terpisah).
 */

function getAktivitasData() {
  const siklus = getRecords_(SHEETS.SIKLUS);
  const unit = getRecords_(SHEETS.UNIT_BUDIDAYA);
  return getRecords_(SHEETS.AKTIVITAS).map(a => {
    const sk = siklus.find(x => x.ID_SIKLUS === a.ID_SIKLUS);
    const ub = unit.find(x => x.ID_UNIT === a.ID_UNIT);
    a.NAMA_SIKLUS = sk ? sk.NAMA_SIKLUS : a.ID_SIKLUS;
    a.ID_KOMODITAS_UNIT = ub ? ub.ID_KOMODITAS : '';
    return a;
  }).sort((x,y) => new Date(y.TANGGAL||0) - new Date(x.TANGGAL||0));
}

function saveAktivitas(data) {
  if (data.ID_UNIT && !data.ID_SIKLUS) {
    const unit = getRecordById_(SHEETS.UNIT_BUDIDAYA, data.ID_UNIT);
    if (unit) data.ID_SIKLUS = unit.ID_SIKLUS;
  }
  return saveRecord_(SHEETS.AKTIVITAS, data, 'AK');
}
