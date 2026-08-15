/**
 * AsetAPI.gs
 * Rantai aset: PEROLEHAN -> PEMELIHARAAN -> PENYUSUTAN.
 * Metode awal penyusutan: garis lurus. Penyusutan tidak dialokasikan ke
 * komoditas; ia masuk sebagai biaya non-kas periodik (lihat AnalisaAPI.gs).
 */

function getAsetData() { return getRecords_(SHEETS.ASET); }

function saveAset(data) {
  ['HARGA_PEROLEHAN','NILAI_RESIDU','UMUR_EKONOMIS_TAHUN'].forEach(k => data[k] = Number(data[k] || 0));
  return saveRecord_(SHEETS.ASET, data, 'AST');
}

/** Penyusutan tahunan garis lurus: (Harga Perolehan - Nilai Residu) / Umur Ekonomis. */
function computeAnnualDepreciation_(aset) {
  const harga = Number(aset.HARGA_PEROLEHAN || 0);
  const residu = Number(aset.NILAI_RESIDU || 0);
  const umur = Number(aset.UMUR_EKONOMIS_TAHUN || 0);
  if (!umur) return 0;
  return Math.max(0, (harga - residu) / umur);
}

/**
 * Proyeksi jadwal penyusutan bulanan sebuah aset dari tanggal perolehan
 * sampai akhir umur ekonomis (tidak disimpan ke sheet, hanya untuk tampilan).
 */
function getDepreciationSchedule(idAset) {
  const aset = getRecordById_(SHEETS.ASET, idAset);
  if (!aset) return {ok:false, message:'Aset tidak ditemukan.'};

  const annual = computeAnnualDepreciation_(aset);
  const monthly = annual / 12;
  const bulan = Math.round(Number(aset.UMUR_EKONOMIS_TAHUN || 0) * 12);
  const mulai = aset.TANGGAL_PEROLEHAN ? new Date(aset.TANGGAL_PEROLEHAN) : new Date();

  const schedule = [];
  let akumulasi = 0;
  for (let i=1; i<=bulan; i++) {
    akumulasi += monthly;
    const nilaiBuku = Math.max(Number(aset.NILAI_RESIDU||0), Number(aset.HARGA_PEROLEHAN||0) - akumulasi);
    const tgl = new Date(mulai);
    tgl.setMonth(tgl.getMonth() + i);
    schedule.push({
      PERIODE: Utilities.formatDate(tgl, Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM'),
      NILAI_PENYUSUTAN: Math.round(monthly),
      AKUMULASI_PENYUSUTAN: Math.round(akumulasi),
      NILAI_BUKU: Math.round(nilaiBuku)
    });
  }
  return {ok:true, aset, annual, monthly, schedule};
}

/** Menghitung & menyimpan satu baris penyusutan untuk periode 'YYYY-MM' tertentu (tidak duplikat). */
function runDepreciation(idAset, periode) {
  const aset = getRecordById_(SHEETS.ASET, idAset);
  if (!aset) return {ok:false, message:'Aset tidak ditemukan.'};

  const existing = getRecords_(SHEETS.PENYUSUTAN).filter(p => p.ID_ASET === idAset);
  if (existing.some(p => p.PERIODE === periode)) {
    return {ok:false, message:'Penyusutan untuk periode ini sudah tercatat.'};
  }

  const monthly = computeAnnualDepreciation_(aset) / 12;
  const akumulasiSebelumnya = existing.reduce((s,p) => s + Number(p.NILAI_PENYUSUTAN||0), 0);
  const akumulasi = akumulasiSebelumnya + monthly;
  const nilaiBuku = Math.max(Number(aset.NILAI_RESIDU||0), Number(aset.HARGA_PEROLEHAN||0) - akumulasi);

  saveRecord_(SHEETS.PENYUSUTAN, {
    ID_ASET: idAset,
    PERIODE: periode,
    NILAI_PENYUSUTAN: Math.round(monthly),
    AKUMULASI_PENYUSUTAN: Math.round(akumulasi),
    NILAI_BUKU: Math.round(nilaiBuku),
    METODE: 'Garis Lurus'
  }, 'PNY');

  return {ok:true, message:'Penyusutan periode ' + periode + ' berhasil dicatat.'};
}

function getPenyusutanData(idAset) {
  const rows = getRecords_(SHEETS.PENYUSUTAN).sort((a,b) => (b.PERIODE||'').localeCompare(a.PERIODE||''));
  return idAset ? rows.filter(r => r.ID_ASET === idAset) : rows;
}
