import React from "react";
import renderer, { act } from "react-test-renderer";
import { TextInput, ScrollView, Alert } from "react-native";
import { BookingReview } from "../src/screens/bookRide/component/BookingReview";
import { validGstin, reviewFare } from "../src/utils/bookingReview";
jest.mock("../src/utils/context", () => ({
  useValues: () => ({ isDark: false }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 24, left: 0, right: 0 }),
}));
let tree: renderer.ReactTestRenderer;
const confirm = jest.fn(),
  close = jest.fn(),
  apply = jest.fn(async () => {});
const props = {
  visible: true,
  vehicle: {
    id: 3,
    name: "Auto",
    currency_symbol: "₹",
    charges: {
      total: 198.78,
      base_fare_charge: 50,
      goods_included_minutes: 10,
    },
  },
  locations: ["Pickup Jalgaon", "Middle stop Jalgaon", "Drop Jalgaon"],
  coupon: null,
  couponCode: "",
  couponEnabled: true,
  couponLoading: false,
  couponMessage: "",
  finalPrice: 198.78,
  payment: "cash",
  busy: false,
  onClose: close,
  onApplyCoupon: apply,
  onRemoveCoupon: jest.fn(),
  onConfirm: confirm,
};
const button = (label: string) =>
  tree.root.findAll(
    (n) =>
      n.props.accessibilityRole === "button" &&
      n.props.accessibilityLabel === label
  )[0];
beforeEach(() => jest.clearAllMocks());
afterEach(() => {
  if (tree) act(() => tree.unmount());
});
it("validates GSTIN checksum and rejects arbitrary text", () => {
  expect(validGstin("27AAPFU0939F1ZV")).toBe(true);
  expect(validGstin("27AAPFU0939F1ZA")).toBe(false);
  expect(validGstin("hello")).toBe(false);
});
it("uses capped server coupon amount, handles string ids and never produces negative fares", () => {
  expect(
    reviewFare(props.vehicle, {
      success: true,
      is_apply_all: 0,
      applicable_vehicles: ["3"],
      coupon_type: "percentage",
      amount: 50,
      total_coupon_discount: 10,
    })
  ).toEqual({ fare: 198.78, discount: 10, payable: 188.78, extras: 0 });
  expect(
    reviewFare(props.vehicle, {
      success: true,
      is_apply_all: 1,
      total_coupon_discount: 1000,
    }).payable
  ).toBe(0);
});
it("shows every stop and returns to review without creating a booking", async () => {
  await act(async () => {
    tree = renderer.create(<BookingReview {...props} />);
  });
  act(() => button("View address details").props.onPress());
  expect(JSON.stringify(tree.toJSON())).toContain("Middle stop Jalgaon");
  act(() => button("Back to review").props.onPress());
  expect(confirm).not.toHaveBeenCalled();
});
it("requires a goods type and restriction confirmation before booking and sends selected data", async () => {
  await act(async () => {
    tree = renderer.create(<BookingReview {...props} />);
  });
  act(() => button("Choose goods type").props.onPress());
  expect(tree.root.findByType(ScrollView).findAll(n => n.props.accessibilityRole === 'checkbox')).toHaveLength(0);
  expect(tree.root.findAll(n => n.props.accessibilityRole === 'checkbox')).not.toHaveLength(0);
  expect(button("Confirm goods type").props.disabled).toBe(true);
  act(() =>
    tree.root
      .findAll(
        (n) =>
          n.props.accessibilityRole === "radio" &&
          n.props.accessibilityLabel === "Documents & stationery"
      )[0]
      .props.onPress()
  );
  expect(button("Confirm goods type").props.disabled).toBe(true);
  act(() =>
    tree.root
      .findAll((n) => n.props.accessibilityRole === "checkbox")[0]
      .props.onPress()
  );
  act(() => button("Confirm goods type").props.onPress());
  expect(confirm).not.toHaveBeenCalled();
  act(() => button("Confirm delivery booking").props.onPress());
  expect(confirm).toHaveBeenCalledWith({
    goods_type: "documents",
    restricted_items_confirmed: true,
  });
});
it("connects coupon Apply to the existing verify callback", async () => {
  await act(async () => {
    tree = renderer.create(<BookingReview {...props} />);
  });
  act(() =>
    tree.root
      .findAllByType(TextInput)
      .find((n) => n.props.accessibilityLabel === "Coupon code")!
      .props.onChangeText("SAVE10")
  );
  await act(async () => {
    await button("Apply review coupon").props.onPress();
  });
  expect(apply).toHaveBeenCalledWith("SAVE10");
});
it('shows invalid GST feedback at confirmation and allows explicit booking without GST',async()=>{
 const alert=jest.spyOn(Alert,'alert').mockImplementation(()=>{});
 await act(async()=>{tree=renderer.create(<BookingReview {...props}/>);});
 act(()=>button('Choose goods type').props.onPress());
 act(()=>tree.root.findAll(n=>n.props.accessibilityRole==='radio'&&n.props.accessibilityLabel==='Documents & stationery')[0].props.onPress());
 act(()=>tree.root.findAll(n=>n.props.accessibilityRole==='checkbox')[0].props.onPress());
 act(()=>button('Confirm goods type').props.onPress());
 act(()=>button('Edit GST details').props.onPress());
 act(()=>tree.root.findAllByType(TextInput).find(n=>n.props.accessibilityLabel==='GSTIN')!.props.onChangeText('123456789012345'));
 act(()=>button('Confirm delivery booking').props.onPress());
 expect(confirm).not.toHaveBeenCalled();
 expect(alert).toHaveBeenCalledWith('Check GST details',expect.stringContaining('invalid'),expect.any(Array));
 const actions=alert.mock.calls[0][2]!;
 act(()=>actions.find(action=>action.text==='Continue without GST')!.onPress!());
 expect(confirm).toHaveBeenCalledWith({goods_type:'documents',restricted_items_confirmed:true});
 alert.mockRestore();
});
