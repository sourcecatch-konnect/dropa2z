import {location} from "../endpoints/saveLocationEndPoint";
import {SaveLocationDataInterface} from "../interface/saveLocationinterface";
import {POST_API, PUT_API, DELETE_API, GET_API} from "../methods";

const requireSuccessfulResponse = (response: any, action: string) => {
  if (
    !response ||
    typeof response.status !== "number" ||
    response.status < 200 ||
    response.status >= 300
  ) {
    const error: any = new Error(
      response?.data?.message || response?.message || `Unable to ${action} saved location.`,
    );
    error.response = response;
    throw error;
  }

  return response;
};

export const addSaveLocation = async (data: SaveLocationDataInterface) => {
  return requireSuccessfulResponse(await POST_API(data, location), "save");
};

export const userSaveLocation = async () => {
  return requireSuccessfulResponse(await GET_API(location), "load");
};

export const updateSaveLocation = async ({
  data,
  locationID,
}: {
  data: SaveLocationDataInterface;
  locationID: number;
}) => {
  return requireSuccessfulResponse(
    await PUT_API(`location/${locationID}`, data),
    "update",
  );
};

export const deleteSaveLocation = async (addressID: number) => {
  return requireSuccessfulResponse(
    await DELETE_API(`location/${addressID}`),
    "delete",
  );
};

const saveLocationService = {
  addSaveLocation,
  userSaveLocation,
  updateSaveLocation,
  deleteSaveLocation,
};

export default saveLocationService;
