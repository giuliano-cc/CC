#!/bin/sh
# Genera Duplicati.app (e Duplicati.zip) a partire da duplicati.py
set -e
cd "$(dirname "$0")"
APP=Duplicati.app
rm -rf "$APP" Duplicati.zip
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp duplicati.py "$APP/Contents/Resources/duplicati.py"
[ -f icon.icns ] && cp icon.icns "$APP/Contents/Resources/icon.icns"
cat > "$APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleName</key><string>Duplicati</string>
<key>CFBundleDisplayName</key><string>Duplicati</string>
<key>CFBundleIdentifier</key><string>local.duplicati</string>
<key>CFBundleIconFile</key><string>icon</string>
<key>CFBundleExecutable</key><string>launcher</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleVersion</key><string>1.0</string>
<key>LSMinimumSystemVersion</key><string>10.13</string>
<key>NSHighResolutionCapable</key><true/>
</dict></plist>
PLIST
cat > "$APP/Contents/MacOS/launcher" <<'SH'
#!/bin/sh
DIR="$(cd "$(dirname "$0")/../Resources" && pwd)"
if ! /usr/bin/python3 --version >/dev/null 2>&1; then
  osascript -e 'display dialog "Serve Python 3. Apri il Terminale ed esegui: xcode-select --install, poi riapri Duplicati." buttons {"OK"} with icon caution'
  exit 1
fi
pkill -f "Resources/duplicati.py" 2>/dev/null && sleep 0.5  # chiude una vecchia istanza: parte sempre questa versione
exec /usr/bin/python3 "$DIR/duplicati.py"
SH
chmod +x "$APP/Contents/MacOS/launcher"
zip -qr Duplicati.zip "$APP"
echo "Creato $APP e Duplicati.zip"
