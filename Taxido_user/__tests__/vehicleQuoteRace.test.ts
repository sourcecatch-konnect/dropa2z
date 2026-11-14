jest.mock('immer',()=>jest.requireActual('../node_modules/immer/dist/cjs/index.js'));
import reducer from '../src/api/store/reducers/vehicleTypeReducer';
import {vehicleTypeDataGet} from '../src/api/store/actions/vehicleTypeAction';
jest.mock('../src/api/services/index',()=>({vehicleTypeService:{}}));
jest.mock('../src/api/store/actions/finddriverAction',()=>({vehicleTypeDataGetAction:require('@reduxjs/toolkit').createAsyncThunk('quote/legacy',async()=>[])}));
it('does not replace a newer weight quote with an older response or error',()=>{
 const args:any={locations:['a','b'],service_id:1,service_category_id:2};
 let state:any=reducer(undefined,{type:'init'});
 state=reducer(state,vehicleTypeDataGet.pending('old',args));
 state=reducer(state,vehicleTypeDataGet.pending('new',args));
 state=reducer(state,vehicleTypeDataGet.fulfilled([{id:2,name:'Auto',status:1}] as any,'new',args));
 state=reducer(state,vehicleTypeDataGet.fulfilled([{id:1,name:'Bike',status:1}] as any,'old',args));
 state=reducer(state,vehicleTypeDataGet.rejected(Error('old timeout'),'old',args));
 expect(state.vehicleTypedata[0].id).toBe(2);expect(state.loading).toBe(false);
});
