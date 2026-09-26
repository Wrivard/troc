import json, zipfile, pathlib
root=pathlib.Path('catalog-data')
revision=json.loads((root/'tcgdex-revision.json').read_text())['revision']
with zipfile.ZipFile(root/'raw'/('tcgdex-'+revision+'.zip')) as archive:
    entries={}
    for item in archive.infolist():
        path=pathlib.PurePosixPath(item.filename)
        relative=pathlib.PurePosixPath(*path.parts[1:])
        if '..' in path.parts or path.is_absolute(): raise ValueError('unsafe archive path')
        name=str(relative)
        if name in ['LICENSE','README.md'] or (name.startswith('data/') and name.endswith('.ts')):
            if item.file_size>2_000_000: raise ValueError('oversized entry')
            entries[name]=archive.read(item).decode('utf-8-sig')
(root/'raw'/'tcgdex-source.json').write_text(json.dumps(entries,ensure_ascii=False),encoding='utf-8')
(root/'TCGDEX-LICENSE.txt').write_text(entries['LICENSE'],encoding='utf-8')
print('Data-only archive entries:',len(entries))
print(next((v for k,v in entries.items() if k.startswith('data/Base/Base Set/') and k.endswith('/1.ts')), 'first card not found')[:2000])
