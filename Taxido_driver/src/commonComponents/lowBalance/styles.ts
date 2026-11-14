import { StyleSheet } from "react-native";
import appColors from "../../theme/appColors";
import { fontSizes, windowHeight, windowWidth } from "../../theme/appConstant";
import appFonts from "../../theme/appFonts";

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    container: {
        paddingVertical: windowHeight(3),
        paddingHorizontal: windowWidth(2),
        borderRadius: windowWidth(5),
        width: '90%',
        maxWidth: 440,
        padding: 22,
    },
    title: {
        fontSize: 20,
        lineHeight: 27,
        fontFamily: appFonts.semiBold,
        marginVertical: windowHeight(2),
        alignSelf: 'center',
        textAlign: 'center'
    },
    image: {
        height: windowHeight(6.5),
        width: windowWidth(15),
        resizeMode: 'contain',
        alignSelf: 'center',
    },
    subText: {
        fontFamily: appFonts.regular,
        fontSize: fontSizes.FONT3HALF,
        color: appColors.iconColor,
        textAlign: 'center'
    }
})

export default styles