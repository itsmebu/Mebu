import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import Swiper from 'react-native-swiper';
import Icon from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    title: 'Track Your Expenses',
    description: 'Easily track your daily expenses and manage your money effectively',
    icon: 'trending-up',
    iconColor: '#FF6B6B',
  },
  {
    title: 'Smart Analytics',
    description: 'Get insights into your spending habits with beautiful charts and statistics',
    icon: 'bar-chart-2',
    iconColor: '#4ECDC4',
  },
  {
    title: 'Stay Organized',
    description: 'Categorize your expenses and keep your finances in order',
    icon: 'grid',
    iconColor: '#FFEAA7',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  const handleGetStarted = () => {
    router.push('/(auth)/login');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1a472a' }}>
      <Swiper
        loop={true}
        onIndexChanged={(i) => setIndex(i)}
        dotStyle={{ backgroundColor: '#4a6a5a', width: 8, height: 8 }}
        activeDotStyle={{ backgroundColor: '#90ee90', width: 8, height: 8 }}
      >
        {onboardingData.map((item, i) => (
          <View key={i} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            {/* Icon Circle */}
            <View style={{
              width: 160,
              height: 160,
              backgroundColor: '#2a5a3a',
              borderRadius: 80,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 40,
            }}>
              <Icon name={item.icon} size={70} color={item.iconColor} />
            </View>
            
            <Text style={{ fontSize: 28, color: '#ffffff', fontFamily: 'Poppins-Bold', textAlign: 'center', marginBottom: 20 }}>
              {item.title}
            </Text>
            <Text style={{ fontSize: 16, color: '#c0e0c0', fontFamily: 'Poppins-Regular', textAlign: 'center', paddingHorizontal: 20 }}>
              {item.description}
            </Text>
          </View>
        ))}
      </Swiper>
      
      {/* Get Started Button */}
      <TouchableOpacity
        style={{
          backgroundColor: '#90ee90',
          padding: 15,
          borderRadius: 10,
          marginHorizontal: 20,
          marginBottom: 15,
        }}
        onPress={handleGetStarted}
      >
        <Text style={{ color: '#1a472a', textAlign: 'center', fontSize: 16, fontWeight: 'bold', fontFamily: 'Poppins-SemiBold' }}>
          Get Started
        </Text>
      </TouchableOpacity>
      
      {/* Minimal Footer Text */}
      <Text style={{ 
        color: '#90ee90', 
        textAlign: 'center', 
        fontSize: 10, 
        fontFamily: 'Poppins-Regular',
        marginBottom: 20,
        opacity: 0.7
      }}>
        MEBU | Developed by JP-Parilla
      </Text>
    </View>
  );
}