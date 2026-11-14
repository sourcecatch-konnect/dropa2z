import collections,json,pathlib,subprocess
import pymupdf
from PIL import Image,ImageDraw
import imageio_ffmpeg

source=pathlib.Path(r'C:\Users\mishr\Downloads\DROP A2Z 3in 1 logo.brand kit.pdf')
video=pathlib.Path(r'C:\Users\mishr\Downloads\DROP A2Z 3in 1 logo. vedio.mp4')
output=pathlib.Path(r'D:\DROPA2Z\brand-source-20261105')
output.mkdir(exist_ok=True)
doc=pymupdf.open(source)
pages=[];fonts=collections.Counter();colours=collections.Counter()
for index,page in enumerate(doc):
    text=page.get_text()
    pages.append({'page':index+1,'size':[page.rect.width,page.rect.height],'text':text})
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines',[]):
            for span in line.get('spans',[]):fonts[span['font']]+=len(span['text'])
    for draw in page.get_drawings():
        fill=draw.get('fill')
        if fill and len(fill)==3:colours['#'+''.join(f'{round(c*255):02X}' for c in fill)]+=1
    matrix=pymupdf.Matrix(1100/page.rect.width,1100/page.rect.width)
    page.get_pixmap(matrix=matrix,alpha=False).save(output/f'page-{index+1:02d}.png')
thumbs=[]
for p in sorted(output.glob('page-*.png')):
    image=Image.open(p).convert('RGB');image.thumbnail((440,320))
    tile=Image.new('RGB',(460,350),'#E9E9E9');tile.paste(image,((460-image.width)//2,25));ImageDraw.Draw(tile).text((12,7),p.stem,fill='black');thumbs.append(tile)
for start in range(0,len(thumbs),12):
    group=thumbs[start:start+12];sheet=Image.new('RGB',(460*3,350*((len(group)+2)//3)),'white')
    for i,tile in enumerate(group):sheet.paste(tile,((i%3)*460,(i//3)*350))
    sheet.save(output/f'contact-{start//12+1}.jpg')
metadata={'pages':pages,'fonts':fonts.most_common(),'vectorColours':colours.most_common(25)}
(output/'pdf-inspection.json').write_text(json.dumps(metadata,indent=2),encoding='utf8')
(output/'brand-text.txt').write_text('\n\n'.join(f"PAGE {p['page']}\n{p['text']}" for p in pages),encoding='utf8')
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
result=subprocess.run([ffmpeg,'-hide_banner','-i',str(video)],capture_output=True,text=True)
(output/'video-info.txt').write_text(result.stderr,encoding='utf8')
subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(video),'-vf','fps=2,scale=640:-1',str(output/'video-%03d.png')],check=True)
frames=sorted(output.glob('video-*.png')); tiles=[]
for p in frames:
    im=Image.open(p).convert('RGB');im.thumbnail((320,200));tile=Image.new('RGB',(330,225),'white');tile.paste(im,((330-im.width)//2,20));ImageDraw.Draw(tile).text((6,4),p.stem,fill='black');tiles.append(tile)
sheet=Image.new('RGB',(330*4,225*((len(tiles)+3)//4)),'#DDDDDD')
for i,tile in enumerate(tiles):sheet.paste(tile,((i%4)*330,(i//4)*225))
sheet.save(output/'video-contact.jpg')
print(json.dumps({'pageCount':len(doc),'fonts':fonts.most_common(12),'colours':colours.most_common(15),'ffmpeg':ffmpeg,'output':str(output)}))
