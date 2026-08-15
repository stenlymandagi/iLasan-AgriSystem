/**
 * SOPAPI.gs
 * SOP dirancang sebagai template aktivitas budidaya per komoditas, bukan
 * sekadar dokumen. SOP_DETAIL dapat "diterapkan" ke sebuah Unit Budidaya
 * untuk membentuk rencana Aktivitas secara otomatis (tanggal = tanggal
 * tanam + HARI_KE).
 */

/* ---- SOP (master) ---- */
function getSopData() {
  const komoditas = getRecords_(SHEETS.KOMODITAS);
  return getRecords_(SHEETS.SOP).map(s => {
    const k = komoditas.find(x => x.ID_KOMODITAS === s.ID_KOMODITAS);
    s.NAMA_KOMODITAS = k ? k.NAMA_KOMODITAS : s.ID_KOMODITAS;
    return s;
  });
}
function saveSop(data) { return saveRecord_(SHEETS.SOP, data, 'SOP'); }

/* ---- SOP Detail (tahapan) ---- */
function getSopDetailData(idSop) {
  const rows = getRecords_(SHEETS.SOP_DETAIL);
  const filtered = idSop ? rows.filter(r => r.ID_SOP === idSop) : rows;
  return filtered.sort((a,b) => Number(a.URUTAN||0) - Number(b.URUTAN||0));
}
function saveSopDetail(data) { return saveRecord_(SHEETS.SOP_DETAIL, data, 'SPD'); }

/**
 * Membuat rencana Aktivitas (status "Rencana") untuk sebuah Unit Budidaya
 * berdasarkan tahapan pada SOP terpilih, dijadwalkan dari tanggalTanam.
 * Tidak menimpa aktivitas yang sudah ada.
 */
function generateAktivitasFromSOP(idUnit, idSop, tanggalTanam) {
  const unit = getRecordById_(SHEETS.UNIT_BUDIDAYA, idUnit);
  if (!unit) return {ok:false, message:'Unit Budidaya tidak ditemukan.'};

  const detail = getSopDetailData(idSop);
  if (!detail.length) return {ok:false, message:'SOP belum memiliki tahapan (SOP_DETAIL).'};

  const start = new Date(tanggalTanam);
  let created = 0;
  detail.forEach(d => {
    const tgl = new Date(start);
    tgl.setDate(tgl.getDate() + Number(d.HARI_KE || 0));
    saveRecord_(SHEETS.AKTIVITAS, {
      ID_SIKLUS: unit.ID_SIKLUS,
      ID_UNIT: unit.ID_UNIT,
      TANGGAL: Utilities.formatDate(tgl, Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd'),
      TAHAPAN: d.TAHAPAN,
      AKTIVITAS: d.AKTIVITAS,
      STATUS: 'Rencana',
      CATATAN: 'Dibuat otomatis dari SOP ' + idSop
    }, 'AK');
    created++;
  });

  return {ok:true, message: created + ' rencana aktivitas berhasil dibuat dari SOP.'};
}
