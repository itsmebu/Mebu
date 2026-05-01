import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, RefreshControl, SafeAreaView, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { addExpense, Category, getCategories } from '../../../store/expenses';

export default function AddExpenseScreen() {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(date.getMonth());
  const [selectedYear, setSelectedYear] = useState(date.getFullYear());
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate years (current year - 5 to current year + 5)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const cats = await getCategories();
      console.log('Loaded categories:', cats);
      setCategories(cats);
      if (cats.length > 0 && !category) {
        setCategory(cats[0].name);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(selectedYear, selectedMonth, day);
    setDate(newDate);
    setShowDatePicker(false);
  };

  const showSuccessAlert = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
      router.back();
    }, 1500);
  };

  const handleSave = async () => {
    if (!amount) {
      return;
    }

    if (!category) {
      return;
    }

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      return;
    }

    setLoading(true);

    const expenseData: any = {
      amount: expenseAmount,
      category: category,
      date: date,
    };
    
    if (note && note.trim().length > 0) {
      expenseData.note = note.trim();
    }

    const result = await addExpense(expenseData);

    if (result.success) {
      showSuccessAlert('Expense added successfully');
    } else {
      // Show error without Alert
      setSuccessMessage(result.error || 'Failed to add expense');
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000);
    }
    setLoading(false);
  };

  // Custom Calendar Modal
  const CustomDatePicker = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
    const today = new Date();
    
    const isToday = (day: number) => {
      return today.getDate() === day && 
             today.getMonth() === selectedMonth && 
             today.getFullYear() === selectedYear;
    };

    const isSelectedDate = (day: number) => {
      return date.getDate() === day && 
             date.getMonth() === selectedMonth && 
             date.getFullYear() === selectedYear;
    };

    const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    return (
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: '#1a472a',
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            padding: 20,
            maxHeight: '80%',
          }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              paddingBottom: 15,
              borderBottomWidth: 1,
              borderBottomColor: '#2a5a3a',
            }}>
              <Text style={{ color: '#ffffff', fontSize: 20, fontFamily: 'Poppins-Bold' }}>
                Select Date
              </Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Icon name="x" size={24} color="#90ee90" />
              </TouchableOpacity>
            </View>

            {/* Month and Year Selector */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <View style={{ 
                flex: 1, 
                backgroundColor: '#2a5a3a', 
                borderRadius: 10, 
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: '#4a8a6a',
              }}>
                <Picker
                  selectedValue={selectedMonth}
                  onValueChange={(itemValue) => setSelectedMonth(itemValue)}
                  dropdownIconColor="#90ee90"
                  style={{ 
                    color: '#ffffff', 
                    backgroundColor: '#2a5a3a', 
                    height: 50,
                  }}
                  mode="dropdown"
                  prompt="Select month"
                >
                  {months.map((month, index) => (
                    <Picker.Item 
                      key={index} 
                      label={month} 
                      value={index} 
                      color="#ffffff"
                      style={{
                        backgroundColor: '#2a5a3a',
                        color: '#ffffff',
                      }}
                    />
                  ))}
                </Picker>
              </View>
              <View style={{ 
                flex: 1, 
                backgroundColor: '#2a5a3a', 
                borderRadius: 10, 
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: '#4a8a6a',
              }}>
                <Picker
                  selectedValue={selectedYear}
                  onValueChange={(itemValue) => setSelectedYear(itemValue)}
                  dropdownIconColor="#90ee90"
                  style={{ 
                    color: '#ffffff', 
                    backgroundColor: '#2a5a3a', 
                    height: 50,
                  }}
                  mode="dropdown"
                  prompt="Select year"
                >
                  {years.map((year) => (
                    <Picker.Item 
                      key={year} 
                      label={year.toString()} 
                      value={year} 
                      color="#ffffff"
                      style={{
                        backgroundColor: '#2a5a3a',
                        color: '#ffffff',
                      }}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Week Days Header */}
            <View style={{ flexDirection: 'row', marginBottom: 10, paddingHorizontal: 5 }}>
              {weekDays.map((day, index) => (
                <View key={index} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ color: '#90ee90', fontSize: 11, fontFamily: 'Poppins-SemiBold' }}>
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar Days */}
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                  <View key={`empty-${index}`} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 5 }}>
                    <View style={{ flex: 1 }} />
                  </View>
                ))}
                
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const isCurrentDay = isToday(day);
                  const isSelected = isSelectedDate(day);
                  
                  return (
                    <TouchableOpacity
                      key={day}
                      style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 5 }}
                      onPress={() => handleDateSelect(day)}
                    >
                      <View style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: 25,
                        backgroundColor: isSelected ? '#90ee90' : 'transparent',
                        borderWidth: isCurrentDay && !isSelected ? 1 : 0,
                        borderColor: '#90ee90',
                      }}>
                        <Text style={{
                          color: isSelected ? '#1a472a' : '#ffffff',
                          fontSize: 16,
                          fontFamily: isSelected ? 'Poppins-Bold' : 'Poppins-Regular',
                        }}>
                          {day}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={{
                backgroundColor: '#2a5a3a',
                padding: 12,
                borderRadius: 10,
                alignItems: 'center',
                marginTop: 15,
                borderWidth: 1,
                borderColor: '#4a8a6a',
              }}
              onPress={() => {
                const today = new Date();
                setSelectedMonth(today.getMonth());
                setSelectedYear(today.getFullYear());
                setDate(today);
                setShowDatePicker(false);
              }}
            >
              <Text style={{ color: '#90ee90', fontFamily: 'Poppins-SemiBold' }}>Select Today</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a472a' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1a472a" />
      <ScrollView 
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#90ee90"
            colors={['#90ee90']}
          />
        }
      >
        <View style={{ padding: 20 }}>
          {/* Header */}
          <View style={{ marginTop: 20, marginBottom: 20 }}>
            <Text style={{ color: '#ffffff', fontSize: 28, fontFamily: 'Poppins-Bold' }}>
              Add Expense
            </Text>
          </View>

          {/* Amount Input */}
          <Text style={{ color: '#90ee90', marginBottom: 5, fontFamily: 'Poppins-Regular' }}>Amount *</Text>
          <TextInput
            style={{
              backgroundColor: '#2a5a3a',
              padding: 15,
              borderRadius: 10,
              color: '#ffffff',
              marginBottom: 15,
              fontFamily: 'Poppins-Regular',
              fontSize: 16
            }}
            placeholder="0.00"
            placeholderTextColor="#90ee90"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />

          {/* Category Picker */}
          <Text style={{ color: '#90ee90', marginBottom: 5, fontFamily: 'Poppins-Regular' }}>Category *</Text>
          <View style={{ 
            backgroundColor: '#2a5a3a', 
            borderRadius: 10, 
            marginBottom: 15, 
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: '#4a8a6a'
          }}>
            {loadingCategories ? (
              <View style={{ padding: 15, alignItems: 'center' }}>
                <ActivityIndicator color="#90ee90" />
                <Text style={{ color: '#c0e0c0', marginTop: 5, fontFamily: 'Poppins-Regular' }}>Loading categories...</Text>
              </View>
            ) : categories.length > 0 ? (
              <Picker
                selectedValue={category}
                onValueChange={(itemValue) => {
                  console.log('Selected category:', itemValue);
                  setCategory(itemValue);
                }}
                dropdownIconColor="#90ee90"
                style={{ 
                  color: '#ffffff',
                  backgroundColor: '#2a5a3a',
                  height: 50
                }}
                mode="dropdown"
                prompt="Select a category"
              >
                {categories.map((cat) => (
                  <Picker.Item 
                    key={cat.id || cat.name} 
                    label={cat.name} 
                    value={cat.name} 
                    color="#ffffff"
                    style={{
                      backgroundColor: '#2a5a3a',
                      color: '#ffffff',
                      fontFamily: 'Poppins-Regular'
                    }}
                  />
                ))}
              </Picker>
            ) : (
              <View style={{ padding: 15 }}>
                <Text style={{ color: '#c0e0c0', textAlign: 'center', fontFamily: 'Poppins-Regular' }}>
                  No categories available. Please add categories in Categories tab.
                </Text>
              </View>
            )}
          </View>

          {/* Date Picker */}
          <Text style={{ color: '#90ee90', marginBottom: 5, fontFamily: 'Poppins-Regular' }}>Date *</Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#2a5a3a',
              padding: 15,
              borderRadius: 10,
              marginBottom: 15,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#4a8a6a',
            }}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: '#ffffff', fontFamily: 'Poppins-Regular', fontSize: 16 }}>
              {date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            <Icon name="calendar" size={22} color="#90ee90" />
          </TouchableOpacity>

          {/* Note Input */}
          <Text style={{ color: '#90ee90', marginBottom: 5, fontFamily: 'Poppins-Regular' }}>Note (Optional)</Text>
          <TextInput
            style={{
              backgroundColor: '#2a5a3a',
              padding: 15,
              borderRadius: 10,
              color: '#ffffff',
              marginBottom: 20,
              fontFamily: 'Poppins-Regular',
              height: 100,
              textAlignVertical: 'top'
            }}
            placeholder="Add a note..."
            placeholderTextColor="#90ee90"
            value={note}
            onChangeText={setNote}
            multiline
          />

          {/* Save Button */}
          <TouchableOpacity
            style={{
              backgroundColor: '#90ee90',
              padding: 15,
              borderRadius: 10,
              alignItems: 'center',
              opacity: loading ? 0.7 : 1
            }}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#1a472a" />
            ) : (
              <Text style={{ color: '#1a472a', fontSize: 16, fontWeight: 'bold', fontFamily: 'Poppins-SemiBold' }}>
                Save Expense
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom Calendar Modal */}
      <CustomDatePicker />

      {/* Success Modal - Minimal Dark Green */}
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
              backgroundColor: successMessage.includes('failed') ? '#3a1a1a' : '#4ECDC4',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 12,
            }}>
              <Icon 
                name={successMessage.includes('failed') ? 'alert-triangle' : 'check'} 
                size={28} 
                color={successMessage.includes('failed') ? '#ff6b6b' : '#1a472a'} 
              />
            </View>
            
            <Text style={{ color: '#ffffff', fontSize: 18, fontFamily: 'Poppins-Bold', marginBottom: 6, textAlign: 'center' }}>
              {successMessage.includes('failed') ? 'Error' : 'Success!'}
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