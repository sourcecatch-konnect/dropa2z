"""Export the supplied PDF artwork without its two page-background rectangles."""
import json
import pathlib
import re
import shutil
import pymupdf

SOURCE = pathlib.Path(r'C:\Users\mishr\Downloads\DropA2Z.updtaed logos option b.pdf')
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUTPUT = ROOT.parent / 'brand-source-20261110'
OUTPUT.mkdir(exist_ok=True)
document = pymupdf.open(SOURCE)
vehicle_frames = []

for index, page in enumerate(document):
    stream_id = page.get_contents()[0]
    content, count = re.subn(rb'0 0 1920 1080 re\s*f\b', b'0 0 1920 1080 re\nn', document.xref_stream(stream_id))
    if count != 2:
        raise RuntimeError('Unexpected PDF background; source left unchanged.')
    document.update_stream(stream_id, content)
    page = document.reload_page(page)
    image = page.get_images(full=True)[0]
    pixmap = pymupdf.Pixmap(document, image[0])
    if image[1]:
        pixmap = pymupdf.Pixmap(pixmap, pymupdf.Pixmap(document, image[1]))
    pixmap.save(OUTPUT / f'vehicle-{index}.png')
    bounds = page.get_image_info(xrefs=True)[0]['bbox']
    vehicle_frames.append([bounds[0]-108, bounds[1]-278, bounds[2]-bounds[0], bounds[3]-bounds[1]])
    for name, region in [(f'mark-{index}', (108, 278, 294, 525))] + ([('wordmark', (108,278,1378,525)), ('tail',(294,278,1378,525)), ('orange-text',(810,278,1378,525)), ('lockup',(108,278,1378,633))] if index==1 else []):
        page.get_pixmap(matrix=pymupdf.Matrix(2,2), alpha=True, clip=pymupdf.Rect(region)).save(OUTPUT / f'{name}-exact.png')

for app in ['Taxido_user', 'Taxido_driver']:
    target = ROOT / app / 'src/design/assets/brand-20261110'
    target.mkdir(parents=True, exist_ok=True)
    for file in [*OUTPUT.glob('vehicle-*.png'),*OUTPUT.glob('*-exact.png')]:
        shutil.copyfile(file, target / file.name)
    (target / 'vehicle-frames.json').write_text(json.dumps(vehicle_frames), encoding='utf8')
shutil.copyfile(OUTPUT / 'wordmark-exact.png', pathlib.Path(r'C:\Users\mishr\Downloads\Dropa2z-option-b-transparent.png'))
print(json.dumps({'pages': len(document), 'background_rectangles_removed_per_page': 2, 'output': str(OUTPUT), 'apps': 2}))
