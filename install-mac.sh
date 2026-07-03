#!/bin/bash
# One-step macOS installer for the Hodgkin-Huxley Simulator.
#
# Run in Terminal:
#   curl -fsSL https://hhsimulator.com/install-mac.sh | bash
#
# Because this downloads the app with curl (not a browser), macOS does not
# quarantine it, so the app launches with no Gatekeeper warning. We also strip
# any quarantine flag and ad-hoc sign the bundle as a belt-and-suspenders.
#
# The app is an Intel (x86_64) build: it runs natively on Intel Macs and on
# Apple Silicon via Rosetta 2 (installed automatically on first run if needed).
set -euo pipefail

APP_NAME="HH-Simulator.app"
DMG_URL="https://github.com/nej296/Hodgkin-Huxley-Simulator/releases/latest/download/HH-Simulator-macOS.dmg"

echo "==> Downloading HH Simulator for macOS..."
TMP="$(mktemp -d)"
MNT="$TMP/mnt"
mkdir -p "$MNT"
cleanup() { hdiutil detach "$MNT" -quiet 2>/dev/null || true; rm -rf "$TMP"; }
trap cleanup EXIT
curl -fsSL "$DMG_URL" -o "$TMP/hh.dmg"

echo "==> Mounting..."
hdiutil attach "$TMP/hh.dmg" -nobrowse -quiet -mountpoint "$MNT"
APP_SRC="$MNT/$APP_NAME"
if [ ! -d "$APP_SRC" ]; then
  echo "Error: could not find $APP_NAME in the download." >&2
  exit 1
fi

# Prefer /Applications; fall back to ~/Applications if it isn't writable.
DEST="/Applications"
if [ ! -w "$DEST" ]; then
  DEST="$HOME/Applications"
  mkdir -p "$DEST"
fi

echo "==> Installing to $DEST ..."
rm -rf "$DEST/$APP_NAME"
/bin/cp -R "$APP_SRC" "$DEST/"
hdiutil detach "$MNT" -quiet 2>/dev/null || true

# Remove quarantine and ad-hoc sign so Gatekeeper and the runtime are satisfied.
/usr/bin/xattr -dr com.apple.quarantine "$DEST/$APP_NAME" 2>/dev/null || true
/usr/bin/codesign --force --deep --sign - "$DEST/$APP_NAME" 2>/dev/null || true

echo "==> Done. Launching HH Simulator..."
open "$DEST/$APP_NAME" || true
echo "Installed to $DEST/$APP_NAME"
