/* Ask SIPA embed. One line on any manufacturer site:
   <script src="https://YOUR-ASK-SIPA-HOST/embed.js" data-mfr="R-Control SIPs" data-color="#1f4e79"></script>
*/
(function () {
  var s = document.currentScript;
  var base = s.src.replace(/embed\.js.*$/, "");
  var mfr = s.getAttribute("data-mfr") || "";
  var color = s.getAttribute("data-color") || "#1f4e79";
  var label = s.getAttribute("data-label") || "Ask SIPA";

  var btn = document.createElement("button");
  btn.textContent = "? " + label;
  btn.setAttribute("aria-label", "Open " + label);
  btn.style.cssText = "position:fixed;right:18px;bottom:18px;z-index:99998;background:" + color + ";color:#fff;border:0;border-radius:999px;padding:12px 18px;font:600 15px -apple-system,Segoe UI,Roboto,Arial,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.25);cursor:pointer";

  var frame = document.createElement("iframe");
  frame.title = label;
  frame.src = base + "?embed=1&mfr=" + encodeURIComponent(mfr);
  frame.style.cssText = "position:fixed;right:18px;bottom:76px;width:min(420px,calc(100vw - 36px));height:min(640px,calc(100vh - 100px));border:0;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.35);z-index:99999;display:none;background:#fff";

  var open = false;
  btn.onclick = function () {
    open = !open;
    frame.style.display = open ? "block" : "none";
    btn.textContent = open ? "Close" : "? " + label;
  };
  document.body.appendChild(btn);
  document.body.appendChild(frame);
})();
