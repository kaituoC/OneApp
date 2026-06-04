#!/bin/bash
set -euo pipefail

# Create a styled DMG with HFS+ filesystem, custom background, and icon layout.
# Usage: ./scripts/create-dmg.sh <app-path> <output-dmg-path>
# Example: ./scripts/create-dmg.sh dist/mac-arm64/OneApp.app dist/OneApp-1.4.4-mac-arm64.dmg

APP_PATH="$1"
DMG_PATH="$2"

APP_NAME=$(basename "$APP_PATH" .app)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BG_IMG="$PROJECT_DIR/build/background.png"
BG_IMG_2X="$PROJECT_DIR/build/background@2x.png"
VOL_NAME="$APP_NAME $(node -p "require('$PROJECT_DIR/package.json').version")"

STAGING=$(mktemp -d)
DMG_RW=$(mktemp).dmg

cleanup() { rm -rf "$STAGING" "$DMG_RW" 2>/dev/null; }
trap cleanup EXIT

# Stage contents
cp -R "$APP_PATH" "$STAGING/"
ln -s /Applications "$STAGING/Applications"
mkdir -p "$STAGING/.background"

# Combine 1x + 2x into retina TIFF if both exist, otherwise use PNG
if [ -f "$BG_IMG_2X" ] && command -v tiffutil &>/dev/null; then
    tiffutil -cathidpicheck "$BG_IMG" "$BG_IMG_2X" -out "$STAGING/.background/bg.tiff"
    BG_FILE="bg.tiff"
else
    cp "$BG_IMG" "$STAGING/.background/bg.png"
    BG_FILE="bg.png"
fi

# Calculate DMG size (app size + 20MB buffer)
APP_SIZE_KB=$(du -sk "$APP_PATH" | awk '{print $1}')
DMG_SIZE_KB=$((APP_SIZE_KB + 20480))

# Create read-write HFS+ DMG
hdiutil create -size "${DMG_SIZE_KB}k" -fs HFS+ -volname "$VOL_NAME" "$DMG_RW" -ov -quiet

# Mount
MOUNT_DIR="/Volumes/$VOL_NAME"
hdiutil attach "$DMG_RW" -mountpoint "$MOUNT_DIR" -noverify -noautoopen -quiet

# Copy contents
cp -R "$STAGING/." "$MOUNT_DIR/"

# Configure Finder view with AppleScript
osascript <<APPLESCRIPT
tell application "Finder"
    tell disk "$VOL_NAME"
        open
        set current view of container window to icon view
        set toolbar visible of container window to false
        set statusbar visible of container window to false
        set sidebar width of container window to 0
        set bounds of container window to {100, 100, 760, 500}
        set opts to icon view options of container window
        set icon size of opts to 80
        set text size of opts to 12
        set arrangement of opts to not arranged
        set background picture of opts to file ".background:${BG_FILE}"
        set position of item "$APP_NAME.app" of container window to {180, 170}
        set position of item "Applications" of container window to {480, 170}
        close
        open
        update without registering applications
        delay 1
        close
    end tell
end tell
APPLESCRIPT

# Ensure .DS_Store is flushed
sync

# Unmount
hdiutil detach "$MOUNT_DIR" -quiet || hdiutil detach "$MOUNT_DIR" -force
sleep 1

# Convert to compressed read-only
rm -f "$DMG_PATH"
hdiutil convert "$DMG_RW" -format UDZO -imagekey zlib-level=9 -o "$DMG_PATH" -quiet

echo "✅ Created: $DMG_PATH"
