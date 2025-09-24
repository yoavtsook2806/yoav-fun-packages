import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { styles } from '../styles/SettingsModalStyles';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onClearAllHistory: () => void;
  currentTrainingPlanVersion: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  onClearAllHistory,
  currentTrainingPlanVersion,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>הגדרות</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>גרסת תוכנית האימון</Text>
              <Text style={styles.versionText}>{currentTrainingPlanVersion}</Text>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>נתונים</Text>
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={onClearAllHistory}
              >
                <Text style={styles.dangerButtonText}>
                  מחק את כל ההיסטוריה
                </Text>
              </TouchableOpacity>
              <Text style={styles.warningText}>
                פעולה זו תמחק את כל נתוני ההיסטוריה, ההתקדמות וההגדרות. לא ניתן לבטל פעולה זו.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default SettingsModal;
