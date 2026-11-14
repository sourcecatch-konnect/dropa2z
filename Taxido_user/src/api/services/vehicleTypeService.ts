import { vehicleType,allvehicle } from '../endpoints/vehicleTypeEndPoint';
import { VehicleQuoteRequest } from '../interface/vehicleTypeInterface';
import { POST_API, GET_API } from '../methods';

export const vehicleTypes = async (data: VehicleQuoteRequest) => {
  const response = await POST_API(data, vehicleType, { timeout: 15000 });
  if (
    !response ||
    response instanceof Error ||
    typeof response.status !== "number" ||
    response.status < 200 ||
    response.status >= 300
  ) {
    throw new Error(
      response?.data?.message ||
        response?.message ||
        "Could not calculate vehicles for this route.",
    );
  }
  return response;
};

export const allVehicleData = async () => {
  return GET_API(allvehicle)
    .then((res) => {
      return res.data;
    })
    .catch((e) => {
      return e?.response;
    });
};


const vehicleTypeServices = {
  vehicleTypes,
  allVehicleData
};

export default vehicleTypeServices;
