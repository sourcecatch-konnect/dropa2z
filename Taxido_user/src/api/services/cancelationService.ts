import {
   cancellationReason
  } from "../endpoints/cancelationEndPoint";
  import { GET_API } from "../methods";
  import { requireApiSuccess } from "../responseError";
  
  export const cancelationData = async () => {
    return requireApiSuccess(await GET_API(cancellationReason, { timeout: 10000 }),
      "Could not load cancellation reasons. You can enter your own reason.");
  };
  

  const cancelationServices = {
    cancelationData
  };
  
  export default cancelationServices;
  
