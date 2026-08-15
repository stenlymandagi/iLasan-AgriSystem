/**
 * iLasan Agri System
 * Core: routing, setup database, dan helper generik yang dipakai oleh
 * seluruh modul *API.gs. Konfigurasi nama sheet dipusatkan di Config.gs
 * agar tidak ada deklarasi SHEET_xxx berulang di banyak file.
 */

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle(APP.NAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Membuat seluruh sheet fondasi (jika belum ada) beserta header kolomnya.
 * Aman dijalankan berulang kali (idempotent).
 */
function setupApplication() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS).forEach(key => {
    const name = SHEETS[key];
    if (!ss.getSheetByName(name)) {
      ss.insertSheet(name);
    }
  });
  initializeHeaders_();
  return {ok:true, message:'Struktur database iLasan Agri System berhasil disiapkan.'};
}

function initializeHeaders_() {
  const headers = {};
  headers[SHEETS.PETANI] = ['ID_PETANI','NAMA','NIK','TELEPON','ALAMAT','DESA','KECAMATAN','KABUPATEN','STATUS','CREATED_AT'];
  headers[SHEETS.LAHAN] = ['ID_LAHAN','ID_PETANI','NAMA_LAHAN','LOKASI','DESA','KECAMATAN','KABUPATEN','LUAS','SATUAN_LUAS','STATUS','KOORDINAT','CATATAN','CREATED_AT'];
  headers[SHEETS.BLOK] = ['ID_BLOK','ID_LAHAN','NAMA_BLOK','LUAS','SATUAN_LUAS','STATUS','KOORDINAT','CATATAN','CREATED_AT'];
  headers[SHEETS.KOMODITAS] = ['ID_KOMODITAS','NAMA_KOMODITAS','KATEGORI','SATUAN','STATUS','CREATED_AT'];
  headers[SHEETS.VARIETAS] = ['ID_VARIETAS','ID_KOMODITAS','NAMA_VARIETAS','SUMBER_BENIH','STATUS','CATATAN','CREATED_AT'];
  headers[SHEETS.SIKLUS] = ['ID_SIKLUS','ID_BLOK','NAMA_SIKLUS','TANGGAL_MULAI','TANGGAL_SELESAI','STATUS','SISTEM_TANAM','CATATAN','CREATED_AT'];
  headers[SHEETS.UNIT_BUDIDAYA] = ['ID_UNIT','ID_SIKLUS','ID_KOMODITAS','ID_VARIETAS','LUAS','SATUAN_LUAS','PROPORSI','JUMLAH_TANAMAN','TANGGAL_TANAM','CATATAN','CREATED_AT'];
  headers[SHEETS.SOP] = ['ID_SOP','ID_KOMODITAS','NAMA_SOP','VERSI','STATUS','CREATED_AT'];
  headers[SHEETS.SOP_DETAIL] = ['ID_SOP_DETAIL','ID_SOP','URUTAN','TAHAPAN','AKTIVITAS','HARI_KE','TOLERANSI_HARI','CATATAN','CREATED_AT'];
  headers[SHEETS.AKTIVITAS] = ['ID_AKTIVITAS','ID_SIKLUS','ID_UNIT','TANGGAL','TAHAPAN','AKTIVITAS','INPUT','DOSIS','VOLUME','SATUAN','OPT_SASARAN','STATUS','CATATAN','CREATED_AT'];
  headers[SHEETS.KEUANGAN] = ['ID_TRANSAKSI','TANGGAL','PERIODE','JENIS','KATEGORI','ITEM','DESKRIPSI','QTY','SATUAN','HARGA_SATUAN','TOTAL','METODE_PEMBAYARAN','SUMBER_DANA','REFERENSI','CATATAN','CREATED_AT'];
  headers[SHEETS.PANEN] = ['ID_BATCH','ID_SIKLUS','ID_UNIT','TANGGAL_PANEN','KOMODITAS','VARIETAS','BLOK','BERAT_TOTAL','SATUAN','GRADE_A','GRADE_B','AFKIR','LOKASI_PENYIMPANAN','STATUS','CATATAN','CREATED_AT'];
  headers[SHEETS.PASCAPANEN] = ['ID_PASCAPANEN','ID_BATCH','TANGGAL','PROSES','BERAT_MASUK','BERAT_KELUAR','SUSUT','SATUAN','CATATAN','CREATED_AT'];
  headers[SHEETS.PEMASARAN] = ['ID_PENJUALAN','ID_BATCH','TANGGAL','PEMBELI','KOMODITAS','VOLUME','SATUAN','HARGA_SATUAN','TOTAL','CATATAN','CREATED_AT'];
  headers[SHEETS.ASET] = ['ID_ASET','KODE_ASET','NAMA_ASET','KATEGORI','MERK','TIPE','NOMOR_SERI','TANGGAL_PEROLEHAN','SUMBER_PEROLEHAN','HARGA_PEROLEHAN','KONDISI_AWAL','NILAI_RESIDU','UMUR_EKONOMIS_TAHUN','STATUS','LOKASI','CATATAN','CREATED_AT'];
  headers[SHEETS.PENYUSUTAN] = ['ID_PENYUSUTAN','ID_ASET','PERIODE','NILAI_PENYUSUTAN','AKUMULASI_PENYUSUTAN','NILAI_BUKU','METODE','CATATAN','CREATED_AT'];

  Object.keys(headers).forEach(name => {
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
    if (!sh) return;
    if (sh.getLastRow() === 0) {
      sh.getRange(1,1,1,headers[name].length).setValues([headers[name]]);
      sh.setFrozenRows(1);
    } else if (sh.getRange(1,1).getValue() === '') {
      sh.getRange(1,1,1,headers[name].length).setValues([headers[name]]);
      sh.setFrozenRows(1);
    }
  });
}

/* ---------------- Helper generik (dipakai semua modul *API.gs) ---------------- */

function saveRecord_(sheetName, data, prefix) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sh) throw new Error('Sheet '+sheetName+' belum tersedia. Jalankan Setup Database.');

  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const idHeader = headers[0];
  const isNew = !data[idHeader];
  if (isNew) data[idHeader] = generateId_(prefix);

  if (!isNew) {
    // update baris yang sudah ada berdasarkan ID
    const values = sh.getDataRange().getValues();
    for (let i=1;i<values.length;i++){
      if (values[i][0] === data[idHeader]) {
        const row = headers.map((h,idx) => data[h] !== undefined && data[h] !== '' ? data[h] : values[i][idx]);
        sh.getRange(i+1,1,1,headers.length).setValues([row]);
        return {ok:true, id:data[idHeader], message:'Data berhasil diperbarui.'};
      }
    }
  }

  const row = headers.map(h => data[h] !== undefined ? data[h] : '');
  const createdIndex = headers.indexOf('CREATED_AT');
  if (createdIndex >= 0 && !row[createdIndex]) row[createdIndex] = new Date();
  sh.appendRow(row);
  return {ok:true, id:data[idHeader], message:'Data berhasil disimpan.'};
}

function getRecords_(sheetName) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sh || sh.getLastRow() < 2) return [];
  const values = sh.getDataRange().getValues();
  const headers = values.shift();
  return values.filter(row => row.some(v => v !== '')).map(row => {
    const obj = {};
    headers.forEach((h,i) => obj[h] = formatValue_(row[i]));
    return obj;
  });
}

function getRecordById_(sheetName, id) {
  if (!id) return null;
  return getRecords_(sheetName).find(r => r[Object.keys(r)[0]] === id) || null;
}

/** Endpoint generik untuk mengambil satu record utuh (dipakai fitur Lihat/Edit/Cetak). */
function getRecordById(sheetName, id) {
  if (Object.values(SHEETS).indexOf(sheetName) === -1) {
    throw new Error('Sheet tidak dikenal: ' + sheetName);
  }
  return getRecordById_(sheetName, id);
}

function deleteRecord_(sheetName, id) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sh) throw new Error('Sheet '+sheetName+' belum tersedia.');
  const values = sh.getDataRange().getValues();
  for (let i=1;i<values.length;i++){
    if (values[i][0] === id){
      sh.deleteRow(i+1);
      return {ok:true, message:'Data berhasil dihapus.'};
    }
  }
  return {ok:false, message:'Data tidak ditemukan.'};
}

/** Endpoint generik untuk hapus data, dibatasi hanya sheet yang dikenal. */
function deleteRecord(sheetName, id) {
  if (Object.values(SHEETS).indexOf(sheetName) === -1) {
    throw new Error('Sheet tidak dikenal: ' + sheetName);
  }
  return deleteRecord_(sheetName, id);
}

function countRows_(sheetName) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  return sh ? Math.max(0, sh.getLastRow()-1) : 0;
}

function sumByType_(sheetName, type) {
  return getRecords_(sheetName)
    .filter(r => r.JENIS === type)
    .reduce((s,r) => s + Number(r.TOTAL || 0), 0);
}

function generateId_(prefix) {
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyyMMddHHmmss');
  return prefix + '-' + stamp + '-' + Math.floor(Math.random()*900+100);
}

function formatValue_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
  return v;
}

/** Cek apakah tanggal (Date/string) berada pada rentang [start,end], inklusif. */
function inRange_(dateVal, start, end) {
  if (!dateVal) return false;
  const d = new Date(dateVal);
  if (start && d < start) return false;
  if (end && d > end) return false;
  return true;
}
