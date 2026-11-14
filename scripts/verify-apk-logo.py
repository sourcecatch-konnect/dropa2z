"""Read-only PNG verification after Android resource-name shortening/crunching."""
import hashlib
import io
import sys
import zipfile
from PIL import Image

source = Image.open(sys.argv[2]).convert('RGBA')
expected = hashlib.sha256(source.tobytes()).digest()
with zipfile.ZipFile(sys.argv[1]) as archive:
    for item in archive.infolist():
        if not item.filename.endswith(('.png', '.webp')):
            continue
        with Image.open(io.BytesIO(archive.read(item))) as image:
            if image.size == source.size and hashlib.sha256(image.convert('RGBA').tobytes()).digest() == expected:
                print('Verified exact transparent logo pixels: ' + item.filename)
                sys.exit(0)
raise SystemExit('The current transparent logo pixels were not found in the APK.')
