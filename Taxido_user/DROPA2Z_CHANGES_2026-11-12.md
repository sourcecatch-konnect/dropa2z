- Rider scroll visibility: the vehicle/details BottomSheetScrollView now shows a persistent vertical scrollbar, making the photo upload section discoverable below the fixed footer. Scroll still preserves the measured footer clearance.

- Rider recipient autofill: the delivery form defaults to the signed-in Rider’s name, country code and phone. Choosing Myself restores those account details; choosing an existing or newly added contact fills the visible form and booking recipient payload from that contact.
- Contact selection now uses the India phone normalizer, excluding duplicate, malformed and non-Indian phone entries from the picker.
