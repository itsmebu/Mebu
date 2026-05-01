import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

export default function TabsLayout() {
  const router = useRouter();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#1a472a',
            borderTopColor: '#2a5a3a',
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          tabBarActiveTintColor: '#90ee90',
          tabBarInactiveTintColor: '#6a8a7a',
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="statistics"
          options={{
            title: 'Stats',
            tabBarIcon: ({ color, size }) => <Icon name="bar-chart-2" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: 'Categories',
            tabBarIcon: ({ color, size }) => <Icon name="grid" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <Icon name="user" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="add-expense"
          options={{
            title: '',
            tabBarIcon: ({ color, size }) => <Icon name="plus-circle" size={size} color={color} />,
            href: null,
          }}
        />
      </Tabs>
      
      {/* Floating Action Button centered above tab bar */}
      <View style={{
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
      }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#90ee90',
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
          }}
          onPress={() => router.push('/(tabs)/add-expense')}
        >
          <Icon name="plus" size={24} color="#1a472a" />
        </TouchableOpacity>
      </View>
    </>
  );
}