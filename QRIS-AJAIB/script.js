import SETTINGS from '../settings.js';

window.addEventListener("keydown", function (e) {
  if ((e.key === "F5") || (e.ctrlKey && e.key.toLowerCase() === "r")) {
    e.preventDefault();
    alert("❌ Tidak bisa refresh di halaman ini.");
  }
});

window.addEventListener("beforeunload", function (e) {
  e.preventDefault();
  e.returnValue = "Transaksi Anda bisa gagal. Yakin ingin keluar?";
});

document.addEventListener("visibilitychange", function () {
  if (document.hidden) {
    alert("⚠️ Jangan tinggalkan halaman ini selama transaksi berlangsung.");
  }
});

let user = {
  saldo: 0,
  status: false,
  amount: 0,
  transactionId: null,
  interval: null
};

window.buatPembayaran = async function () {
  const jumlahDeposit = parseInt(document.getElementById("jumlah").value);
  if (!jumlahDeposit || jumlahDeposit <= 0) return alert("Masukkan jumlah yang valid!");

  const { apikey, qrisCode } = SETTINGS.QRIS;
  const res = await fetch(`https://www.wannhosting.web.id/api/orkut/createpayment?apikey=${apikey}&amount=${jumlahDeposit}&codeqr=${qrisCode}`);
  const json = await res.json();

  if (!json?.result) return alert("❌ Gagal membuat QRIS.");

  const data = json.result;
  user.status = true;
  user.amount = jumlahDeposit;
  user.transactionId = data.transactionId;

  document.getElementById("inputArea").classList.add("hidden");
  document.getElementById("qrisArea").classList.remove("hidden");
  document.getElementById("batalBtn").classList.remove("hidden");
  document.getElementById("suksesArea").classList.add("hidden");

  document.getElementById("qrisImage").src = data.qrImageUrl;
  document.getElementById("paymentInfo").innerHTML = `
    💰 Jumlah: Rp ${jumlahDeposit.toLocaleString()}<br>
    🆔 Transaksi: ${data.transactionId}<br>
    ⏰ Expired: 5 menit
  `;

  if (user.interval) clearInterval(user.interval);
  user.interval = setInterval(cekStatusPembayaran, SETTINGS.CHECK_INTERVAL_MS);
};

window.batalkanPembayaran = function () {
  if (!user.status) return alert("Tidak ada transaksi aktif.");
  user.status = false;
  clearInterval(user.interval);
  user.transactionId = null;
  user.amount = 0;

  document.getElementById("qrisArea").classList.add("hidden");
  document.getElementById("batalBtn").classList.add("hidden");
  document.getElementById("suksesArea").classList.add("hidden");
  document.getElementById("inputArea").classList.remove("hidden");
};

async function cekStatusPembayaran() {
  if (!user.status) return clearInterval(user.interval);

  const { apikey, merchantId, keyorkut } = SETTINGS.QRIS;
  const res = await fetch(`https://www.wannhosting.web.id/api/orkut/cekstatus?apikey=${apikey}&merchant=${merchantId}&keyorkut=${keyorkut}`);
  const json = await res.json();

  if (json?.amount == user.amount) {
    user.status = false;
    clearInterval(user.interval);
    user.saldo += user.amount;

    const trxId = "FR3-" + Math.floor(Math.random() * 1000000).toString().padStart(6, "0");

    document.getElementById("qrisArea").classList.add("hidden");
    document.getElementById("batalBtn").classList.add("hidden");
    document.getElementById("suksesArea").classList.remove("hidden");

    document.getElementById("suksesInfo").innerHTML = `
      <strong>Pembayaran Berhasil ✅</strong><br><br>
      💰 Jumlah: Rp ${user.amount.toLocaleString()}<br>
      🆔 ID Transaksi: ${trxId}<br>
    `;
  }
}
