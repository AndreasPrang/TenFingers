# Icons für TenFingers

## Benötigte Dateien

Die folgenden Icon-Dateien werden referenziert:
- `favicon.svg` ✓ (vorhanden - SVG mit Tastatur-Emoji)
- `favicon.ico` (optional - Fallback für ältere Browser)
- `logo192.png` (optional - für PWA und Apple Touch)
- `logo512.png` (optional - für PWA)

## SVG Favicon

Das SVG-Favicon ist bereits vorhanden und funktioniert in allen modernen Browsern.

## PNG/ICO Logos generieren (optional)

Falls du PNG-Logos erstellen möchtest, kannst du:

### Option 1: Online-Konverter
1. Besuche: https://realfavicongenerator.net/
2. Lade `favicon.svg` hoch
3. Generiere alle benötigten Größen
4. Lade die generierten Dateien herunter und ersetze sie hier

### Option 2: ImageMagick (lokal)
```bash
cd frontend/public

# favicon.ico erstellen (16x16, 32x32, 48x48)
convert favicon.svg -resize 48x48 -define icon:auto-resize=48,32,16 favicon.ico

# logo192.png erstellen
convert favicon.svg -resize 192x192 logo192.png

# logo512.png erstellen
convert favicon.svg -resize 512x512 logo512.png
```

### Option 3: Nur SVG verwenden
Das SVG-Favicon funktioniert bereits perfekt in allen modernen Browsern. Die PNG/ICO-Dateien sind optional und nur für:
- Ältere Browser (< 2020)
- Progressive Web App Installation
- Apple Touch Icon

**Empfehlung:** Für ein produktives System ist das SVG-Favicon ausreichend. Die PNG-Dateien sind optional.
