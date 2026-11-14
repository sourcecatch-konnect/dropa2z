import {saveProfileUpdate} from '../src/api/services/profileUpdate';
import {POST_API} from '../src/api/methods';
jest.mock('../src/api/methods',()=>({POST_API:jest.fn()}));
const fields={username:'Test Customer',email:'test@example.com',countryCode:'91',phoneNumber:'9876543210'};
const originalFormData=global.FormData;
beforeAll(()=>{global.FormData=require('react-native/Libraries/Network/FormData').default;});
afterAll(()=>{global.FormData=originalFormData;});
beforeEach(()=>jest.clearAllMocks());
it('uploads the chosen local photo as multipart with a usable file name and MIME type',async()=>{
  (POST_API as jest.Mock).mockResolvedValue({status:200,data:{id:7}});
  await saveProfileUpdate(fields,{uri:'content://photos/selected/42'});
  const [body,endpoint,config]=(POST_API as jest.Mock).mock.calls[0];
  expect(endpoint).toBe('updateProfile');
  expect(config?.headers?.['Content-Type']).toBeUndefined();
  expect(body.getParts()).toEqual(expect.arrayContaining([
    expect.objectContaining({fieldName:'profile_image',uri:'content://photos/selected/42',name:'profile.jpg',type:'image/jpeg'}),
    expect.objectContaining({fieldName:'_method',string:'PUT'}),
  ]));
});
it('removes a photo without re-uploading the selected file',async()=>{
  (POST_API as jest.Mock).mockResolvedValue({status:200,data:{id:7}});
  await saveProfileUpdate(fields,{uri:'file:///selected.jpg'},true);
  const parts=(POST_API as jest.Mock).mock.calls[0][0].getParts();
  expect(parts).toEqual(expect.arrayContaining([expect.objectContaining({fieldName:'profile_image_id',string:''})]));
  expect(parts.some((p:any)=>p.fieldName==='profile_image')).toBe(false);
});
it('rejects a failed upload instead of treating it as saved',async()=>{
  (POST_API as jest.Mock).mockResolvedValue({status:422,data:{errors:{profile_image:['The image could not be uploaded.']}}});
  await expect(saveProfileUpdate(fields,{uri:'file:///selected.jpg'})).rejects.toThrow('The image could not be uploaded.');
});
