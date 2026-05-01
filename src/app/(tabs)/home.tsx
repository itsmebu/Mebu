import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Image, Modal, RefreshControl, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { deleteExpense, Expense, getExpenses } from '../../../store/expenses';
import { useAuth } from '../../hooks/useAuth';

export default function HomeScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [todayExpense, setTodayExpense] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const router = useRouter();
  const { user, userProfile, refreshUserProfile } = useAuth();

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const loadExpenses = async () => {
    try {
      const allExpenses = await getExpenses();
      setExpenses(allExpenses);
      
      const total = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      setTotalExpense(total);
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthly = allExpenses
        .filter(exp => exp.date.getMonth() === currentMonth && exp.date.getFullYear() === currentYear)
        .reduce((sum, exp) => sum + exp.amount, 0);
      setMonthlyExpense(monthly);
      
      // Calculate today's expense
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayExpenses = allExpenses.filter(exp => {
        const expDate = new Date(exp.date);
        expDate.setHours(0, 0, 0, 0);
        return expDate.getTime() === today.getTime();
      });
      const todayTotal = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      setTodayExpense(todayTotal);
    } catch (error) {
      console.error('Error loading expenses:', error);
      showModalMessage('Failed to load expenses', true);
    }
  };

  const showModalMessage = (message: string, error: boolean = false) => {
    setSuccessMessage(message);
    setIsError(error);
    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
    }, 2000);
  };

  const loadUserProfile = async () => {
    if (refreshUserProfile) {
      await refreshUserProfile();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadExpenses(), loadUserProfile()]);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
      loadUserProfile();
    }, [])
  );

  const handleDeleteExpense = async () => {
    if (expenseToDelete) {
      const result = await deleteExpense(expenseToDelete);
      setShowDeleteModal(false);
      setExpenseToDelete(null);
      if (result.success) {
        await loadExpenses();
        showModalMessage('Expense deleted successfully');
      } else {
        showModalMessage(result.error || 'Failed to delete expense', true);
      }
    }
  };

  const openDeleteModal = (id: string) => {
    setExpenseToDelete(id);
    setShowDeleteModal(true);
  };

  const renderExpense = ({ item }: { item: Expense }) => (
    <View style={{
      backgroundColor: '#2a5a3a',
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <View>
        <Text style={{ color: '#ffffff', fontSize: 16, fontFamily: 'Poppins-SemiBold' }}>
          ₱{formatNumber(item.amount)}
        </Text>
        <Text style={{ color: '#90ee90', fontSize: 12, fontFamily: 'Poppins-Regular', marginTop: 5 }}>
          {item.category}
        </Text>
        <Text style={{ color: '#c0e0c0', fontSize: 10, fontFamily: 'Poppins-Regular', marginTop: 2 }}>
          {item.date.toLocaleDateString()}
        </Text>
        {item.note && (
          <Text style={{ color: '#90ee90', fontSize: 10, fontFamily: 'Poppins-Regular', marginTop: 2 }}>
            Note: {item.note}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={() => openDeleteModal(item.id!)}>
        <Icon name="trash-2" size={20} color="#ff6b6b" />
      </TouchableOpacity>
    </View>
  );

  // Get display name - prioritize username, then fullName, then email
  const getDisplayName = () => {
    if (userProfile?.username) {
      return userProfile.username;
    }
    if (userProfile?.fullName) {
      return userProfile.fullName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a472a' }}>
      <View style={{ flex: 1 }}>
        <ScrollView 
          style={{ flex: 1, paddingHorizontal: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#90ee90"
              colors={['#90ee90']}
            />
          }
        >
          {/* Welcome Header with Logo and Username */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 20 }}>
            {/* Logo */}
            <Image 
              source={require('../../../assets/images/logo.png')} 
              style={{ 
                width: 50, 
                height: 50, 
                resizeMode: 'contain',
                marginRight: 12
              }} 
            />
            <View>
              <Text style={{ color: '#90ee90', fontSize: 14, fontFamily: 'Poppins-Regular' }}>
                Welcome back,
              </Text>
              <Text style={{ color: '#ffffff', fontSize: 20, fontFamily: 'Poppins-Bold' }}>
                @{getDisplayName()}!
              </Text>
            </View>
          </View>

          {/* Summary Cards - New Layout */}
          <View style={{
            backgroundColor: '#2a5a3a',
            padding: 20,
            borderRadius: 15,
            marginBottom: 20,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            {/* Left Side - This Month & Today */}
            <View style={{ flex: 1 }}>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#90ee90', fontSize: 12, fontFamily: 'Poppins-Regular' }}>
                  This Month
                </Text>
                <Text style={{ color: '#ffffff', fontSize: 18, fontFamily: 'Poppins-Bold' }}>
                  ₱{formatNumber(monthlyExpense)}
                </Text>
              </View>
              <View>
                <Text style={{ color: '#90ee90', fontSize: 12, fontFamily: 'Poppins-Regular' }}>
                  Today
                </Text>
                <Text style={{ color: '#ffffff', fontSize: 18, fontFamily: 'Poppins-Bold' }}>
                  ₱{formatNumber(todayExpense)}
                </Text>
              </View>
            </View>
            
            {/* Right Side - Total Expense (Larger) */}
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: '#90ee90', fontSize: 12, fontFamily: 'Poppins-Regular' }}>
                Total Expense
              </Text>
              <Text style={{ color: '#ffffff', fontSize: 32, fontFamily: 'Poppins-Bold' }}>
                ₱{formatNumber(totalExpense)}
              </Text>
            </View>
          </View>

          {/* Recent Expenses Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <Text style={{ color: '#ffffff', fontSize: 18, fontFamily: 'Poppins-SemiBold' }}>Recent Expenses</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/statistics')}>
              <Text style={{ color: '#90ee90', fontFamily: 'Poppins-Regular' }}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Expenses List */}
          <FlatList
            data={expenses.slice(0, 5)}
            renderItem={renderExpense}
            keyExtractor={(item) => item.id!}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', padding: 40 }}>
                <Icon name="inbox" size={50} color="#90ee90" />
                <Text style={{ color: '#c0e0c0', textAlign: 'center', fontFamily: 'Poppins-Regular', marginTop: 10 }}>
                  No expenses yet. Tap the + button to add one.
                </Text>
              </View>
            }
          />
          
          {/* Add bottom padding */}
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>

      {/* Delete Confirmation Modal - Dark Green */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
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
            padding: 25,
            borderRadius: 16,
            width: '85%',
            maxWidth: 300,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#4a8a6a',
          }}>
            <View style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: '#3a1a1a',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 15,
            }}>
              <Icon name="alert-triangle" size={30} color="#ff6b6b" />
            </View>
            
            <Text style={{ color: '#ffffff', fontSize: 20, fontFamily: 'Poppins-Bold', marginBottom: 8, textAlign: 'center' }}>
              Delete Expense
            </Text>
            
            <Text style={{ color: '#c0e0c0', fontSize: 14, fontFamily: 'Poppins-Regular', textAlign: 'center', marginBottom: 20 }}>
              Are you sure you want to delete this expense? This action cannot be undone.
            </Text>
            
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#3a6a4a',
                  padding: 12,
                  borderRadius: 10,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#4a8a6a',
                }}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={{ color: '#ffffff', fontFamily: 'Poppins-Regular', fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#ff6b6b',
                  padding: 12,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
                onPress={handleDeleteExpense}
              >
                <Text style={{ color: '#ffffff', fontFamily: 'Poppins-SemiBold', fontSize: 14 }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success/Error Modal - Dark Green */}
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
              backgroundColor: isError ? '#3a1a1a' : '#4ECDC4',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 12,
            }}>
              <Icon 
                name={isError ? 'alert-triangle' : 'check'} 
                size={28} 
                color={isError ? '#ff6b6b' : '#1a472a'} 
              />
            </View>
            
            <Text style={{ color: '#ffffff', fontSize: 18, fontFamily: 'Poppins-Bold', marginBottom: 6, textAlign: 'center' }}>
              {isError ? 'Error' : 'Success!'}
            </Text>
            
            <Text style={{ color: '#c0e0c0', fontSize: 13, fontFamily: 'Poppins-Regular', textAlign: 'center', marginBottom: 15 }}>
              {successMessage}
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}