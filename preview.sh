#!/bin/sh
# Builds the preview variant (explicit index.html links) and the skeleton-less home page for the artifact preview
cd "$(dirname "$0")" && PREVIEW=1 node build.mjs && python3 - << 'PY'
import re
h=open('dist/index.html').read()
h=re.sub(r'<!doctype html>\s*<html lang="sk">\s*<head>\s*','',h)
h=h.replace('</head>\n<body class="page-home">','<script>document.documentElement.lang="sk";document.body.classList.add("page-home")</script>',1)
h=re.sub(r'</body>\s*</html>\s*$','',h)
h=re.sub(r'<title>.*?</title>','<title>CHOREA 2027</title>',h,1)
h=re.sub(r'<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*','',h,1)
open('dist/preview-home.html','w').write(h)
PY
