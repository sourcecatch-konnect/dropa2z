import {DOCUMENT_MAX_BYTES, validateDocumentFile} from '../src/utils/documentUpload';

it('accepts supported PDF and camera-image files through 10 MB', () => {
  for (const type of ['application/pdf','image/jpeg','image/jpg','image/png']) {
    expect(() => validateDocumentFile({type,size:3*1024*1024})).not.toThrow();
    expect(() => validateDocumentFile({type,size:DOCUMENT_MAX_BYTES})).not.toThrow();
    expect(() => validateDocumentFile({type,fileSize:DOCUMENT_MAX_BYTES})).not.toThrow();
  }
});
it('rejects oversized documents using either picker or camera size metadata', () => {
  expect(() => validateDocumentFile({type:'application/pdf',size:DOCUMENT_MAX_BYTES+1})).toThrow('10 MB');
  expect(() => validateDocumentFile({type:'image/jpeg',fileSize:DOCUMENT_MAX_BYTES+1})).toThrow('10 MB');
});
it('keeps file-format restrictions and permits unknown size for backend validation', () => {
  expect(() => validateDocumentFile({type:'application/x-executable',size:1})).toThrow('JPG, PNG or PDF');
  expect(() => validateDocumentFile({type:'application/pdf',size:null})).not.toThrow();
  expect(() => validateDocumentFile({type:'application/pdf',size:NaN})).toThrow('10 MB');
});
