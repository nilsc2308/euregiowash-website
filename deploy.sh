#!/bin/bash
# Baut den Upload-Ordner und lädt ihn zu Netlify.
# Wichtig: CSS und JS bekommen eine Versionsnummer, sonst zeigen Browser
# tagelang die alte Fassung aus ihrem Zwischenspeicher.
set -e
cd "$(dirname "$0")"
export PATH="$HOME/.local/nodejs/bin:$PATH"

VERSION=$(date +%Y%m%d%H%M)
SITE=f108370e-aa81-454f-9530-e8d307f56888

echo "→ Upload-Ordner bauen (Version $VERSION)"
rm -rf dist && mkdir dist
cp index.html impressum.html datenschutz.html 404.html \
   robots.txt sitemap.xml site.webmanifest netlify.toml style.css script.js dist/
cp -R videos logo fonts dist/
find dist -name ".DS_Store" -delete
find dist -name "Bildschirmfoto*" -delete

# Versionsnummer an CSS und JS hängen
for f in dist/*.html; do
  sed -i '' "s|href=\"style.css\"|href=\"style.css?v=$VERSION\"|g; s|src=\"script.js\"|src=\"script.js?v=$VERSION\"|g" "$f"
done
echo "   $(find dist -type f | wc -l | tr -d ' ') Dateien, $(du -sh dist | awk '{print $1}')"

echo "→ Hochladen"
netlify deploy --prod --dir=dist --site=$SITE --no-build 2>&1 | grep -E "CDN requesting|Deploy is live|Production URL"
