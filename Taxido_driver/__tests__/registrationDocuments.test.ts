import {documentItems,registrationDocumentWarnings} from '../src/utils/registrationDocuments';
import {documentType} from '../src/api/services/documentService';
import {GET_API} from '../src/api/methods';
jest.mock('../src/api/methods',()=>({GET_API:jest.fn()}));
const licence={id:1,slug:'driving-licence',name:'Driving Licence',type:'driver',is_required:1,need_expired_date:1};
beforeEach(()=>jest.clearAllMocks());
it('loads the active Driver and Vehicle requirements without losing the licence',async()=>{
  (GET_API as jest.Mock).mockImplementation(async(url:string)=>({status:200,data:{data:url.includes('type=driver')?[licence]:[]}}));
  expect((await documentType({type:'driver'})).data.data).toEqual([licence]);
  expect(GET_API).toHaveBeenCalledWith('document?type=driver&status=1&paginate=100');
  expect(GET_API).toHaveBeenCalledWith('document?type=vehicle&status=1&paginate=100');
});
it('distinguishes an empty Admin configuration from malformed or failed responses',async()=>{
  expect(documentItems({data:[]})).toEqual([]);
  expect(()=>documentItems({message:'Failed'})).toThrow('Could not load');
  (GET_API as jest.Mock).mockResolvedValue({status:500,data:{message:'Unavailable'}});
  await expect(documentType({type:'driver'})).rejects.toThrow('Unavailable');
});
it('requires the configured licence and its expiry, while respecting optional documents',()=>{
  expect(registrationDocumentWarnings([licence],{},{})).toEqual({'driving-licence':true});
  expect(registrationDocumentWarnings([licence],{'driving-licence':{uri:'file:///licence.jpg'}},{})).toEqual({'driving-licence':true});
  expect(registrationDocumentWarnings([licence],{'driving-licence':{uri:'file:///licence.jpg'}},{'driving-licence':'2030-01-01'})).toEqual({});
  expect(registrationDocumentWarnings([{...licence,is_required:0}],{},{})).toEqual({});
});
