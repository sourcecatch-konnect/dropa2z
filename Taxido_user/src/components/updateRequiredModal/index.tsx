import {BrandMark} from '../../design/BrandLogo';
import React from 'react';
import {Modal, View, TouchableOpacity, Image, StatusBar} from 'react-native';
import {Text} from '../../design/Typography';
import { styles } from './styles';
import Images from '../../utils/images';
import { useValues } from '../../utils/context';
import { appColors } from '../../themes';

interface UpdateRequiredModalProps {
    visible: boolean;
    onUpdate?: () => void;
}

export const UpdateRequiredModal: React.FC<UpdateRequiredModalProps> = ({ visible, onUpdate }) => {
    const { isDark } = useValues();

    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            statusBarTranslucent={true}
        >
            <StatusBar backgroundColor="rgba(0,0,0,0.6)" barStyle="light-content" />
            <View style={styles.modalBackground}>
                <View style={[styles.modalContainer, { backgroundColor: isDark ? appColors.darkHeader : appColors.whiteColor }]}>
                    <View style={[styles.imageContainer, { backgroundColor: isDark ? appColors.darkPrimary : appColors.lightGreen }]}>
                        <BrandMark size={54}/>
                    </View>
                    <Text style={[styles.title, { color: isDark ? appColors.whiteColor : appColors.primaryText }]}>
                        Update Required
                    </Text>
                    <Text style={[styles.description, { color: isDark ? appColors.darkText : appColors.subtitle }]}>
                        A new version of the app is available. Please update to continue using the app.
                    </Text>
                    <TouchableOpacity
                        style={styles.button}
                        activeOpacity={0.8}
                        onPress={onUpdate}
                    >
                        <Text style={styles.buttonText}>Update Now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};
