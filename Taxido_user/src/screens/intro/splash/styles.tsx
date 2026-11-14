import { Dimensions, StyleSheet } from 'react-native';
const { width, height } = Dimensions.get("window");


const styles = StyleSheet.create({
  img: {
    width: width,  
    height: height, 
    resizeMode: "contain",
  },
  brandLogo: {
    width: '78%',
    height: height * 0.28,
    resizeMode: 'contain',
  },
  brandSubtitle: {
    marginTop: 24,
    color: '#656C76',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
export { styles };
