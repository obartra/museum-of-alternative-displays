"""Read every page of the built site the way a search engine does, without scripts, and say what is wrong.

    python3 scripts/crawl.py [dist]

It looks at what `scripts/static-pages.ts` wrote. For each page: the way back to the museum's folder, the
address the page gives as its own, a title no other page has, a sentence, the same place in the other languages
and whether those pages point back, the data for a search engine, one heading, and whether every link and
picture in the plain words leads somewhere. Then whether every page can be reached from the entrance of its
language by following links, and whether the sitemap lists the pages and nothing else.

It ends with an error if anything is wrong, so that the build stops.
"""
import json
import os
import re
import sys
from collections import defaultdict

dist = (sys.argv[1] if len(sys.argv) > 1 else 'dist').rstrip('/')


def one(rx, s):
    m = re.search(rx, s, re.S)
    return m.group(1) if m else None


pages = {}
for root, _, files in os.walk(dist):
    if 'index.html' in files:
        rel = os.path.relpath(root, dist).replace(os.sep, '/')
        pages['' if rel == '.' else rel + '/'] = open(os.path.join(root, 'index.html'), encoding='utf-8').read()

site = one(r'<link rel="canonical" href="([^"]+)"', pages[''])
# a language is a folder at the top that has an About page of its own
langs = sorted(p.split('/')[0] for p in pages if re.fullmatch(r'[a-z-]+/about/', p))
lang_of = lambda path: path.split('/')[0] if path.split('/')[0] in langs else ''
plain = lambda html: one(r'<main id="main" data-plain[^>]*>(.*?)</main>', html) or ''

wrong, titles = [], defaultdict(list)
for path, html in sorted(pages.items()):
    url = site + path
    if one(r'<base href="([^"]+)"', html) != ('../' * path.count('/') or './'):
        wrong.append(f'{path}: the base does not lead back to the museum')
    if one(r'<link rel="canonical" href="([^"]+)"', html) != url:
        wrong.append(f'{path}: the canonical address is not its own')
    lang = one(r'<html lang="([^"]+)"', html)
    titles[one(r'<title>([^<]*)</title>', html)].append(path)
    if not one(r'<meta name="description" content="([^"]+)"', html):
        wrong.append(f'{path}: no sentence in the head')
    alts = re.findall(r'<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"', html)
    if (lang, url) not in alts:
        wrong.append(f'{path}: no hreflang for itself ({lang})')
    for tag, to in alts:
        other = to[len(site):]
        if other not in pages:
            wrong.append(f'{path}: hreflang {tag} leads nowhere: {other}')
        elif tag != 'x-default':
            if one(r'<html lang="([^"]+)"', pages[other]) != tag:
                wrong.append(f'{path}: hreflang {tag} leads to a page in another language')
            if f'<link rel="alternate" hreflang="{lang}" href="{url}">' not in pages[other]:
                wrong.append(f'{path}: {other} does not point back')
    try:
        node = json.loads(one(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', html))['@graph'][1]
        if node['url'] != url or node['inLanguage'] != lang:
            wrong.append(f'{path}: its data names another page or language')
        for crumb in node.get('breadcrumb', {}).get('itemListElement', []):
            if crumb['item'][len(site):] not in pages:
                wrong.append(f'{path}: a breadcrumb leads nowhere: {crumb["item"]}')
        for picture in node.get('image', []):
            if not os.path.exists(os.path.join(dist, picture['contentUrl'][len(site):])):
                wrong.append(f'{path}: its data names a picture that is not there: {picture["contentUrl"]}')
    except (TypeError, ValueError, KeyError, IndexError) as e:
        wrong.append(f'{path}: its data cannot be read: {e}')
    body = plain(html)
    if body.count('<h1>') != 1:
        wrong.append(f'{path}: {body.count("<h1>")} main headings in the plain words')
    for href, tongue in re.findall(r'<a href="([^"]+)"( hreflang="[^"]+")?', body):
        if re.match(r'https?:', href):
            continue
        to = '' if href == './' else href
        if re.search(r'\.[a-z0-9]{2,5}$', to):
            if not os.path.exists(os.path.join(dist, to)):
                wrong.append(f'{path}: a link to a file that is not there: {href}')
        elif to not in pages:
            wrong.append(f'{path}: a link leads nowhere: {href}')
        elif lang_of(to) != lang_of(path) and not tongue:
            wrong.append(f'{path}: a link leaves the language: {href}')
    for src in re.findall(r'<img src="([^"]+)"', body):
        if not os.path.exists(os.path.join(dist, src)):
            wrong.append(f'{path}: a picture that is not there: {src}')

# every page is reached from the entrance of its language by links in the plain words
for lang in [''] + langs:
    top = lang + '/' if lang else ''
    seen, todo = {top}, [top]
    while todo:
        for href in re.findall(r'<a href="([^"]+)"', plain(pages[todo.pop()])):
            to = '' if href == './' else href
            if to in pages and to not in seen:
                seen.add(to)
                todo.append(to)
    lost = [p for p in pages if lang_of(p) == lang and p not in seen]
    if lost:
        wrong.append(f'{lang or "en"}: {len(lost)} pages no link leads to, such as {lost[0]}')

listed = {u[len(site):] for u in re.findall(r'<loc>([^<]+)</loc>', open(os.path.join(dist, 'sitemap.xml'), encoding='utf-8').read())}
if listed != set(pages):
    wrong.append(f'sitemap: {len(listed - set(pages))} addresses listed and not there, {len(set(pages) - listed)} pages not listed')
for title, where in titles.items():
    if len(where) > 1:
        wrong.append(f'the same title on {len(where)} pages: {title} ({where[0]}, {where[1]})')

print(f'{len(pages)} pages in {len(langs) + 1} languages, {len(wrong)} things wrong')
for line in wrong[:40]:
    print('  ' + line)
sys.exit(1 if wrong else 0)
