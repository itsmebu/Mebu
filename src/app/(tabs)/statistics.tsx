import { Picker } from '@react-native-picker/picker';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Modal, RefreshControl, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Feather';
import { Expense, getExpenses } from '../../../store/expenses';

const { width } = Dimensions.get('window');

export default function StatisticsScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [dailySpending, setDailySpending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalSpending, setTotalSpending] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedMonthPicker, setSelectedMonthPicker] = useState(selectedDate.getMonth());
  const [selectedYearPicker, setSelectedYearPicker] = useState(selectedDate.getFullYear());
  const [isProcessing, setIsProcessing] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate years (current year - 5 to current year + 5)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    if (expenses.length > 0 || !loading) {
      processData();
    }
  }, [expenses, selectedDate]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const allExpenses = await getExpenses();
      console.log('Loaded expenses:', allExpenses.length);
      setExpenses(allExpenses);
      updateMonthLabel(selectedDate);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  };

  const updateMonthLabel = (date: Date) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    setSelectedMonth(`${monthNames[date.getMonth()]} ${date.getFullYear()}`);
  };

  const handleDateSelect = useCallback((day: number) => {
    const newDate = new Date(selectedYearPicker, selectedMonthPicker, day);
    setSelectedDate(newDate);
    updateMonthLabel(newDate);
    setShowDatePicker(false);
  }, [selectedMonthPicker, selectedYearPicker]);

  const handleMonthChange = useCallback((itemValue: number) => {
    setSelectedMonthPicker(itemValue);
    // Don't close modal, just update the picker
  }, []);

  const handleYearChange = useCallback((itemValue: number) => {
    setSelectedYearPicker(itemValue);
    // Don't close modal, just update the picker
  }, []);

  const handleApplyDate = useCallback(() => {
    // Keep the current day or adjust if the selected day doesn't exist in the new month
    const daysInMonth = new Date(selectedYearPicker, selectedMonthPicker + 1, 0).getDate();
    let newDay = selectedDate.getDate();
    if (newDay > daysInMonth) {
      newDay = daysInMonth;
    }
    const newDate = new Date(selectedYearPicker, selectedMonthPicker, newDay);
    setSelectedDate(newDate);
    updateMonthLabel(newDate);
    setShowDatePicker(false);
  }, [selectedMonthPicker, selectedYearPicker, selectedDate]);

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const processData = () => {
    if (!expenses.length) {
      setChartData([]);
      setDailySpending([]);
      setTotalSpending(0);
      return;
    }

    // Filter expenses for selected month and year
    const filtered = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === selectedDate.getMonth() && 
             expDate.getFullYear() === selectedDate.getFullYear();
    });

    // Calculate total spending
    const total = filtered.reduce((sum, exp) => sum + exp.amount, 0);
    setTotalSpending(total);

    // Process donut pie chart data by category
    const categoryMap = new Map();
    filtered.forEach(exp => {
      categoryMap.set(exp.category, (categoryMap.get(exp.category) || 0) + exp.amount);
    });

    // Vibrant colors - NO GREEN or DARK GREEN
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFEAA7', '#DDA0DD',
      '#98D8C8', '#F7D794', '#778BEB', '#E77F67', '#F3A683',
      '#F8A5C2', '#63CDDA', '#FDA7DF', '#ED4C67', '#6F1A51',
      '#EE5A24', '#0ABDE3', '#F9CA24', '#7ED6DF', '#C44569'
    ];
    let colorIndex = 0;
    
    const pieData = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount]) => ({
        name: name.length > 15 ? name.substring(0, 12) + '...' : name,
        amount: amount,
        color: colors[colorIndex++ % colors.length],
      }));

    setChartData(pieData);

    // Process daily spending for the selected month
    const dailyData = [];
    const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i);
      const dayExpenses = filtered.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getDate() === i;
      });
      
      const dayTotal = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      if (dayTotal > 0) {
        dailyData.push({
          day: i,
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          amount: dayTotal
        });
      }
    }
    
    dailyData.sort((a, b) => a.day - b.day);
    setDailySpending(dailyData);
  };

  // Donut Pie Chart Component
  const DonutPieChart = ({ data, size = 220, total }: { data: any[]; size?: number; total: number }) => {
    if (!data || data.length === 0) {
      return (
        <View style={{ height: size, justifyContent: 'center', alignItems: 'center' }}>
          <Icon name="pie-chart" size={50} color="#90ee90" />
          <Text style={{ color: '#c0e0c0', fontFamily: 'Poppins-Regular', marginTop: 10, textAlign: 'center' }}>
            No data for this month
          </Text>
        </View>
      );
    }

    const center = size / 2;
    const radius = size / 2.2;
    const holeRadius = radius / 1.6;
    
    // Calculate total for percentages
    const grandTotal = data.reduce((sum, item) => sum + item.amount, 0);
    let currentAngle = -90; // Start from top
    
    const segments = [];
    for (let i = 0; i < data.length; i++) {
      const percentage = (data[i].amount / grandTotal) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const pathData = `
        M ${center} ${center}
        L ${x1} ${y1}
        A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
        Z
      `;
      
      segments.push(
        <Path key={i} d={pathData} fill={data[i].color} stroke="#1a472a" strokeWidth="2" />
      );
      
      currentAngle = endAngle;
    }
    
    // Format total as "₱ 000.00" in a single line
    const formattedTotal = `₱ ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    return (
      <View style={{ alignItems: 'center' }}>
        <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
          {segments}
          {/* Hole in the center */}
          <Circle cx={center} cy={center} r={holeRadius} fill="#1a472a" />
        </Svg>
        
        {/* Text overlay - single line format */}
        <View style={{ position: 'absolute', top: center - 12, left: 0, right: 0, alignItems: 'center' }}>
          <Text style={{ color: '#ffffff', fontSize: 16, fontFamily: 'Poppins-Bold' }}>
            {formattedTotal}
          </Text>
          <Text style={{ color: '#90ee90', fontSize: 10, fontFamily: 'Poppins-Regular', marginTop: 4 }}>Total</Text>
        </View>
      </View>
    );
  };

  // Custom Calendar Modal - No Blinking
  const CustomDatePicker = () => {
    const daysInMonth = getDaysInMonth(selectedMonthPicker, selectedYearPicker);
    const firstDayOfMonth = new Date(selectedYearPicker, selectedMonthPicker, 1).getDay();
    const today = new Date();
    
    const isToday = (day: number) => {
      return today.getDate() === day && 
             today.getMonth() === selectedMonthPicker && 
             today.getFullYear() === selectedYearPicker;
    };

    const isSelectedDate = (day: number) => {
      return selectedDate.getDate() === day && 
             selectedDate.getMonth() === selectedMonthPicker && 
             selectedDate.getFullYear() === selectedYearPicker;
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
                Select Month & Year
              </Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Icon name="x" size={24} color="#90ee90" />
              </TouchableOpacity>
            </View>

            {/* Month and Year Selector - No blinking */}
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
                  selectedValue={selectedMonthPicker}
                  onValueChange={handleMonthChange}
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
                  selectedValue={selectedYearPicker}
                  onValueChange={handleYearChange}
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

            {/* Calendar Days - No blinking */}
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {/* Empty spaces for first week */}
                {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                  <View key={`empty-${index}`} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 5 }}>
                    <View style={{ flex: 1 }} />
                  </View>
                ))}
                
                {/* Days of the month */}
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

            {/* Apply and Today Buttons */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#2a5a3a',
                  padding: 12,
                  borderRadius: 10,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#4a8a6a',
                }}
                onPress={() => {
                  const today = new Date();
                  setSelectedMonthPicker(today.getMonth());
                  setSelectedYearPicker(today.getFullYear());
                }}
              >
                <Text style={{ color: '#90ee90', fontFamily: 'Poppins-SemiBold' }}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#90ee90',
                  padding: 12,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
                onPress={handleApplyDate}
              >
                <Text style={{ color: '#1a472a', fontFamily: 'Poppins-SemiBold' }}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a472a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#90ee90" />
        <Text style={{ color: '#c0e0c0', marginTop: 10, fontFamily: 'Poppins-Regular' }}>Loading statistics...</Text>
      </View>
    );
  }

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
          {/* Header with Calendar Only */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 20 }}>
            <Text style={{ color: '#ffffff', fontSize: 28, fontFamily: 'Poppins-Bold' }}>
              Statistics
            </Text>
            <TouchableOpacity 
              onPress={() => {
                setSelectedMonthPicker(selectedDate.getMonth());
                setSelectedYearPicker(selectedDate.getFullYear());
                setShowDatePicker(true);
              }}
              style={{
                backgroundColor: '#2a5a3a',
                padding: 8,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#4a8a6a'
              }}
            >
              <Icon name="calendar" size={22} color="#90ee90" />
            </TouchableOpacity>
          </View>

          {/* Month Display */}
          <View style={{
            backgroundColor: '#2a5a3a',
            padding: 15,
            borderRadius: 10,
            marginBottom: 20,
            alignItems: 'center'
          }}>
            <Text style={{ color: '#90ee90', fontSize: 14, fontFamily: 'Poppins-Regular' }}>
              Showing Statistics For
            </Text>
            <Text style={{ color: '#ffffff', fontSize: 18, fontFamily: 'Poppins-SemiBold', marginTop: 5 }}>
              {selectedMonth || 'Select a month'}
            </Text>
          </View>

          {/* Donut Pie Chart Section */}
          <View style={{
            backgroundColor: '#2a5a3a',
            padding: 20,
            borderRadius: 15,
            marginBottom: 20,
            alignItems: 'center',
            minHeight: 320
          }}>
            <Text style={{ color: '#90ee90', fontSize: 16, fontFamily: 'Poppins-SemiBold', marginBottom: 20 }}>
              Spending by Category
            </Text>
            
            <DonutPieChart data={chartData} size={220} total={totalSpending} />
            
            {/* Legend */}
            {chartData.length > 0 && (
              <View style={{ marginTop: 20, width: '100%' }}>
                {chartData.map((item, index) => (
                  <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <View style={{ width: 12, height: 12, backgroundColor: item.color, marginRight: 12, borderRadius: 4 }} />
                    <Text style={{ color: '#ffffff', flex: 1, fontFamily: 'Poppins-Regular', fontSize: 13 }}>
                      {item.name}
                    </Text>
                    <Text style={{ color: '#90ee90', fontFamily: 'Poppins-SemiBold', fontSize: 13 }}>
                      ₱{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Daily Spending Section */}
          <View style={{
            backgroundColor: '#2a5a3a',
            padding: 20,
            borderRadius: 15,
            marginBottom: 30
          }}>
            <Text style={{ color: '#90ee90', fontSize: 16, fontFamily: 'Poppins-SemiBold', marginBottom: 15 }}>
              Daily Spending
            </Text>
            {dailySpending.length > 0 ? (
              dailySpending.map((day, index) => {
                const maxAmount = Math.max(...dailySpending.map(d => d.amount), 1);
                const percentage = (day.amount / maxAmount) * 100;
                return (
                  <View key={index} style={{ marginBottom: 15 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                      <Text style={{ color: '#ffffff', fontFamily: 'Poppins-Regular' }}>
                        Day {day.day} ({day.dayName})
                      </Text>
                      <Text style={{ color: '#90ee90', fontFamily: 'Poppins-SemiBold' }}>
                        ₱{day.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                    </View>
                    <View style={{ height: 8, backgroundColor: '#3a6a4a', borderRadius: 4, overflow: 'hidden' }}>
                      <View style={{
                        height: '100%',
                        width: `${percentage}%`,
                        backgroundColor: '#90ee90',
                        borderRadius: 4
                      }} />
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={{ alignItems: 'center', padding: 30 }}>
                <Icon name="bar-chart-2" size={50} color="#90ee90" />
                <Text style={{ color: '#c0e0c0', textAlign: 'center', fontFamily: 'Poppins-Regular', marginTop: 10 }}>
                  No daily spending data for {selectedMonth}
                </Text>
              </View>
            )}
          </View>

          {/* No Expenses Message */}
          {expenses.length === 0 && (
            <View style={{
              backgroundColor: '#2a5a3a',
              padding: 30,
              borderRadius: 15,
              alignItems: 'center',
              marginTop: 10
            }}>
              <Icon name="credit-card" size={50} color="#90ee90" />
              <Text style={{ color: '#ffffff', fontSize: 18, fontFamily: 'Poppins-SemiBold', marginTop: 15, textAlign: 'center' }}>
                No Expenses Yet
              </Text>
              <Text style={{ color: '#c0e0c0', textAlign: 'center', fontFamily: 'Poppins-Regular', marginTop: 10 }}>
                Start tracking your expenses by tapping the + button
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Custom Calendar Modal - No Blinking */}
      <CustomDatePicker />
    </SafeAreaView>
  );
}