import {documentUpdates, existingDocument, localDocumentDate} from '../src/screen/settings/documentDetail/documentState';
const document = {id: 9, slug: 'license', name: 'Driving licence', type: 'driver', need_expired_date: 1};
const stored = [{document_id: 9, document_image_url: 'https://example.test/licence.pdf', expired_at: '2028-01-01T00:00:00.000000Z', status: 'approved'}];
describe('Document edits', () => {
  it('submits an expiry-only update without trying to re-upload a remote file', () => {
    expect(documentUpdates([document], stored, {license: {expiry:'2029-01-01'}}, '2026-11-03')).toEqual([{slug:'license',file:undefined,expired_at:'2029-01-01'}]);
  });
  it('keeps the previous expiry when replacing an approved file', () => {
    const file = {uri:'content://provider/new', name:'licence.pdf', type:'application/pdf', size:1024};
    expect(documentUpdates([document], stored, {license:{file}}, '2026-11-03')[0]).toEqual({slug:'license',file,expired_at:'2028-01-01'});
  });
  it('rejects a missing or expired required expiry and oversized or unsupported files', () => {
    const file = {uri:'content://provider/new',name:'licence.pdf',type:'application/pdf',size:1024};
    expect(() => documentUpdates([document], [], {license:{file}}, '2026-11-03')).toThrow('expiry');
    expect(() => documentUpdates([document], stored, {license:{expiry:'2020-01-01'}}, '2026-11-03')).toThrow('expiry');
    expect(() => documentUpdates([document], stored, {license:{file:{...file,size:10*1024*1024+1}}}, '2026-11-03')).toThrow('10 MB');
    expect(() => documentUpdates([document], stored, {license:{file:{...file,type:'text/html'}}}, '2026-11-03')).toThrow('JPG, PNG or PDF');
  });
  it('accepts a replacement above the old 2 MB limit and at the new 10 MB boundary', () => {
    for (const size of [3*1024*1024, 10*1024*1024]) {
      const file = {uri:'content://provider/new',name:'licence.pdf',type:'application/pdf',size};
      expect(documentUpdates([document], stored, {license:{file}}, '2026-11-03')[0].file).toEqual(file);
    }
  });
  it('matches numeric and serialized document IDs and emits local calendar dates', () => {
    expect(existingDocument([{document_id:'9'}],document)).toEqual({document_id:'9'});
    expect(localDocumentDate(new Date(2026,10,3,0,0))).toBe('2026-11-03');
    expect(documentUpdates([document],stored,{},'2026-11-03')).toEqual([]);
  });
});
