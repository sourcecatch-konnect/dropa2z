export const apiErrorMessage = (error: any, fallback = "Something went wrong. Please try again."): string => {
  const data = error?.response?.data ?? error?.data ?? error;
  const fieldErrors = data?.errors;
  if (fieldErrors && typeof fieldErrors === "object") {
    const first = Object.values(fieldErrors).flat().find(value => typeof value === "string");
    if (typeof first === "string") return first;
  }
  const message = typeof data === "string" ? data : data?.message ?? error?.message;
  return typeof message === "string" && message.trim() && !/[<>]/.test(message)
    ? message : fallback;
};

export const requireApiSuccess = (response: any, fallback: string) => {
  if (!response || typeof response.status !== "number" || response.status < 200 ||
      response.status >= 300 || response.data?.success === false) {
    throw new Error(apiErrorMessage(response, fallback));
  }
  return response;
};
