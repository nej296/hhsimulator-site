#!/bin/bash
# One-step macOS installer for the Hodgkin-Huxley Simulator.
#
# Run in Terminal:
#   curl -fsSL https://hhsimulator.com/install-mac.sh | bash
#
# Because this downloads the app with curl (not a browser), macOS does not
# quarantine it, so the app launches with no Gatekeeper warning. We also strip
# any quarantine flag and ad-hoc sign the bundle as a belt-and-suspenders so it
# runs on both Intel and Apple Silicon Macs.
set -euo pipefail

APP_NAME="HH-Simulator.app"
ZIP_URL="https://github.com/nej296/Hodgkin-Huxley-Simulator/releases/latest/download/HH-Simulator-macOS.zip"

echo "==> Downloading HH Simulator for macOS..."
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
curl -fsSL "$ZIP_URL" -o "$TMP/hh.zip"

echo "==> Unpacking..."
/usr/bin/ditto -x -k "$TMP/hh.zip" "$TMP/extracted"
APP_SRC="$(/usr/bin/find "$TMP/extracted" -maxdepth 2 -name "$APP_NAME" -print -quit)"
if [ -z "${APP_SRC:-}" ]; then
  echo "Error: could not find $APP_NAME in the download." >&2
  exit 1
fi

# Remove quarantine (in case anything set it) and ad-hoc sign so Gatekeeper
# and the Apple Silicon runtime are both satisfied for an unsigned build.
/usr/bin/xattr -dr com.apple.quarantine "$APP_SRC" 2>/dev/null || true
/usr/bin/codesign --force --deep --sign - "$APP_SRC" 2>/dev/null || true

# Prefer /Applications; fall back to ~/Applications if it isn't writable.
DEST="/Applications"
if [ ! -w "$DEST" ]; then
  DEST="$HOME/Applications"
  mkdir -p "$DEST"
fi

echo "==> Installing to $DEST ..."
rm -rf "$DEST/$APP_NAME"
/bin/cp -R "$APP_SRC" "$DEST/"

echo "==> Done. Launching HH Simulator..."
open "$DEST/$APP_NAME" || true
echo "Installed to $DEST/$APP_NAME"
