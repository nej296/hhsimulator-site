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
    const res = await fetch(`${COUNTER_BASE}/hit/${COUNTER_NS}/${COUNTER_KEY}`);
    if (!res.ok) throw new Error("counter HIT " + res.status);
    const data = await res.json();
    if (typeof data.value === "number") showCount(data.value);
  } catch (err) {
    // If the increment failed, allow a later retry rather than silently losing it.
    try { localStorage.removeItem(COUNTED_FLAG); } catch (_) {}
    console.warn("Download count not recorded:", err);
  }
}

document.querySelectorAll(".dl-btn").forEach((btn) => {
  // The link still navigates to the release asset normally; we just record the
  // download alongside it. Fire-and-forget so the download is never delayed.
  btn.addEventListener("click", () => { registerDownload(); });
});

loadDownloadCount();
