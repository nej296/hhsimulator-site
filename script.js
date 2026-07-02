// ---- Footer year ----
document.getElementById("year").textContent = new Date().getFullYear();

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

// ---- Live download counter (GitHub Releases API) ----
const REPO = "nej296/hhsimulator-site";
const ASSET_MATCH = /HH-Simulator-Setup\.exe$/i;
const targets = [
  document.getElementById("counter-num"),
  document.getElementById("counter-num-2"),
];

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

async function loadDownloadCount() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) throw new Error("GitHub API " + res.status);
    const releases = await res.json();
    let total = 0;
    for (const rel of releases) {
      for (const asset of rel.assets || []) {
        if (ASSET_MATCH.test(asset.name)) total += asset.download_count || 0;
      }
    }
    targets.forEach((el) => animateTo(el, total));
  } catch (err) {
    // Graceful fallback: keep the layout intact if the API is unavailable.
    targets.forEach((el) => {
      if (el) el.textContent = "0";
    });
    console.warn("Download count unavailable:", err);
  }
}

loadDownloadCount();
