import { zone } from "../endpoints/zoneEndPoint";
import { ZoneInterface } from "../interface/zoneInterface";
import { GET_API } from "../methods";

export const userZone = async (lat: number, lng: number) => {
  const endpointWithParams = `${zone}?lat=${lat}&lng=${lng}`;
  const response = await GET_API(endpointWithParams, { timeout: 15000 });
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
        "Could not load the service area.",
    );
  }
  return response;
  };
  

  const zoneServices = {
    userZone,
  };
  
  export default zoneServices;
