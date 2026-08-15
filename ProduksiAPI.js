/**
 * ProduksiAPI.gs
 * Dimensi Produk/Traceability: UNIT BUDIDAYA -> PANEN -> BATCH PANEN ->
 * PASCAPANEN -> PENJUALAN. Setiap batch panen dapat ditelusuri kembali
 * ke unit budidaya, siklus, blok, lahan, dan petani (backward), maupun
 * ke pembeli (forward).
 */

/* ---- Panen (batch) ---- */
function getPanenData() {
  return getRecords_(SHEETS.PANEN)
    .sort((a,b) => new Date(b.TANGGAL_PANEN||0) - new Date(a.TANGGAL_PANEN||0));
}

/** Menyimpan panen; KOMODITAS/VARIETAS/BLOK otomatis diisi dari Unit Budidaya bila tersedia. */
function savePanen(data) {
  if (data.ID_UNIT) {
    const unit = getRecordById_(SHEETS.UNIT_BUDIDAYA, data.ID_UNIT);
    if (unit) {
      const komoditas = getRecordById_(SHEETS.KOMODITAS, unit.ID_KOMODITAS);
      const varietas = getRecordById_(SHEETS.VARIETAS, unit.ID_VARIETAS);
      const siklus = getRecordById_(SHEETS.SIKLUS, unit.ID_SIKLUS);
      const blok = siklus ? getRecordById_(SHEETS.BLOK, siklus.ID_BLOK) : null;
      data.ID_SIKLUS = data.ID_SIKLUS || unit.ID_SIKLUS;
      data.KOMODITAS = data.KOMODITAS || (komoditas ? komoditas.NAMA_KOMODITAS : '');
      data.VARIETAS = data.VARIETAS || (varietas ? varietas.NAMA_VARIETAS : '');
      data.BLOK = data.BLOK || (blok ? blok.NAMA_BLOK : '');
    }
  }
  return saveRecord_(SHEETS.PANEN, data, 'PAN');
}

/* ---- Pascapanen ---- */
function getPascapanenData(idBatch) {
  const rows = getRecords_(SHEETS.PASCAPANEN);
  return idBatch ? rows.filter(r => r.ID_BATCH === idBatch) : rows;
}

function savePascapanen(data) {
  data.BERAT_MASUK = Number(data.BERAT_MASUK || 0);
  data.BERAT_KELUAR = Number(data.BERAT_KELUAR || 0);
  if (!data.SUSUT) data.SUSUT = Math.max(0, data.BERAT_MASUK - data.BERAT_KELUAR);
  return saveRecord_(SHEETS.PASCAPANEN, data, 'PP');
}

/* ---- Pemasaran / Penjualan ---- */
function getPemasaranData(idBatch) {
  const rows = getRecords_(SHEETS.PEMASARAN)
    .sort((a,b) => new Date(b.TANGGAL||0) - new Date(a.TANGGAL||0));
  return idBatch ? rows.filter(r => r.ID_BATCH === idBatch) : rows;
}

function savePemasaran(data) {
  if (data.ID_BATCH && !data.KOMODITAS) {
    const batch = getRecordById_(SHEETS.PANEN, data.ID_BATCH);
    if (batch) data.KOMODITAS = batch.KOMODITAS;
  }
  data.VOLUME = Number(data.VOLUME || 0);
  data.HARGA_SATUAN = Number(data.HARGA_SATUAN || 0);
  if (!data.TOTAL) data.TOTAL = data.VOLUME * data.HARGA_SATUAN;
  return saveRecord_(SHEETS.PEMASARAN, data, 'JL');
}

/**
 * Backward traceability: PRODUK -> BATCH -> PANEN -> UNIT -> SIKLUS -> BLOK -> LAHAN -> PETANI,
 * dilengkapi aktivitas budidaya terkait dan forward traceability ke penjualan.
 */
function getTraceability(batchId) {
  const panen = getRecordById_(SHEETS.PANEN, batchId);
  if (!panen) return {ok:false, message:'Batch panen tidak ditemukan.'};

  const unit = panen.ID_UNIT ? getRecordById_(SHEETS.UNIT_BUDIDAYA, panen.ID_UNIT) : null;
  const siklus = panen.ID_SIKLUS ? getRecordById_(SHEETS.SIKLUS, panen.ID_SIKLUS) : null;
  const blok = siklus && siklus.ID_BLOK ? getRecordById_(SHEETS.BLOK, siklus.ID_BLOK) : null;
  const lahan = blok && blok.ID_LAHAN ? getRecordById_(SHEETS.LAHAN, blok.ID_LAHAN) : null;
  const petani = lahan && lahan.ID_PETANI ? getRecordById_(SHEETS.PETANI, lahan.ID_PETANI) : null;

  const aktivitas = getRecords_(SHEETS.AKTIVITAS).filter(x => x.ID_SIKLUS === panen.ID_SIKLUS);
  const pascapanen = getPascapanenData(batchId);
  const penjualan = getPemasaranData(batchId);

  return {ok:true, panen, unit, siklus, blok, lahan, petani, aktivitas, pascapanen, penjualan};
}
