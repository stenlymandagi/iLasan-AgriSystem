/**
 * MasterDataAPI.gs
 * Dimensi Spasial (PETANI -> LAHAN -> BLOK) dan master Komoditas/Varietas
 * yang menjadi fondasi hubungan antar-modul lain.
 */

/* ---- Petani ---- */
function getPetaniData() { return getRecords_(SHEETS.PETANI); }
function savePetani(data) { return saveRecord_(SHEETS.PETANI, data, 'PT'); }

/* ---- Lahan ---- */
function getLahanData() {
  const petani = getRecords_(SHEETS.PETANI);
  return getRecords_(SHEETS.LAHAN).map(l => {
    const p = petani.find(x => x.ID_PETANI === l.ID_PETANI);
    l.NAMA_PETANI = p ? p.NAMA : l.ID_PETANI;
    return l;
  });
}
function saveLahan(data) { return saveRecord_(SHEETS.LAHAN, data, 'LH'); }

/* ---- Blok ---- */
function getBlokData() {
  const lahan = getRecords_(SHEETS.LAHAN);
  return getRecords_(SHEETS.BLOK).map(b => {
    const l = lahan.find(x => x.ID_LAHAN === b.ID_LAHAN);
    b.NAMA_LAHAN = l ? l.NAMA_LAHAN : b.ID_LAHAN;
    return b;
  });
}
function saveBlok(data) { return saveRecord_(SHEETS.BLOK, data, 'BL'); }

/* ---- Komoditas ---- */
function getKomoditasData() { return getRecords_(SHEETS.KOMODITAS); }
function saveKomoditas(data) { return saveRecord_(SHEETS.KOMODITAS, data, 'KM'); }

/* ---- Varietas ---- */
function getVarietasData() {
  const komoditas = getRecords_(SHEETS.KOMODITAS);
  return getRecords_(SHEETS.VARIETAS).map(v => {
    const k = komoditas.find(x => x.ID_KOMODITAS === v.ID_KOMODITAS);
    v.NAMA_KOMODITAS = k ? k.NAMA_KOMODITAS : v.ID_KOMODITAS;
    return v;
  });
}
function saveVarietas(data) { return saveRecord_(SHEETS.VARIETAS, data, 'VR'); }

/** Ringkasan struktur PETANI -> LAHAN -> BLOK untuk dropdown/pemilihan cepat di modul lain. */
function getSpatialTree() {
  return {
    petani: getRecords_(SHEETS.PETANI),
    lahan: getRecords_(SHEETS.LAHAN),
    blok: getRecords_(SHEETS.BLOK),
    komoditas: getRecords_(SHEETS.KOMODITAS),
    varietas: getRecords_(SHEETS.VARIETAS)
  };
}
