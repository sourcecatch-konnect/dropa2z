import { getLaunchedServices } from "../src/utils/activeServices";

describe("getLaunchedServices", () => {
  it("surfaces enabled goods services and excludes passenger services", () => {
    const services = [
      { id: 6, type: "cab" },
      { id: 7, type: "parcel" },
      { id: 8, type: "freight" },
    ];

    expect(getLaunchedServices(services)).toEqual([
      { id: 7, type: "parcel" },
    ]);
    expect(getLaunchedServices([{ id: 7, type: 'parcel', status: 0 }])).toEqual([]);
  });

  it("returns nothing when the server data is unavailable", () => {
    expect(getLaunchedServices(undefined)).toEqual([]);
  });
});
