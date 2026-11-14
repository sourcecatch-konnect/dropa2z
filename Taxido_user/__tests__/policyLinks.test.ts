import {publishedPolicyLinks, safeDocumentUrl} from '../src/design/policyLinks';
describe('Published policy documents', () => {
  it('keeps only published legal pages and the configured privacy policy', () => {
    const pages = [{id:1,title:'Terms & Conditions',slug:'terms',status:1},{id:2,title:'Draft refund policy',slug:'refund',status:0},{id:3,title:'About us',slug:'about',status:1},{id:4,title:'Privacy Policy',slug:'privacy',status:1}];
    expect(publishedPolicyLinks(pages,{rider_privacy_policy:'https://dropa2z.com/privacy'},'rider','https://dropa2z.com')).toEqual([{key:'privacy',title:'Privacy Policy',url:'https://dropa2z.com/privacy'},{key:'1',title:'Terms & Conditions',url:'https://dropa2z.com/page/terms'}]);
  });
  it('rejects insecure schemes, credentials, control characters and malformed URLs', () => {
    for (const url of ['javascript:alert(1)','http://dropa2z.com/page/terms','https://admin:pass@example.test','https://example.test/\nattack','file:///data/private']) expect(safeDocumentUrl(url)).toBeNull();
    expect(safeDocumentUrl('https://dropa2z.com/page/privacy-policy')).toBe('https://dropa2z.com/page/privacy-policy');
  });
  it('does not fabricate documents when none have been published', () => {
    expect(publishedPolicyLinks([],{},'rider','https://dropa2z.com')).toEqual([]);
  });
});
