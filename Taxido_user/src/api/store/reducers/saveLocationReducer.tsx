import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  addSaveLocation,
  deleteSaveLocation,
  updateSaveLocation,
  userSaveLocation,
} from "../actions/saveLocationAction";
import { SaveLocationInterface } from "../../interface/saveLocationinterface";

const initialState: SaveLocationInterface = {
  saveLocationData: [],
  saveLocationDataUpdate: [],
  saveLocationDataGet: [],
  loading: false,
  success: false,
  statusCode: null,
};

const saveLocationSlice = createSlice({
  name: "saveLocation",
  initialState,
  reducers: {},
  extraReducers: (builder: any) => {
    //add location
    builder.addCase(addSaveLocation.pending, (state: any) => {
      state.loading = true;
    });

    builder.addCase(
      addSaveLocation.fulfilled,
      (state: any, action: any) => {
        state.loading = false;
        state.saveLocationData = action.payload.data;
        state.statusCode = action.payload.status;
        state.success = true;
        const item = { ...action.meta.arg, ...action.payload };
        if (item.id) {
          const list = state.saveLocationDataGet?.data || [];
          state.saveLocationDataGet = { ...state.saveLocationDataGet, data: [item, ...list.filter((saved: any) => String(saved.id) !== String(item.id))] };
        }
      }
    );
    builder.addCase(addSaveLocation.rejected, (state: any, action: any) => {
      state.loading = false;
      state.success = false;
      state.statusCode = action.payload?.status || 500;
    });

    //delete location
    builder.addCase(deleteSaveLocation.pending, (state: any) => {
      state.loading = true;
    });
    builder.addCase(
      deleteSaveLocation.fulfilled,
      (state: any, action: any) => {
        state.loading = false;
        state.success = true;
        if (state.saveLocationDataGet?.data) {
          state.saveLocationDataGet.data = state.saveLocationDataGet.data.filter((item: any) => String(item.id) !== String(action.meta.arg));
        }
      }
    );
    builder.addCase(deleteSaveLocation.rejected, (state: any) => {
      state.loading = false;
      state.success = false;
    });

    //edit location
    builder.addCase(updateSaveLocation.pending, (state: any) => {
      state.loading = true;
    });
    builder.addCase(
      updateSaveLocation.fulfilled,
      (state: any, action: any) => {
        state.loading = false;
        state.success = true;
        const { locationID, data } = action.meta.arg;
        if (state.saveLocationDataGet?.data) {
          state.saveLocationDataGet.data = state.saveLocationDataGet.data.map((item: any) =>
            String(item.id) === String(locationID) ? { ...item, ...data } : item);
        }
      }
    );
    builder.addCase(updateSaveLocation.rejected, (state: any) => {
      state.loading = false;
      state.success = false;
    });

    //get location
    builder.addCase(userSaveLocation.pending, (state: any) => {
      state.loading = true;
    });
    builder.addCase(
      userSaveLocation.fulfilled,
      (state: any, action: PayloadAction<any[]>) => {
        state.loading = false;
        state.saveLocationDataGet = action.payload;
        state.success = true;
      }
    );
    builder.addCase(userSaveLocation.rejected, (state: any) => {
      state.loading = false;
      state.success = false;
    });
  },
});

export default saveLocationSlice.reducer;
