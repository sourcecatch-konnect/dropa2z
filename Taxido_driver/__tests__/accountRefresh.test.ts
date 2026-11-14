import {configureStore} from '@reduxjs/toolkit';
import reducer from '../src/api/store/reducers/accountReducer';
import {selfDriverData,selfFleetData} from '../src/api/store/action/accountAction';
import {accountServices} from '../src/api/services';
jest.mock('immer',()=>jest.requireActual('../node_modules/immer/dist/cjs/index.js'));
jest.mock('../src/api/services',()=>({accountServices:{selfDriverData:jest.fn(),selfFleetData:jest.fn()}}));
const makeStore=()=>configureStore({reducer:{account:reducer},preloadedState:{account:{...reducer(undefined,{type:'init'}),selfDriver:{id:51,role:'driver',name:'Existing Driver',is_online:0}}} as any});
beforeEach(()=>jest.clearAllMocks());
it('preserves the authenticated profile when a refresh returns an API error',async()=>{
 (accountServices.selfDriverData as jest.Mock).mockResolvedValue({status:401,data:{message:'Not authorized'}});
 const store=makeStore();await expect(store.dispatch(selfDriverData()).unwrap()).rejects.toMatchObject({message:'Not authorized'});
 expect(store.getState().account.selfDriver).toMatchObject({id:51,role:'driver',name:'Existing Driver'});
});
it('unwraps a successful nested profile and updates current availability',async()=>{
 (accountServices.selfDriverData as jest.Mock).mockResolvedValue({status:200,data:{data:{id:51,role:'driver',is_online:1}}});
 const store=makeStore();await store.dispatch(selfDriverData()).unwrap();
 expect(store.getState().account.selfDriver).toMatchObject({id:51,role:'driver',is_online:1});
});
it('rejects an incomplete fleet response instead of changing Driver tabs to Fleet',async()=>{
 (accountServices.selfFleetData as jest.Mock).mockResolvedValue({status:200,data:{success:false,message:'Profile unavailable'}});
 const store=makeStore();await expect(store.dispatch(selfFleetData()).unwrap()).rejects.toMatchObject({message:'Profile unavailable'});
 expect(store.getState().account.selfDriver?.role).toBe('driver');
});
