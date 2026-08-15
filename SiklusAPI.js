/**
 * SiklusAPI.gs
 * Dimensi Budidaya: BLOK -> SIKLUS BUDIDAYA -> UNIT BUDIDAYA.
 * Unit Budidaya = kombinasi BLOK + SIKLUS + TANAMAN, sehingga satu siklus
 * dapat memiliki lebih dari satu Unit Budidaya (mendukung tumpangsari).
 */

/* ---- Siklus Budidaya ---- */
function getSiklusData() {
  const blok = getRecords_(SHEETS.BLOK);
  return getRecords_(SHEETS.SIKLUS).map(s => {
    const b = blok.find(x => x.ID_BLOK === s.ID_BLOK);
    s.NAMA_BLOK = b ? b.NAMA_BLOK : s.ID_BLOK;
    return s;
  });
}
function saveSiklus(data) { return saveRecord_(SHEETS.SIKLUS, data, 'SK'); }

/* ---- Unit Budidaya ---- */
function getUnitBudidayaData() {
  const siklus = getRecords_(SHEETS.SIKLUS);
  const blok = getRecords_(SHEETS.BLOK);
  const komoditas = getRecords_(SHEETS.KOMODITAS);
  const varietas = getRecords_(SHEETS.VARIETAS);

  return getRecords_(SHEETS.UNIT_BUDIDAYA).map(u => {
    const sk = siklus.find(x => x.ID_SIKLUS === u.ID_SIKLUS);
    const bl = sk ? blok.find(x => x.ID_BLOK === sk.ID_BLOK) : null;
    const km = komoditas.find(x => x.ID_KOMODITAS === u.ID_KOMODITAS);
    const vr = varietas.find(x => x.ID_VARIETAS === u.ID_VARIETAS);
    u.NAMA_SIKLUS = sk ? sk.NAMA_SIKLUS : u.ID_SIKLUS;
    u.NAMA_BLOK = bl ? bl.NAMA_BLOK : '-';
    u.NAMA_KOMODITAS = km ? km.NAMA_KOMODITAS : u.ID_KOMODITAS;
    u.NAMA_VARIETAS = vr ? vr.NAMA_VARIETAS : '-';
    return u;
  });
}

function saveUnitBudidaya(data) { return saveRecord_(SHEETS.UNIT_BUDIDAYA, data, 'UB'); }

/** Daftar Unit Budidaya milik satu siklus tertentu - dipakai untuk cek tumpangsari & form Aktivitas/Panen. */
function getUnitBudidayaBySiklus(idSiklus) {
  return getUnitBudidayaData().filter(u => u.ID_SIKLUS === idSiklus);
}
