import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, SafeAreaView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { addCategory, Category, deleteCategory, getCategories, updateCategory } from '../../../store/expenses';

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const cats = await getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
      showErrorAlert('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  };

  const showSuccessAlert = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
    }, 2000);
  };

  const showErrorAlert = (message: string) => {
    Alert.alert('Error', message, [{ text: 'OK' }], { userInterfaceStyle: 'dark' });
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      showErrorAlert('Please enter a category name');
      return;
    }

    const result = await addCategory(newCategory.trim());
    if (result.success) {
      setNewCategory('');
      setShowAddModal(false);
      loadCategories();
      showSuccessAlert('Category added successfully');
    } else {
      showErrorAlert(result.error);
    }
  };

  const handleEditCategory = async () => {
    if (!editName.trim()) {
      showErrorAlert('Please enter a category name');
      return;
    }

    if (editingCategory) {
      const result = await updateCategory(editingCategory.id!, editName.trim());
      if (result.success) {
        setShowEditModal(false);
        setEditingCategory(null);
        setEditName('');
        loadCategories();
        showSuccessAlert('Category updated successfully');
      } else {
        showErrorAlert(result.error);
      }
    }
  };

  const handleDeleteCategory = async () => {
    if (categoryToDelete) {
      const result = await deleteCategory(categoryToDelete.id!);
      if (result.success) {
        setShowDeleteModal(false);
        setCategoryToDelete(null);
        loadCategories();
        showSuccessAlert('Category deleted successfully');
      } else {
        showErrorAlert(result.error);
      }
    }
  };

  const openDeleteModal = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setEditName(category.name);
    setShowEditModal(true);
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <View style={{
      backgroundColor: '#2a5a3a',
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <Text style={{ color: '#ffffff', fontSize: 16, fontFamily: 'Poppins-Regular', flex: 1 }}>
        {item.name}
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity 
          onPress={() => openEditModal(item)}
          style={{
            padding: 8,
            borderRadius: 8,
            backgroundColor: '#3a6a4a'
          }}
        >
          <Icon name="edit-2" size={18} color="#90ee90" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => openDeleteModal(item)}
          style={{
            padding: 8,
            borderRadius: 8,
            backgroundColor: '#3a6a4a'
          }}
        >
          <Icon name="trash-2" size={18} color="#ff6b6b" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a472a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#90ee90" />
        <Text style={{ color: '#c0e0c0', marginTop: 10, fontFamily: 'Poppins-Regular' }}>Loading categories...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a472a' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1a472a" />
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* Header with Title and Add Button */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 35, marginBottom: 20 }}>
          <Text style={{ color: '#ffffff', fontSize: 28, fontFamily: 'Poppins-Bold' }}>
            Categories
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#90ee90',
              padding: 10,
              borderRadius: 25,
              width: 44,
              height: 44,
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onPress={() => setShowAddModal(true)}
          >
            <Icon name="plus" size={24} color="#1a472a" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id!}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#90ee90"
              colors={['#90ee90']}
            />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', padding: 40 }}>
              <Icon name="grid" size={50} color="#90ee90" />
              <Text style={{ color: '#c0e0c0', textAlign: 'center', fontFamily: 'Poppins-Regular', marginTop: 10 }}>
                No categories yet. Tap the + button to add one.
              </Text>
            </View>
          }
        />

        {/* Add Category Modal - Minimal Size */}
        <Modal
          visible={showAddModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20
          }}>
            <View style={{
              backgroundColor: '#1a472a',
              padding: 20,
              borderRadius: 16,
              width: '90%',
              maxWidth: 320,
              borderWidth: 1,
              borderColor: '#4a8a6a',
            }}>
              <View style={{ alignItems: 'center', marginBottom: 15 }}>
                <View style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: '#2a5a3a',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 8
                }}>
                  <Icon name="plus" size={24} color="#90ee90" />
                </View>
                <Text style={{ color: '#ffffff', fontSize: 18, fontFamily: 'Poppins-Bold' }}>
                  Add Category
                </Text>
              </View>

              <TextInput
                style={{
                  backgroundColor: '#2a5a3a',
                  padding: 12,
                  borderRadius: 10,
                  color: '#ffffff',
                  marginBottom: 15,
                  fontFamily: 'Poppins-Regular',
                  fontSize: 14,
                  borderWidth: 1,
                  borderColor: '#4a8a6a',
                }}
                placeholder="Category name"
                placeholderTextColor="#90ee90"
                value={newCategory}
                onChangeText={setNewCategory}
                autoFocus
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#3a6a4a',
                    padding: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={{ color: '#ffffff', fontFamily: 'Poppins-Regular', fontSize: 14 }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#90ee90',
                    padding: 10,
                    borderRadius: 10,
                    alignItems: 'center'
                  }}
                  onPress={handleAddCategory}
                >
                  <Text style={{ color: '#1a472a', fontFamily: 'Poppins-SemiBold', fontSize: 14 }}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Category Modal - Minimal Size */}
        <Modal
          visible={showEditModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20
          }}>
            <View style={{
              backgroundColor: '#1a472a',
              padding: 20,
              borderRadius: 16,
              width: '90%',
              maxWidth: 320,
              borderWidth: 1,
              borderColor: '#4a8a6a',
            }}>
              <View style={{ alignItems: 'center', marginBottom: 15 }}>
                <View style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: '#2a5a3a',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 8
                }}>
                  <Icon name="edit-2" size={24} color="#90ee90" />
                </View>
                <Text style={{ color: '#ffffff', fontSize: 18, fontFamily: 'Poppins-Bold' }}>
                  Edit Category
                </Text>
              </View>

              <TextInput
                style={{
                  backgroundColor: '#2a5a3a',
                  padding: 12,
                  borderRadius: 10,
                  color: '#ffffff',
                  marginBottom: 15,
                  fontFamily: 'Poppins-Regular',
                  fontSize: 14,
                  borderWidth: 1,
                  borderColor: '#4a8a6a',
                }}
                placeholder="Category name"
                placeholderTextColor="#90ee90"
                value={editName}
                onChangeText={setEditName}
                autoFocus
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#3a6a4a',
                    padding: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={{ color: '#ffffff', fontFamily: 'Poppins-Regular', fontSize: 14 }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#90ee90',
                    padding: 10,
                    borderRadius: 10,
                    alignItems: 'center'
                  }}
                  onPress={handleEditCategory}
                >
                  <Text style={{ color: '#1a472a', fontFamily: 'Poppins-SemiBold', fontSize: 14 }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Category Modal - Dark Green Minimal Size */}
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
            padding: 20
          }}>
            <View style={{
              backgroundColor: '#1a472a',
              padding: 20,
              borderRadius: 16,
              width: '90%',
              maxWidth: 320,
              borderWidth: 1,
              borderColor: '#4a8a6a',
              alignItems: 'center'
            }}>
              <View style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: '#3a1a1a',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12
              }}>
                <Icon name="alert-triangle" size={28} color="#ff6b6b" />
              </View>
              
              <Text style={{ color: '#ffffff', fontSize: 18, fontFamily: 'Poppins-Bold', marginBottom: 8, textAlign: 'center' }}>
                Delete Category
              </Text>
              
              <Text style={{ color: '#c0e0c0', fontSize: 13, fontFamily: 'Poppins-Regular', textAlign: 'center', marginBottom: 20 }}>
                Are you sure you want to delete "{categoryToDelete?.name}"?
              </Text>
              
              <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#3a6a4a',
                    padding: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowDeleteModal(false)}
                >
                  <Text style={{ color: '#ffffff', fontFamily: 'Poppins-Regular', fontSize: 14 }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#ff6b6b',
                    padding: 10,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={handleDeleteCategory}
                >
                  <Text style={{ color: '#ffffff', fontFamily: 'Poppins-SemiBold', fontSize: 14 }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Success Modal - Minimal Size */}
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
              width: '90%',
              maxWidth: 320,
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
                Success!
              </Text>
              
              <Text style={{ color: '#c0e0c0', fontSize: 13, fontFamily: 'Poppins-Regular', textAlign: 'center', marginBottom: 15 }}>
                {successMessage}
              </Text>
              
              <TouchableOpacity
                style={{
                  backgroundColor: '#90ee90',
                  padding: 10,
                  borderRadius: 10,
                  width: '100%',
                  alignItems: 'center',
                }}
                onPress={() => setShowSuccessModal(false)}
              >
                <Text style={{ color: '#1a472a', fontFamily: 'Poppins-SemiBold', fontSize: 14 }}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}