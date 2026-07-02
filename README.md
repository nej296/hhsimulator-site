# Hodgkin-Huxley Simulator — Website

The marketing and download site for the **Hodgkin-Huxley Simulator**, an
interactive desktop application for exploring single-compartment
Hodgkin-Huxley membrane dynamics. Live at **[hhsimulator.com](https://hhsimulator.com)**.

This repository contains the landing page and hosts the Windows installer as a
GitHub Release.

---

## About the app

The Hodgkin-Huxley Simulator lets you inject current into a model neuron and
watch action potentials emerge in real time, using a fourth-order Runge-Kutta
integration of the classic 1952 Hodgkin-Huxley equations. It visualizes:

- **Membrane potential** (voltage trace)
- **Injected current** (step and multi-pulse protocols)
- **Net ionic current** (Na⁺ + K⁺ + leak)
- **Sodium and potassium conductances**
- **Gating variables** (m, h, n channel probabilities)

Every parameter — conductances, reversal potentials, capacitance, and stimulus
timing — is adjustable, and the full time series can be exported to CSV.

> The application source lives in the companion repository:
> [nej296/Hodgkin-Huxley-Simulator](https://github.com/nej296/Hodgkin-Huxley-Simulator).

---

## Download

Grab the latest Windows installer from the
**[Releases page](https://github.com/nej296/hhsimulator-site/releases/latest)**,
or directly:

**[⬇ HH-Simulator-Setup.exe](https://github.com/nej296/hhsimulator-site/releases/latest/download/HH-Simulator-Setup.exe)**

- **Platform:** Windows 10 / 11 (64-bit)
- **Size:** ~29 MB
- **Requirements:** none — Python and all libraries are bundled

### Installation

1. Download `HH-Simulator-Setup.exe`.
2. Run it. Windows SmartScreen may warn that the app is unrecognized because the
   installer isn't code-signed — click **More info → Run anyway**.
3. The simulator installs per-user (no administrator prompt) with a Start Menu
   shortcut and an entry in *Add or remove programs*.

---

## The website

A dependency-free static site — plain HTML, CSS, and vanilla JavaScript — so it
deploys instantly with no build step.

```
index.html      # Landing page markup
styles.css      # Styling and layout
script.js       # Scroll reveals + live download counter
assets/         # Simulation imagery, app screenshot, favicon
downloads/      # Local copy of the installer (git-ignored; shipped via Releases)
```

### Live download counter

The download count shown on the page is fetched client-side from the GitHub
Releases API and reflects the real number of installer downloads across all
releases of this repository. No backend or analytics service is required.

### Local preview

```bash
python -m http.server 8099
# then open http://localhost:8099
```

### Deployment

The site is deployed on [Vercel](https://vercel.com) and served at
`hhsimulator.com`. Because it's a static site, Vercel needs no build
configuration — every push to `main` redeploys automatically.

---

## License

© Nicholas Johnson — George Mason University.
Contact: [njohns59@gmu.edu](mailto:njohns59@gmu.edu)
