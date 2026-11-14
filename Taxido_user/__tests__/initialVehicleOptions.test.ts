import { getInitialVehicleOptions } from "../src/utils/initialVehicleOptions";

describe("getInitialVehicleOptions", () => {
  it("keeps every offering the server returns as enabled", () => {
    const vehicles = [
      { id: 14, name: "Auto Rickshaw", status: 1 },
      { id: 15, slug: "bike", status: true },
      { id: 16, name: "Bike", status: 0 },
    ];

    expect(getInitialVehicleOptions(vehicles)).toEqual([
      { id: 14, name: "Auto Rickshaw", status: 1 },
      { id: 15, slug: "bike", status: true },
    ]);
  });

  it("does not invent offerings the server did not send", () => {
    expect(getInitialVehicleOptions([])).toEqual([]);
  });

  it("returns no options when the server data is unavailable", () => {
    expect(getInitialVehicleOptions(undefined)).toEqual([]);
  });
});
