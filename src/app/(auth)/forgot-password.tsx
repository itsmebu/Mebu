import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { auth } from '../../../config/firebase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const router = useRouter();

  const showModal = (message: string, isError: boolean = false) => {
    setModalMessage(message);
    if (isError) {
      setShowErrorModal(true);
      setTimeout(() => {
        setShowErrorModal(false);
      }, 2000);
    } else {
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        router.push('/(auth)/login');
      }, 2000);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      showModal('Please enter your email address', true);
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      showModal('Password reset instructions have been sent to your email. Please check your inbox.');
    } catch (error: any) {
      let errorMessage = 'Failed to send reset email. ';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else {
        errorMessage += error.message;
      }
      showModal(errorMessage, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#1a472a' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ padding: 20 }}>
          {/* Back Button */}
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ marginBottom: 20, alignSelf: 'flex-start' }}
          >
        
          </TouchableOpacity>

          <Text style={{ fontSize: 32, color: '#ffffff', fontFamily: 'Poppins-Bold', marginBottom: 10, textAlign: 'center' }}>
            Forgot Password?
          </Text>
          
          <Text style={{ fontSize: 14, color: '#c0e0c0', fontFamily: 'Poppins-Regular', textAlign: 'center', marginBottom: 30 }}>
            Enter your email address and we'll send you instructions to reset your password.
          </Text>

          {/* Email Input with Floating Label */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ 
              color: '#90ee90', 
              marginBottom: 5, 
              fontFamily: 'Poppins-Regular',
              fontSize: 14
            }}>
              Email Address
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a5a3a', borderRadius: 10 }}>
              <Icon name="mail" size={20} color="#90ee90" style={{ marginLeft: 15 }} />
              <TextInput
                style={{ flex: 1, padding: 15, color: '#ffffff', fontFamily: 'Poppins-Regular' }}
                placeholder="Enter your email"
                placeholderTextColor="#90ee90"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: '#90ee90',
              padding: 15,
              borderRadius: 10,
              alignItems: 'center',
              marginTop: 10
            }}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#1a472a" />
            ) : (
              <Text style={{ color: '#1a472a', fontSize: 16, fontWeight: 'bold', fontFamily: 'Poppins-SemiBold' }}>
                Send Reset Instructions
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ marginTop: 20, alignItems: 'center' }}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={{ color: '#90ee90', fontFamily: 'Poppins-Regular' }}>
              Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success Modal - Dark Green Minimal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: '#1a472a',
            padding: 20,
            borderRadius: 16,
            width: '85%',
            maxWidth: 280,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#4a8a6a',
          }}>
            <View style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: '#4ECDC4',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 12,
            }}>
              <Icon name="check" size={28} color="#1a472a" />
            </View>
            <Text style={{ color: '#ffffff', fontSize: 18, fontFamily: 'Poppins-Bold', marginBottom: 6, textAlign: 'center' }}>
              Email Sent!
            </Text>
            <Text style={{ color: '#c0e0c0', fontSize: 12, fontFamily: 'Poppins-Regular', textAlign: 'center', marginBottom: 15 }}>
              {modalMessage}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Error Modal - Dark Green Minimal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: '#1a472a',
            padding: 20,
            borderRadius: 16,
            width: '85%',
            maxWidth: 280,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#4a8a6a',
          }}>
            <View style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: '#3a1a1a',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 12,
            }}>
              <Icon name="alert-triangle" size={28} color="#ff6b6b" />
            </View>
            <Text style={{ color: '#ffffff', fontSize: 18, fontFamily: 'Poppins-Bold', marginBottom: 6, textAlign: 'center' }}>
              Error
            </Text>
            <Text style={{ color: '#c0e0c0', fontSize: 12, fontFamily: 'Poppins-Regular', textAlign: 'center', marginBottom: 15 }}>
              {modalMessage}
            </Text>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}