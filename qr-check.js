/* =========================================================
   QR check for the STUDENT page (add before script.js)
   <script src="qr-check.js"></script>

   The lecturer's QR link looks like  index.html?exp=1759490000000&k=abc123
   - valid link  -> the normal attendance page opens
   - expired / missing link -> the page is covered by a message
   Your existing student code is not changed.
   ========================================================= */
(function () {
  var REQUIRE_QR = true; // true = students must come through a QR link. false = direct opening still works.

  var exp = Number(new URLSearchParams(location.search).get("exp"));
  var hasQr = exp > 0;

  if (!hasQr && !REQUIRE_QR) return;

  function block(title, text) {
    var box = document.createElement("div");
    box.style.cssText = "position:fixed;inset:0;z-index:9999;background:#f3f4f6;display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,Arial,sans-serif;text-align:center";
    box.innerHTML = '<div style="background:#fff;border:1px solid #d1d5db;border-radius:16px;padding:32px 24px;max-width:380px">' +
      '<div style="font-size:2.4rem;margin-bottom:8px">&#9203;</div>' +
      '<h1 style="font-size:1.4rem;margin:0 0 8px;color:#111827"></h1>' +
      '<p style="margin:0;color:#6b7280;line-height:1.5"></p></div>';
    box.querySelector("h1").textContent = title;
    box.querySelector("p").textContent = text;
    document.body.appendChild(box);
  }

  function start() {
    if (!hasQr) { block("Scan the QR code", "Please scan the QR code shown by your lecturer to mark attendance."); return; }
    var left = exp - Date.now();
    if (left <= 0) { block("QR code expired", "This QR code is no longer valid. Ask your lecturer for a new one."); return; }
    // lock the page when the 5 minutes run out
    setTimeout(function () { block("QR code expired", "Time is up. Ask your lecturer for a new QR code."); }, left);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
