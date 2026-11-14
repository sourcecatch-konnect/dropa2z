"""Package supplied brand icons at native platform sizes; no logo redesign."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = root.parent / 'design-imports-20261106/refined-icons/dropa2z-app-icons-refined'
for project, role, ios in [('Taxido_user', 'customer', 'TaxidoUserApp'), ('Taxido_driver', 'driver', 'TaxidoDriverUI')]:
    master = Image.open(source / (role + '-1024.png')).convert('RGB')
    res = root / project / 'android/app/src/main/res'
    drawable = res / 'drawable-nodpi'
    drawable.mkdir(exist_ok=True)
    master.save(drawable / 'dropa2z_refined_icon.png')
    color = '#%02X%02X%02X' % master.getpixel((0, 0))
    (res / 'values/dropa2z_refined_icon.xml').write_text(
        '<resources><color name="dropa2z_refined_icon_background">' + color + '</color></resources>\n', encoding='utf-8')
    # The artwork's central mark lies inside the adaptive icon safe zone.
    bitmap = '<?xml version="1.0" encoding="utf-8"?>\n<bitmap xmlns:android="http://schemas.android.com/apk/res/android" android:src="@drawable/dropa2z_refined_icon" android:gravity="fill" android:filter="true"/>\n'
    (res / 'mipmap-anydpi/dropa2z_launcher.xml').write_text(bitmap, encoding='utf-8')
    (res / 'mipmap-anydpi-v26/dropa2z_launcher.xml').write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/dropa2z_refined_icon_background"/><foreground android:drawable="@drawable/dropa2z_refined_foreground"/></adaptive-icon>\n', encoding='utf-8')
    (res / 'drawable/dropa2z_refined_foreground.xml').write_text(bitmap, encoding='utf-8')
    for density, size in [('mdpi', 48), ('hdpi', 72), ('xhdpi', 96), ('xxhdpi', 144), ('xxxhdpi', 192)]:
        target = res / ('mipmap-' + density)
        target.mkdir(exist_ok=True)
        master.resize((size, size), Image.Resampling.LANCZOS).save(target / 'dropa2z_launcher.png')
    iconset = root / project / 'ios' / ios / 'Images.xcassets/AppIcon.appiconset'
    contents = json.loads((iconset / 'Contents.json').read_text(encoding='utf-8'))
    for icon in contents['images']:
        if not icon.get('filename'):
            continue
        size = round(float(icon['size'].split('x')[0]) * float(icon['scale'].rstrip('x')))
        master.resize((size, size), Image.Resampling.LANCZOS).save(iconset / icon['filename'])
    print(project + ': Android adaptive/legacy and iOS icons packaged from ' + role + '-1024.png')
