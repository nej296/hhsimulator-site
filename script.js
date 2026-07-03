// ---- Reveal on scroll ----
const io = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// Safety net: guarantee everything is visible shortly after load, even if the
// observer never fires for an element.
window.addEventListener("load", () => {
  setTimeout(() => {
    document.querySelectorAll(".reveal:not(.in)").forEach((el) => el.classList.add("in"));
  }, 700);
});

// ---- Scale-to-fit hero ----
// The hero is a fixed-size design; we scale it uniformly (transform: scale) so
// the layout looks IDENTICAL at every monitor resolution — it never reflows or
// changes proportion, it just scales as a whole to fit the viewport, so the
// whole hero (title through the download counter) is always fully on screen.
function fitStage() {
  const stage = document.querySelector(".stage");
  const hero = document.querySelector(".hero");
  if (!stage || !hero) return;

  if (window.innerWidth <= 640) {
    // Phones: no scaling — CSS switches the hero to a fluid, scrolling layout.
    hero.style.transform = "none";
    stage.style.width = "";
    stage.style.height = "";
    return;
  }

  const header = document.querySelector(".site-header");
  const footer = document.querySelector(".site-footer");

  // Reset to measure the natural (unscaled) size.
  hero.style.transform = "none";
  const natW = hero.offsetWidth;
  const natH = hero.offsetHeight;
  if (!natW || !natH) return;

  const headerH = header ? header.offsetHeight : 0;
  const footerH = footer ? footer.offsetHeight : 0;
  const availW = document.documentElement.clientWidth - 32;
  const availH = window.innerHeight - headerH - footerH - 16;

  // Never scale above 1 (keep the tuned design's size); shrink to fit smaller
  // viewports so the proportions stay constant everywhere.
  const scale = Math.max(0.1, Math.min(1, availW / natW, availH / natH));
  hero.style.transform = "scale(" + scale + ")";
  stage.style.width = Math.ceil(natW * scale) + "px";
  stage.style.height = Math.ceil(natH * scale) + "px";
}

window.addEventListener("resize", fitStage);
window.addEventListener("load", fitStage);
document.addEventListener("DOMContentLoaded", fitStage);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitStage);
(function () {
  const heroImg = document.querySelector(".hero-figure img");
  if (heroImg && !heroImg.complete) heroImg.addEventListener("load", fitStage);
})();
fitStage();

// ---- Download counter ----
// The counter reflects how many times the installer has been downloaded, with a
// one-count-per-computer limit. A shared tally is kept by a lightweight public
// counter (Abacus); `/get` reads it without incrementing and `/hit` increments
// it. Each browser increments at most once (guarded by localStorage), so one
// person clicking many times — or across Windows/macOS/Linux — counts once.
const COUNTER_BASE = "https://abacus.jasoncameron.dev";
const COUNTER_NS = "hhsimulator-com-9f3a";
const COUNTER_KEY = "downloads";
const COUNTED_FLAG = "hh_downloaded_v1";   // set once this computer has been counted
const LAST_VALUE = "hh_download_count_v1";  // last good value, to avoid showing 0 on API hiccups

const counterEl = document.getElementById("counter-num");

function animateTo(el, value) {
  if (!el) return;
  const duration = 1100;
  const start = performance.now();
  el.classList.add("ticking");
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(value * eased).toLocaleString();
    if (t < 1) requestAnimationFrame(frame);
    else {
      el.textContent = value.toLocaleString();
      el.classList.remove("ticking");
    }
  }
  requestAnimationFrame(frame);
}

function showCount(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return;
  try { localStorage.setItem(LAST_VALUE, String(value)); } catch (_) {}
  animateTo(counterEl, value);
}

// Read the current total without incrementing.
async function loadDownloadCount() {
  try {
    const res = await fetch(`${COUNTER_BASE}/get/${COUNTER_NS}/${COUNTER_KEY}`);
    if (!res.ok) throw new Error("counter GET " + res.status);
    const data = await res.json();
    if (typeof data.value === "number") showCount(data.value);
    else throw new Error("counter GET: no value");
  } catch (err) {
    // Never scare users with a "0": fall back to the last value we saw.
    const cached = Number(localStorage.getItem(LAST_VALUE));
    if (counterEl) counterEl.textContent = Number.isFinite(cached) && cached > 0
      ? cached.toLocaleString()
      : "—";
    console.warn("Download count unavailable:", err);
  }
}

// Increment the shared total the first time this computer downloads.
async function registerDownload() {
  let alreadyCounted = false;
  try { alreadyCounted = localStorage.getItem(COUNTED_FLAG) === "1"; } catch (_) {}
  if (alreadyCounted) return;
  // Optimistically mark this computer so rapid repeat clicks can't double-count.
  try { localStorage.setItem(COUNTED_FLAG, "1"); } catch (_) {}
  try {
    // keepalive lets the request finish even though clicking the download link
    // may start a navigation/download in the same instant — so the count is not
    // lost. This fires for Windows, macOS AND Linux clicks alike.
    const res = await fetch(`${COUNTER_BASE}/hit/${COUNTER_NS}/${COUNTER_KEY}`, { keepalive: true });
    if (!res.ok) throw new Error("counter HIT " + res.status);
    const data = await res.json();
    if (typeof data.value === "number") showCount(data.value);
  } catch (err) {
    // If the increment failed, allow a later retry rather than silently losing it.
    try { localStorage.removeItem(COUNTED_FLAG); } catch (_) {}
    console.warn("Download count not recorded:", err);
  }
}

// Direct download links (Windows, Linux, and the macOS .zip fallback) navigate
// to the release asset normally; we just record the download alongside it.
document.querySelectorAll("a.dl-btn").forEach((btn) => {
  btn.addEventListener("click", () => { registerDownload(); });
});

// macOS: the button downloads the .dmg directly. A small "Opening it on a Mac?"
// link reveals how to get past Gatekeeper (right-click → Open), plus a
// zero-warning Terminal install for anyone who prefers it.
const macToggle = document.getElementById("mac-note-toggle");
const macHelp = document.getElementById("mac-help");
if (macToggle && macHelp) {
  macToggle.addEventListener("click", () => {
    const willOpen = macHelp.hasAttribute("hidden");
    if (willOpen) macHelp.removeAttribute("hidden");
    else macHelp.setAttribute("hidden", "");
    macToggle.setAttribute("aria-expanded", String(willOpen));
    fitStage();
  });
}

const macCopy = document.getElementById("mac-copy");
const macCmd = document.getElementById("mac-cmd-text");
if (macCopy && macCmd) {
  macCopy.addEventListener("click", async () => {
    const text = macCmd.textContent.trim();
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const range = document.createRange();
      range.selectNodeContents(macCmd);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      try { document.execCommand("copy"); } catch (e) {}
      sel.removeAllRanges();
    }
    macCopy.textContent = "Copied!";
    macCopy.classList.add("copied");
    registerDownload();
    setTimeout(() => {
      macCopy.textContent = "Copy";
      macCopy.classList.remove("copied");
    }, 1800);
  });
}

loadDownloadCount();
