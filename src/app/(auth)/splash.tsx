import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, Text, View } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(auth)/onboarding-screen');
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#1a472a', justifyContent: 'center', alignItems: 'center' }}>
      {/* Logo Image */}
      <Image 
        source={require('../../../assets/images/logo.png')} 
        style={{ 
          width: 100, 
          height: 100, 
          marginBottom: 5,
          resizeMode: 'contain'
        }} 
      />
      <Text style={{ fontSize: 32, color: '#ffffff', fontFamily: 'Poppins-Bold', marginBottom: 4 }}>
        MEBU
      </Text>
      <Text style={{ fontSize: 14, color: '#90ee90', fontFamily: 'Poppins-Regular' }}>
        Expense Tracker
      </Text>
    </View>
  );
}