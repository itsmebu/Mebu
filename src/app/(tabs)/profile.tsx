import { useRouter } from 'expo-router';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, RefreshControl, SafeAreaView, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { db } from '../../../config/firebase';
import { useAuth } from '../../hooks/useAuth';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, userProfile, logout, refreshUserProfile } = useAuth();
  
  // Refresh State
  const [refreshing, setRefreshing] = useState(false);
  
  // Edit Username States
  const [showEditUsernameModal, setShowEditUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [updatingUsername, setUpdatingUsername] = useState(false);
  
  // Change Password States
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  
  // Success/Error Modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isError, setIsError] = useState(false);
  
  // About Modal
  const [showAboutModal, setShowAboutModal] = useState(false);
  
  // Logout Modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshUserProfile();
    setRefreshing(false);
  }, [refreshUserProfile]);

  const showModalMessage = (message: string, error: boolean = false) => {
    setSuccessMessage(message);
    setIsError(error);
    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
    }, 2000);
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    const result = await logout();
    if (result.success) {
      router.replace('/(auth)/login');
    } else {
      showModalMessage(result.error, true);
    }
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      showModalMessage('Please enter a username', true);
      return;
    }

    if (newUsername.length < 3) {
      showModalMessage('Username must be at least 3 characters', true);
      return;
    }

    const usernameRegex = /^[A-Za-z0-9_]{3,20}$/;
    if (!usernameRegex.test(newUsername)) {
      showModalMessage('Username can only contain letters, numbers, and underscore', true);
      return;
    }

    setUpdatingUsername(true);
    try {
      const oldUsername = userProfile?.username;
      const userId = user!.uid;
      const newUsernameLower = newUsername.toLowerCase();
      
      // Check if new username already exists (and it's not the current user)
      const existingUsernameDoc = await getDoc(doc(db, 'usernames', newUsernameLower));
      if (existingUsernameDoc.exists() && oldUsername !== newUsernameLower) {
        showModalMessage('Username already taken. Please choose another one.', true);
        setUpdatingUsername(false);
        return;
      }
      
      // Update users collection
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        username: newUsernameLower
      });
      
      // Update usernames collection (delete old, add new)
      if (oldUsername && oldUsername !== newUsernameLower) {
        const oldUsernameRef = doc(db, 'usernames', oldUsername.toLowerCase());
        const oldDoc = await getDoc(oldUsernameRef);
        if (oldDoc.exists()) {
          await deleteDoc(oldUsernameRef);
        }
      }
      
      // Create new username mapping
      await setDoc(doc(db, 'usernames', newUsernameLower), {
        userId: userId,
        username: newUsernameLower,
        createdAt: new Date(),
      });
      
      showModalMessage('Username updated successfully');
      setShowEditUsernameModal(false);
      setNewUsername('');
      await refreshUserProfile();
    } catch (error: any) {
      console.error('Update username error:', error);
      if (error.code === 'permission-denied') {
        showModalMessage('Permission denied. Please check your Firestore rules.', true);
      } else {
        showModalMessage(error.message || 'Failed to update username', true);
      }
    } finally {
      setUpdatingUsername(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showModalMessage('Please fill in all fields', true);
      return;
    }

    if (newPassword.length < 8) {
      showModalMessage('New password must be at least 8 characters', true);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showModalMessage('New passwords do not match', true);
      return;
    }

    setUpdatingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user!.email!, currentPassword);
      await reauthenticateWithCredential(user!, credential);
      await updatePassword(user!, newPassword);
      
      showModalMessage('Password changed successfully');
      setShowChangePasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        showModalMessage('Current password is incorrect', true);
      } else {
        showModalMessage(error.message, true);
      }
    } finally {
      setUpdatingPassword(false);
    }
  };

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

  const MenuItem = ({ icon, title, subtitle, onPress, showArrow = true, danger = false }: any) => (
    <TouchableOpacity 
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#2a5a3a'
      }}
    >
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2a5a3a',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
      }}>
        <Icon name={icon} size={20} color={danger ? '#ff6b6b' : '#90ee90'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: danger ? '#ff6b6b' : '#ffffff', fontSize: 16, fontFamily: 'Poppins-SemiBold' }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ color: '#c0e0c0', fontSize: 12, fontFamily: 'Poppins-Regular', marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {showArrow && (
        <Icon name="chevron-right" size={20} color={danger ? '#ff6b6b' : '#90ee90'} />
      )}
    </TouchableOpacity>
  );

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
        <View style={{ padding: 20, paddingTop: 30 }}>
          {/* Profile Header */}
          <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 30 }}>
            <View style={{
              width: 100,
              height: 100,
              backgroundColor: '#2a5a3a',
              borderRadius: 50,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 15
            }}>
              <Icon name="user" size={50} color="#90ee90" />
            </View>
            <Text style={{ color: '#ffffff', fontSize: 28, fontFamily: 'Poppins-Bold' }}>
              @{getDisplayName()}
            </Text>
            <Text style={{ color: '#90ee90', fontSize: 14, fontFamily: 'Poppins-Regular', marginTop: 5 }}>
              {user?.email}
            </Text>
            <TouchableOpacity 
              onPress={() => setShowEditUsernameModal(true)}
              style={{ marginTop: 10 }}
            >
              <Text style={{ color: '#90ee90', fontSize: 12, fontFamily: 'Poppins-Regular' }}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>

          {/* Account Information Section */}
          <Text style={{ color: '#90ee90', fontSize: 14, fontFamily: 'Poppins-SemiBold', marginBottom: 10 }}>
            Account Information
          </Text>
          <View style={{
            backgroundColor: '#1a472a',
            borderRadius: 15,
            marginBottom: 25,
            paddingHorizontal: 15,
            borderWidth: 1,
            borderColor: '#2a5a3a'
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 15,
              borderBottomWidth: 1,
              borderBottomColor: '#2a5a3a'
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#2a5a3a',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 15
              }}>
                <Icon name="user" size={20} color="#90ee90" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#ffffff', fontSize: 14, fontFamily: 'Poppins-Regular' }}>Username</Text>
                <Text style={{ color: '#90ee90', fontSize: 16, fontFamily: 'Poppins-SemiBold', marginTop: 2 }}>
                  @{getDisplayName()}
                </Text>
              </View>
            </View>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 15,
              borderBottomWidth: 1,
              borderBottomColor: '#2a5a3a'
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#2a5a3a',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 15
              }}>
                <Icon name="mail" size={20} color="#90ee90" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#ffffff', fontSize: 14, fontFamily: 'Poppins-Regular' }}>Email</Text>
                <Text style={{ color: '#90ee90', fontSize: 14, fontFamily: 'Poppins-Regular', marginTop: 2 }}>
                  {user?.email}
                </Text>
              </View>
            </View>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 15
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#2a5a3a',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 15
              }}>
                <Icon name="check-circle" size={20} color={user?.emailVerified ? '#4ECDC4' : '#ff6b6b'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#ffffff', fontSize: 14, fontFamily: 'Poppins-Regular' }}>Email Verification</Text>
                <Text style={{ color: user?.emailVerified ? '#4ECDC4' : '#ff6b6b', fontSize: 14, fontFamily: 'Poppins-SemiBold', marginTop: 2 }}>
                  {user?.emailVerified ? 'Verified' : 'Not Verified'}
                </Text>
              </View>
            </View>
          </View>

          {/* Account Settings Section */}
          <Text style={{ color: '#90ee90', fontSize: 14, fontFamily: 'Poppins-SemiBold', marginBottom: 10 }}>
            Account Settings
          </Text>
          <View style={{
            backgroundColor: '#1a472a',
            borderRadius: 15,
            marginBottom: 25,
            paddingHorizontal: 15,
            borderWidth: 1,
            borderColor: '#2a5a3a'
          }}>
            <MenuItem 
              icon="lock" 
              title="Change Password" 
              subtitle="Update your password"
              onPress={() => setShowChangePasswordModal(true)}
            />
          </View>

          {/* About Section */}
          <Text style={{ color: '#90ee90', fontSize: 14, fontFamily: 'Poppins-SemiBold', marginBottom: 10 }}>
            About
          </Text>
          <View style={{
            backgroundColor: '#1a472a',
            borderRadius: 15,
            marginBottom: 25,
            paddingHorizontal: 15,
            borderWidth: 1,
            borderColor: '#2a5a3a'
          }}>
            <MenuItem 
              icon="info" 
              title="About MEBU" 
              subtitle="Version 1.0.0"
              onPress={() => setShowAboutModal(true)}
            />
          </View>

          {/* Logout Button */}
          <MenuItem 
            icon="log-out" 
            title="Logout" 
            showArrow={false}
            danger={true}
            onPress={() => setShowLogoutModal(true)}
          />
        </View>
      </ScrollView>

      {/* Success/Error Modal */}
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

      {/* Edit Username Modal */}
      <Modal
        visible={showEditUsernameModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditUsernameModal(false)}
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
            borderRadius: 15,
            width: '100%',
            borderWidth: 1,
            borderColor: '#4a8a6a'
          }}>
            <Text style={{ color: '#ffffff', fontSize: 20, fontFamily: 'Poppins-Bold', marginBottom: 15 }}>
              Edit Username
            </Text>
            <TextInput
              style={{
                backgroundColor: '#2a5a3a',
                padding: 15,
                borderRadius: 10,
                color: '#ffffff',
                marginBottom: 15,
                fontFamily: 'Poppins-Regular'
              }}
              placeholder="New username"
              placeholderTextColor="#90ee90"
              value={newUsername}
              onChangeText={setNewUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={{ color: '#c0e0c0', fontSize: 10, marginBottom: 15, fontFamily: 'Poppins-Regular' }}>
              Letters, numbers, underscore only (3-20 characters)
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#3a6a4a',
                  padding: 12,
                  borderRadius: 10,
                  alignItems: 'center'
                }}
                onPress={() => setShowEditUsernameModal(false)}
              >
                <Text style={{ color: '#ffffff', fontFamily: 'Poppins-Regular' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#90ee90',
                  padding: 12,
                  borderRadius: 10,
                  alignItems: 'center'
                }}
                onPress={handleUpdateUsername}
                disabled={updatingUsername}
              >
                {updatingUsername ? (
                  <ActivityIndicator color="#1a472a" />
                ) : (
                  <Text style={{ color: '#1a472a', fontFamily: 'Poppins-SemiBold' }}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowChangePasswordModal(false)}
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
            borderRadius: 15,
            width: '100%',
            borderWidth: 1,
            borderColor: '#4a8a6a'
          }}>
            <Text style={{ color: '#ffffff', fontSize: 20, fontFamily: 'Poppins-Bold', marginBottom: 15 }}>
              Change Password
            </Text>
            
            <Text style={{ color: '#90ee90', marginBottom: 5, fontFamily: 'Poppins-Regular', fontSize: 12 }}>
              Current Password
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a5a3a', borderRadius: 10, marginBottom: 15 }}>
              <TextInput
                style={{ flex: 1, padding: 15, color: '#ffffff', fontFamily: 'Poppins-Regular' }}
                placeholder="Enter current password"
                placeholderTextColor="#90ee90"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={{ padding: 15 }}>
                <Icon name={showCurrentPassword ? 'eye-off' : 'eye'} size={20} color="#90ee90" />
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#90ee90', marginBottom: 5, fontFamily: 'Poppins-Regular', fontSize: 12 }}>
              New Password (Min. 8 characters)
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a5a3a', borderRadius: 10, marginBottom: 15 }}>
              <TextInput
                style={{ flex: 1, padding: 15, color: '#ffffff', fontFamily: 'Poppins-Regular' }}
                placeholder="Enter new password"
                placeholderTextColor="#90ee90"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={{ padding: 15 }}>
                <Icon name={showNewPassword ? 'eye-off' : 'eye'} size={20} color="#90ee90" />
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#90ee90', marginBottom: 5, fontFamily: 'Poppins-Regular', fontSize: 12 }}>
              Confirm New Password
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a5a3a', borderRadius: 10, marginBottom: 20 }}>
              <TextInput
                style={{ flex: 1, padding: 15, color: '#ffffff', fontFamily: 'Poppins-Regular' }}
                placeholder="Confirm new password"
                placeholderTextColor="#90ee90"
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: 15 }}>
                <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#90ee90" />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#3a6a4a',
                  padding: 12,
                  borderRadius: 10,
                  alignItems: 'center'
                }}
                onPress={() => setShowChangePasswordModal(false)}
              >
                <Text style={{ color: '#ffffff', fontFamily: 'Poppins-Regular' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#90ee90',
                  padding: 12,
                  borderRadius: 10,
                  alignItems: 'center'
                }}
                onPress={handleChangePassword}
                disabled={updatingPassword}
              >
                {updatingPassword ? (
                  <ActivityIndicator color="#1a472a" />
                ) : (
                  <Text style={{ color: '#1a472a', fontFamily: 'Poppins-SemiBold' }}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* About Modal */}
      <Modal
        visible={showAboutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAboutModal(false)}
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
            padding: 25,
            borderRadius: 15,
            width: '100%',
            borderWidth: 1,
            borderColor: '#4a8a6a',
            alignItems: 'center'
          }}>
            <View style={{
              width: 80,
              height: 80,
              backgroundColor: '#2a5a3a',
              borderRadius: 40,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20
            }}>
              <Icon name="trending-up" size={40} color="#90ee90" />
            </View>
            <Text style={{ color: '#ffffff', fontSize: 28, fontFamily: 'Poppins-Bold', marginBottom: 5 }}>
              MEBU
            </Text>
            <Text style={{ color: '#90ee90', fontSize: 14, fontFamily: 'Poppins-Regular', marginBottom: 20 }}>
              Expense Tracker
            </Text>
            <Text style={{ color: '#c0e0c0', fontSize: 14, fontFamily: 'Poppins-Regular', textAlign: 'center', marginBottom: 10 }}>
              Version 1.0.0
            </Text>
            <Text style={{ color: '#c0e0c0', fontSize: 12, fontFamily: 'Poppins-Regular', textAlign: 'center', marginBottom: 20 }}>
              2026 MEBU | Developed by JP-Parilla 
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#90ee90',
                padding: 12,
                borderRadius: 10,
                width: '100%',
                alignItems: 'center'
              }}
              onPress={() => setShowAboutModal(false)}
            >
              <Text style={{ color: '#1a472a', fontFamily: 'Poppins-SemiBold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Logout Modal - Minimal Size */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
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
            width: '80%',
            maxWidth: 280,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#4a8a6a',
          }}>
            <View style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: '#2a5a3a',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 12
            }}>
              <Icon name="log-out" size={28} color="#ff6b6b" />
            </View>
            <Text style={{ color: '#ffffff', fontSize: 18, fontFamily: 'Poppins-Bold', marginBottom: 6, textAlign: 'center' }}>
              Logout
            </Text>
            <Text style={{ color: '#c0e0c0', fontSize: 12, fontFamily: 'Poppins-Regular', textAlign: 'center', marginBottom: 20 }}>
              Are you sure you want to logout?
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#3a6a4a',
                  padding: 10,
                  borderRadius: 10,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#4a8a6a',
                }}
                onPress={() => setShowLogoutModal(false)}
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
                onPress={handleLogout}
              >
                <Text style={{ color: '#ffffff', fontFamily: 'Poppins-SemiBold', fontSize: 14 }}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}