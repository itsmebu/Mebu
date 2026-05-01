import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useAuth } from '../../hooks/useAuth';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  const { signIn } = useAuth();

  const showError = (message: string) => {
    setErrorMessage(message);
    setShowErrorModal(true);
    setTimeout(() => {
      setShowErrorModal(false);
    }, 2000);
  };

  const handleLogin = async () => {
    if (!identifier || !password) {
      showError('Please fill in all fields');
      return;
    }

    setLoading(true);
    const result = await signIn(identifier, password);
    setLoading(false);

    if (result.success) {
      router.replace('/(tabs)/home');
    } else {
      showError('Invalid username/email or password');
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
          {/* Logo Only */}
          <View style={{ alignItems: 'center', marginBottom: 6 }}>
            <Image 
              source={require('../../../assets/images/logo.png')} 
              style={{ 
                width: 100, 
                height: 100, 
                resizeMode: 'contain'
              }} 
            />
          </View>

          {/* Login Title */}
          <Text style={{ fontSize: 24, color: '#ffffff', fontFamily: 'Poppins-Bold', marginBottom: 10, textAlign: 'center' }}>
            Login
          </Text>

          {/* Email/Username Input */}
          <View style={{ marginBottom: 15 }}>
            <Text style={{ 
              color: '#90ee90', 
              marginBottom: 5, 
              fontFamily: 'Poppins-Regular',
              fontSize: 14
            }}>
              Email or Username
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a5a3a', borderRadius: 10 }}>
              <Icon name="user" size={20} color="#90ee90" style={{ marginLeft: 15 }} />
              <TextInput
                style={{ flex: 1, padding: 15, color: '#ffffff', fontFamily: 'Poppins-Regular' }}
                placeholder="Enter your email or username"
                placeholderTextColor="#90ee90"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={{ marginBottom: 15 }}>
            <Text style={{ 
              color: '#90ee90', 
              marginBottom: 5, 
              fontFamily: 'Poppins-Regular',
              fontSize: 14
            }}>
              Password
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a5a3a', borderRadius: 10 }}>
              <Icon name="lock" size={20} color="#90ee90" style={{ marginLeft: 15 }} />
              <TextInput
                style={{ flex: 1, padding: 15, color: '#ffffff', fontFamily: 'Poppins-Regular' }}
                placeholder="Enter your password"
                placeholderTextColor="#90ee90"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 15 }}>
                <Icon name={showPassword ? 'eye-off' : 'eye'} size={20} color="#90ee90" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity 
            style={{ alignSelf: 'flex-end', marginBottom: 20 }}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text style={{ color: '#90ee90', fontFamily: 'Poppins-Regular' }}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={{
              backgroundColor: '#90ee90',
              padding: 15,
              borderRadius: 10,
              alignItems: 'center',
              marginBottom: 20
            }}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#1a472a" />
            ) : (
              <Text style={{ color: '#1a472a', fontSize: 16, fontWeight: 'bold', fontFamily: 'Poppins-SemiBold' }}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <Text style={{ color: '#c0e0c0', fontFamily: 'Poppins-Regular' }}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={{ color: '#90ee90', fontWeight: 'bold', fontFamily: 'Poppins-SemiBold' }}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Error Modal - Dark Green Theme with Minimal Size */}
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
            {/* Error Icon */}
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
              Login Failed
            </Text>
            
            <Text style={{ color: '#c0e0c0', fontSize: 13, fontFamily: 'Poppins-Regular', textAlign: 'center', marginBottom: 15 }}>
              {errorMessage}
            </Text>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}