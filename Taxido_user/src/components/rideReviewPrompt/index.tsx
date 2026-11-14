import {BrandLoader} from '../../design/BrandLogo';
import React, { useEffect, useState } from "react";
import {ActivityIndicator, Modal, ScrollView, TouchableOpacity, View} from 'react-native';
import {Text, TextInput} from '../../design/Typography';
import { useDispatch } from "react-redux";
import { driverReviewPost } from "@src/api/store/actions";
import { notificationHelper } from "@src/commonComponent";
import { appColors, appFonts, fontSizes, windowHeight, windowWidth } from "@src/themes";
import { StarEmpty, StarFill } from "@src/utils/icons";

interface RideReviewPromptProps {
  visible: boolean;
  ride: any;
  onDismiss: () => void;
  onSubmitted?: () => void;
}

export default function RideReviewPrompt({
  visible,
  ride,
  onDismiss,
  onSubmitted,
}: RideReviewPromptProps) {
  const dispatch = useDispatch<any>();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setRating(0);
      setComment("");
    }
  }, [visible, ride?.id]);

  const submitReview = async () => {
    if (rating < 1) {
      notificationHelper("", "Choose a star rating to submit your review.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const result = await dispatch(
        driverReviewPost({
          ride_id: ride?.id,
          driver_id: ride?.driver_id ?? ride?.driver?.id,
          rating,
          message: comment.trim(),
        }) as any,
      ).unwrap();
      const responseData = result?.data ?? result;

      if (result?.status >= 400 || responseData?.success === false) {
        throw new Error(responseData?.message || "Could not submit your review.");
      }

      notificationHelper("", "Thanks for your feedback.", "success");
      onSubmitted?.();
      onDismiss();
    } catch (error: any) {
      notificationHelper(
        "",
        error?.message || error || "Could not submit your review. Please try again.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Close review prompt"
            disabled={submitting}
            onPress={onDismiss}
            style={styles.closeButton}
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>How was your delivery?</Text>
            <Text style={styles.subtitle}>
              Please rate your experience. Leaving a comment is optional.
            </Text>

            <View style={styles.driverBlock}>
              <Text style={styles.driverName}>{ride?.driver?.name || "Your driver"}</Text>
              {ride?.ride_number ? (
                <Text style={styles.rideNumber}>Delivery #{ride.ride_number}</Text>
              ) : null}
            </View>

            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map(value => (
                <TouchableOpacity
                  key={value}
                  accessibilityRole="button"
                  accessibilityLabel={`${value} star${value === 1 ? "" : "s"}`}
                  disabled={submitting}
                  onPress={() => setRating(value)}
                  style={styles.starButton}
                >
                  {value <= rating ? <StarFill /> : <StarEmpty />}
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingLabel}>
              {rating > 0 ? `${rating} / 5` : "Tap a star to rate"}
            </Text>

            <TextInput
              accessibilityLabel="Optional review comment"
              editable={!submitting}
              multiline
              maxLength={1000}
              placeholder="Add a comment (optional)"
              placeholderTextColor={appColors.gray}
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
              style={styles.commentInput}
            />

            <TouchableOpacity
              accessibilityRole="button"
              disabled={submitting}
              onPress={submitReview}
              style={[styles.submitButton, submitting && styles.disabledButton]}
            >
              {submitting ? (
                <BrandLoader color={appColors.whiteColor} />
              ) : (
                <Text style={styles.submitText}>Submit review</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = {
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.48)",
    justifyContent: "center" as const,
    paddingHorizontal: windowWidth(22),
  },
  card: {
    maxHeight: "82%" as const,
    backgroundColor: appColors.whiteColor,
    borderRadius: windowHeight(18),
    paddingHorizontal: windowWidth(22),
    paddingTop: windowHeight(14),
    paddingBottom: windowHeight(18),
  },
  closeButton: {
    alignSelf: "flex-end" as const,
    paddingVertical: windowHeight(5),
    paddingHorizontal: windowWidth(8),
  },
  closeText: {
    color: appColors.primary,
    fontFamily: appFonts.medium,
    fontSize: fontSizes.FONT14,
  },
  title: {
    color: appColors.primaryText,
    fontFamily: appFonts.bold,
    fontSize: fontSizes.FONT22,
    textAlign: "center" as const,
    marginTop: windowHeight(2),
  },
  subtitle: {
    color: appColors.gray,
    fontFamily: appFonts.regular,
    fontSize: fontSizes.FONT14,
    textAlign: "center" as const,
    marginTop: windowHeight(8),
  },
  driverBlock: {
    alignItems: "center" as const,
    marginTop: windowHeight(18),
  },
  driverName: {
    color: appColors.primaryText,
    fontFamily: appFonts.medium,
    fontSize: fontSizes.FONT18,
  },
  rideNumber: {
    color: appColors.gray,
    fontFamily: appFonts.regular,
    fontSize: fontSizes.FONT12,
    marginTop: windowHeight(3),
  },
  stars: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    marginTop: windowHeight(20),
  },
  starButton: {
    paddingHorizontal: windowWidth(6),
    paddingVertical: windowHeight(4),
  },
  ratingLabel: {
    color: appColors.primary,
    fontFamily: appFonts.medium,
    fontSize: fontSizes.FONT14,
    textAlign: "center" as const,
    marginTop: windowHeight(5),
  },
  commentInput: {
    minHeight: windowHeight(92),
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: windowHeight(10),
    color: appColors.primaryText,
    fontFamily: appFonts.regular,
    fontSize: fontSizes.FONT14,
    padding: windowHeight(12),
    marginTop: windowHeight(18),
  },
  submitButton: {
    minHeight: windowHeight(48),
    backgroundColor: appColors.primary,
    borderRadius: windowHeight(10),
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginTop: windowHeight(16),
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitText: {
    color: appColors.whiteColor,
    fontFamily: appFonts.medium,
    fontSize: fontSizes.FONT16,
  },
};
