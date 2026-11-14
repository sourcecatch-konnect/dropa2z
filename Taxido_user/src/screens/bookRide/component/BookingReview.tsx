import {BrandLoader} from '../../../design/BrandLogo';
import React, { useState, useRef } from "react";
import {Modal, View, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert} from 'react-native';
import {Text, TextInput} from '../../../design/Typography';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useValues } from "../../../utils/context";
import { VehicleChoiceArtwork } from "../../../design/VehicleChoiceArtwork";
import { DesignIcon } from "../../../design/DesignIcon";
import {CardHeading} from "../../../design/CardHeading";
import {
  GOODS_TYPES,
  RESTRICTED_GOODS,
  validGstin,
  reviewFare,
  DeliveryDetails,
} from "../../../utils/bookingReview";

type Props = {
  visible: boolean;
  vehicle: any;
  locations: string[];
  receiver?: string;
  weight?: string;
  coupon: any;
  couponCode: string;
  couponEnabled: boolean;
  couponLoading: boolean;
  couponMessage: string;
  finalPrice: any;
  payment: string;
  busy: boolean;
  onClose: () => void;
  onApplyCoupon: (code: string) => Promise<void>;
  onRemoveCoupon: () => void;
  onConfirm: (details: DeliveryDetails) => void;
};
export function BookingReview(props: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets(),
    { isDark } = useValues();
  const [mode, setMode] = useState<"review" | "goods" | "addresses">("review"),
    [goods, setGoods] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [showRestricted, setShowRestricted] = useState(false),
    [editGst, setEditGst] = useState(false),
    [gstin, setGstin] = useState(""),
    [business, setBusiness] = useState(""),
    [gstError, setGstError] = useState(""),
    [couponText, setCouponText] = useState("");
  const accent = "#FC9F03",
    action = isDark ? "#FFBE60" : "#A64B00",
    ink = isDark ? "#FFFFFF" : "#17191C",
    muted = isDark ? "#BDC5C0" : "#656C76",
    surface = isDark ? "#25282D" : "#FFFFFF",
    canvas = isDark ? "#17191C" : "#F7F7F5";
  const fare = reviewFare(props.vehicle, props.coupon, props.finalPrice),
    symbol = props.vehicle?.currency_symbol || "₹",
    amount = (n: number) => `${symbol}${n.toFixed(2)}`;
  const selected = GOODS_TYPES.find((item) => item[0] === goods),
    included = Number(props.vehicle?.charges?.goods_included_minutes || 0);
  const close = () => {
    if (props.busy) return;
    if (mode !== "review") setMode("review");
    else props.onClose();
  };
  const validateGst = () => {
    if (gstin.trim() && !validGstin(gstin)) {
      setGstError("Enter a valid GSTIN.");
      return false;
    }
    if (gstin.trim() && !business.trim()) {
      setGstError("Enter the registered business name.");
      return false;
    }
    setGstError("");
    return true;
  };
  const finishBooking = (includeGst: boolean) => {
    if (!goods || !confirmed) {
      setMode("goods");
      return;
    }
    props.onConfirm({
      goods_type: goods,
      restricted_items_confirmed: true,
      ...(includeGst && gstin.trim()
        ? { gstin: gstin.trim().toUpperCase(), business_name: business.trim() }
        : {}),
    });
  };
  const submit = () => {
    if (props.busy) return;
    if (!validateGst()) {
      setEditGst(true);
      Alert.alert(
        'Check GST details',
        !validGstin(gstin) ? 'The GSTIN entered is invalid. Enter your registered GSTIN, or continue without GST details.' : 'Enter the registered business name, or continue without GST details.',
        [
          {text:'Edit GSTIN',onPress:()=>scrollRef.current?.scrollTo({y:0,animated:true})},
          {text:'Continue without GST',onPress:()=>{setGstin('');setBusiness('');setGstError('');setEditGst(false);finishBooking(false);}},
        ],
      );
      return;
    }
    finishBooking(true);
  };
  const row = (label: string, value: string, strong = false) => (
    <View style={styles.fareRow}>
      <Text
        style={{ color: muted, flex: 1, fontWeight: strong ? "700" : "400" }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: ink,
          fontWeight: strong ? "800" : "500",
          marginLeft: 12,
        }}
      >
        {value}
      </Text>
    </View>
  );
  const card = (children: React.ReactNode) => (
    <View style={[styles.card, { backgroundColor: surface, borderColor: isDark ? "#3B403D" : "#E5E7EB" }]}>{children}</View>
  );
  return (
    <Modal visible={props.visible} animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: canvas, paddingTop: Platform.OS === "ios" ? insets.top : 0 }}
      >
        <View style={[styles.header, { backgroundColor: surface }]}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Back from booking review"
            onPress={close}
            disabled={props.busy}
            style={styles.back}
          >
            <DesignIcon name="chevron-left" color={ink} width={24} height={24}/>
          </TouchableOpacity>
          <Text style={[styles.title, { color: ink }]}>
            {mode === "goods"
              ? "Choose Goods Type"
              : mode === "addresses"
              ? "Address Details"
              : "Review Booking"}
          </Text>
        </View>
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        >
          {mode === "addresses" ? (
            card(
              <>
                {props.locations.map((address, index) => (
                  <View key={`${index}-${address}`} style={styles.address}>
                    <DesignIcon name="map-pin" color={accent} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: muted, fontSize: 12 }}>
                        {index === 0
                          ? "Pickup"
                          : index === props.locations.length - 1
                          ? "Destination"
                          : `Stop ${index}`}
                      </Text>
                      <Text style={{ color: ink, lineHeight: 22 }}>
                        {address}
                      </Text>
                    </View>
                  </View>
                ))}
                {!!props.receiver && row("Receiver", props.receiver)}
                {!!props.weight && row("Parcel weight", `${props.weight} kg`)}
              </>
            )
          ) : mode === "goods" ? (
            <>
              {card(
                <>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Toggle restricted items"
                    onPress={() => setShowRestricted(!showRestricted)}
                    style={styles.fareRow}
                  >
                    <View style={{flex: 1}}><CardHeading icon="shield-check" title="Restricted Items"/></View>
                    <Text style={{ color: action }}>
                      {showRestricted ? "Hide ▴" : "View ▾"}
                    </Text>
                  </TouchableOpacity>
                  <Text style={{ color: muted }}>
                    We cannot carry illegal, dangerous or prohibited goods.
                  </Text>
                  {showRestricted &&
                    RESTRICTED_GOODS.map((label) => (
                      <Text key={label} style={{ color: muted, marginTop: 10 }}>
                        • {label}
                      </Text>
                    ))}
                </>
              )}
              {GOODS_TYPES.map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  accessibilityRole="radio"
                  accessibilityLabel={label}
                  accessibilityState={{ checked: goods === key }}
                  onPress={() => setGoods(key)}
                  style={[
                    styles.goods,
                    {
                      backgroundColor: surface,
                      borderColor: goods === key ? accent : isDark ? "#41464E" : "#E5E7EB",
                    },
                  ]}
                >
                  <DesignIcon
                    name="package"
                    color={goods === key ? accent : muted}
                  />
                  <Text style={{ color: ink, flex: 1 }}>{label}</Text>
                  <Text style={{ color: accent }}>
                    {goods === key ? "●" : "○"}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <>
              {card(
                <>
                  <View style={styles.vehicle}>
                    <VehicleChoiceArtwork
                      vehicle={props.vehicle}
                      source={{ uri: props.vehicle?.vehicle_image_url }}
                      style={{ width: 76, height: 58 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.section, { color: ink }]}>
                        {props.vehicle?.name || "Delivery"}
                      </Text>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="View address details"
                        onPress={() => setMode("addresses")}
                        style={{ paddingVertical: 10 }}
                      >
                        <Text style={{ color: action, fontWeight: "700" }}>
                          View Address Details ›
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {included > 0 && (
                    <Text
                      style={[
                        styles.notice,
                        {
                          color: ink,
                          backgroundColor: isDark ? "#3C281C" : "#FFF1E8",
                        },
                      ]}
                    >
                      Includes {included} minutes in the fare calculation.
                    </Text>
                  )}
                </>
              )}
              {card(
                <>
                  <View style={styles.fareRow}>
                    <View style={{flex: 1}}><CardHeading icon="file-text" title="Have a GST Number?" subtitle="Add business details for your invoice"/></View>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Edit GST details"
                      onPress={() => setEditGst(!editGst)}
                      style={styles.smallButton}
                    >
                      <Text style={{ color: action, fontWeight: "700" }}>
                        {gstin ? "Edit GSTIN" : "Add GSTIN"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {editGst && (
                    <>
                      <TextInput
                        accessibilityLabel="GSTIN"
                        placeholder="GSTIN (optional)"
                        placeholderTextColor={muted}
                        value={gstin}
                        onChangeText={(value) => {
                          setGstin(
                            value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                          );
                          setGstError("");
                        }}
                        maxLength={15}
                        autoCapitalize="characters"
                        style={[
                          styles.input,
                          { color: ink, borderColor: accent },
                        ]}
                      />
                      <TextInput
                        accessibilityLabel="Registered business name"
                        placeholder="Registered business name"
                        placeholderTextColor={muted}
                        value={business}
                        onChangeText={setBusiness}
                        maxLength={150}
                        style={[styles.input, { color: ink, borderColor: isDark ? "#41464E" : "#E5E7EB" }]}
                      />
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => {
                          if (validateGst()) setEditGst(false);
                        }}
                        style={styles.smallButton}
                      >
                        <Text style={{ color: action }}>Save GST details</Text>
                      </TouchableOpacity>
                      <Text
                        style={{ color: muted, fontSize: 12, marginTop: 6 }}
                      >
                        GSTIN format is checked here; government registration is
                        not verified.
                      </Text>
                    </>
                  )}
                  {!!gstError && (
                    <Text
                      accessibilityRole="alert"
                      style={{ color: "#C42A02", marginTop: 8 }}
                    >
                      {gstError}
                    </Text>
                  )}
                  {!editGst && !!gstin && (
                    <Text style={{ color: ink, marginTop: 8 }}>
                      {business} · {gstin}
                    </Text>
                  )}
                </>
              )}
              {props.couponEnabled &&
                card(
                  <>
                    <CardHeading icon="tag" title="Offers and Discounts"/>
                    {props.couponCode && fare.discount > 0 ? (
                      <View style={styles.fareRow}>
                        <Text style={{ color: ink, flex: 1 }}>
                          You saved {amount(fare.discount)} with{" "}
                          {props.couponCode}
                        </Text>
                        <TouchableOpacity
                          accessibilityRole="button"
                          onPress={props.onRemoveCoupon}
                        >
                          <Text style={{ color: action, fontWeight: "700" }}>
                            Remove
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.address}>
                        <TextInput
                          accessibilityLabel="Coupon code"
                          value={couponText}
                          onChangeText={setCouponText}
                          autoCapitalize="characters"
                          placeholder="Enter coupon code"
                          placeholderTextColor={muted}
                          style={[styles.input, { flex: 1, color: ink, borderColor: isDark ? "#41464E" : "#E5E7EB" }]}
                        />
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel="Apply review coupon"
                          disabled={!couponText.trim() || props.couponLoading}
                          onPress={() => props.onApplyCoupon(couponText.trim())}
                          style={styles.smallButton}
                        >
                          {props.couponLoading ? (
                            <BrandLoader color={action} />
                          ) : (
                            <Text style={{ color: action, fontWeight: "700" }}>
                              Apply
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                    {!!props.couponMessage && (
                      <Text style={{ color: muted, marginTop: 8 }}>
                        {props.couponMessage}
                      </Text>
                    )}
                  </>
                )}
              {card(
                <>
                  <CardHeading icon="wallet" title="Fare Summary"/>
                  {row("Delivery fare", amount(fare.fare))}
                  {fare.extras > 0 &&
                    row("Selected extras", amount(fare.extras))}
                  {fare.discount > 0 &&
                    row(
                      `Coupon discount · ${props.couponCode}`,
                      `−${amount(fare.discount)}`
                    )}
                  {[
                    ["Base fare", "base_fare_charge"],
                    ["Additional distance", "additional_distance_charge"],
                    ["Time charge", "additional_minute_charge"],
                    ["Additional weight", "additional_weight_charge"],
                    ["Platform fee", "platform_fee"],
                    ["Tax", "tax"],
                  ]
                    .filter(
                      ([, key]) => Number(props.vehicle?.charges?.[key]) > 0
                    )
                    .map(([label, key]) => (
                      <View key={key}>
                        {row(label, amount(Number(props.vehicle.charges[key])))}
                      </View>
                    ))}
                  <Text style={{ fontSize: 12, color: muted }}>
                    The component charges above are included in the delivery
                    fare.
                  </Text>
                  <View style={[styles.total, {borderColor: isDark ? "#41464E" : "#E5E7EB"}]}>
                    {row("Amount Payable", amount(fare.payable), true)}
                  </View>
                  {row("Payment method", props.payment || "cash")}
                </>
              )}
              {card(
                <>
                  <CardHeading icon="package" title="Goods Type"/>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => setMode("goods")}
                    style={styles.fareRow}
                  >
                    <Text style={{ color: ink }}>
                      {selected?.[1] || "Select the goods you are sending"}
                    </Text>
                    <Text style={{ color: action }}>Change ›</Text>
                  </TouchableOpacity>
                </>
              )}
              {card(
                <>
                  <CardHeading icon="shield-check" title="Read before Booking"/>
                  {[
                    "Pack and seal your parcel securely.",
                    "Do not exceed the selected vehicle’s capacity.",
                    "Check pickup, receiver and all drop addresses before confirming.",
                    "The quote is for the selected route and goods details. Changes require an updated quote.",
                    "Loading help, parking and other extra services are not promised as part of this quote.",
                  ].map((label) => (
                    <Text
                      key={label}
                      style={{ color: muted, lineHeight: 22, marginTop: 8 }}
                    >
                      • {label}
                    </Text>
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>
        <View
          style={[
            styles.footer,
            {
              backgroundColor: surface,
              paddingBottom: Math.max(12, insets.bottom + 8),
            },
          ]}
        >
          {mode === 'review' && !!gstError && <Text accessibilityRole="alert" style={{color:'#C42A02',marginBottom:8}}>GST details need attention. Tap Confirm Booking to edit them or continue without GST.</Text>}
          {mode === "goods" && (
            <View>
              <Text style={{color: muted, fontSize: 12}}>
                {selected ? `Selected: ${selected[1]}` : 'Select a goods type above.'}
              </Text>
              <TouchableOpacity
                accessibilityRole="checkbox"
                accessibilityLabel="Confirm no restricted goods"
                accessibilityState={{ checked: confirmed }}
                onPress={() => setConfirmed(!confirmed)}
                style={styles.address}
              >
                <Text style={{ color: accent, fontSize: 24 }}>
                  {confirmed ? "☑" : "☐"}
                </Text>
                <Text style={{ color: ink, flex: 1, lineHeight: 20, fontSize: 13 }}>
                  My parcel contains no restricted items and fits the selected vehicle.
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={
              mode === "goods"
                ? "Confirm goods type"
                : mode === "addresses"
                ? "Back to review"
                : goods && confirmed
                ? "Confirm delivery booking"
                : "Choose goods type"
            }
            disabled={
              props.busy || (mode === "goods" && (!goods || !confirmed))
            }
            onPress={() => (mode === "review" ? submit() : setMode("review"))}
            style={[
              styles.cta,
              {
                backgroundColor: accent,
                opacity:
                  props.busy || (mode === "goods" && (!goods || !confirmed))
                    ? 0.5
                    : 1,
              },
            ]}
          >
            {props.busy ? (
              <BrandLoader color="#17191C" />
            ) : (
              <Text style={styles.ctaText}>
                {mode === "goods"
                  ? "Confirm Goods Type"
                  : mode === "addresses"
                  ? "Back to Review"
                  : goods && confirmed
                  ? "Confirm Booking"
                  : "Choose Goods Type"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  back: {
    height: 44,
    width: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 22, fontWeight: "800", flex: 1 },
  section: { fontSize: 17, fontWeight: "800" },
  card: { padding: 18, borderRadius: 22, marginBottom: 16, borderWidth: 1, borderColor: "#E5E7EB", shadowColor: "#17191C", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: {width: 0, height: 4} },
  vehicle: { flexDirection: "row", alignItems: "center", gap: 14 },
  notice: { padding: 12, borderRadius: 12, marginTop: 10, lineHeight: 20 },
  fareRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 10,
  },
  address: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 10,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#DFE5E1",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  smallButton: { padding: 10, minHeight: 44, justifyContent: "center" },
  goods: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  total: {
    borderTopWidth: 1,
    borderColor: "#DFE5E1",
    marginTop: 14,
    paddingTop: 6,
  },
  footer: { paddingHorizontal: 16, paddingTop: 12 },
  cta: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  ctaText: { color: "#17191C", fontSize: 17, fontWeight: "800" },
});
