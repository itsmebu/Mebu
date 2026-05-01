import { db, auth } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  doc,
  updateDoc,
  Timestamp,
  orderBy,
  writeBatch
} from 'firebase/firestore';

export interface Expense {
  id?: string;
  amount: number;
  category: string;
  date: Date;
  note?: string;
  userId: string;
}

export interface Category {
  id?: string;
  name: string;
  userId: string;
}

// Add a new expense
export const addExpense = async (expense: Omit<Expense, 'userId'>) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('No user logged in');
    
    // Create expense data object without undefined values
    const expenseData: any = {
      amount: expense.amount,
      category: expense.category,
      date: Timestamp.fromDate(expense.date),
      userId: userId,
      createdAt: Timestamp.now()
    };
    
    // Only add note if it exists and is not empty
    if (expense.note && expense.note.trim().length > 0) {
      expenseData.note = expense.note.trim();
    }
    
    const docRef = await addDoc(collection(db, 'expenses'), expenseData);
    console.log('Expense added with ID:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Add expense error:', error);
    if (error.code === 'permission-denied') {
      return { success: false, error: 'Permission denied. Please check Firestore rules.' };
    }
    return { success: false, error: error.message };
  }
};

// Get all expenses for current user
export const getExpenses = async (): Promise<Expense[]> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.log('No user logged in');
      return [];
    }
    
    console.log('Fetching expenses for user:', userId);
    
    const q = query(
      collection(db, 'expenses'), 
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const expenses: Expense[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      expenses.push({
        id: doc.id,
        amount: data.amount,
        category: data.category,
        date: data.date.toDate(),
        note: data.note || '',
        userId: data.userId
      });
    });
    
    console.log(`Found ${expenses.length} expenses`);
    return expenses;
  } catch (error: any) {
    console.error('Get expenses error:', error);
    return [];
  }
};

// Delete an expense
export const deleteExpense = async (expenseId: string) => {
  try {
    await deleteDoc(doc(db, 'expenses', expenseId));
    return { success: true };
  } catch (error: any) {
    console.error('Delete expense error:', error);
    return { success: false, error: error.message };
  }
};

// Add a new category
export const addCategory = async (categoryName: string) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('No user logged in');
    
    // Check if category already exists
    const q = query(
      collection(db, 'categories'), 
      where('userId', '==', userId),
      where('name', '==', categoryName)
    );
    const existing = await getDocs(q);
    
    if (!existing.empty) {
      return { success: false, error: 'Category already exists' };
    }
    
    const docRef = await addDoc(collection(db, 'categories'), {
      name: categoryName,
      userId,
      createdAt: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Add category error:', error);
    return { success: false, error: error.message };
  }
};

// Get all categories for current user
export const getCategories = async (): Promise<Category[]> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.log('No user logged in');
      return [];
    }
    
    console.log('Fetching categories for user:', userId);
    
    const q = query(
      collection(db, 'categories'), 
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const categories: Category[] = [];
    
    querySnapshot.forEach((doc) => {
      categories.push({
        id: doc.id,
        name: doc.data().name,
        userId: doc.data().userId
      });
    });
    
    console.log(`Found ${categories.length} categories`);
    
    // If no categories exist, add default ones
    if (categories.length === 0) {
      console.log('No categories found, adding default ones...');
      const defaultCategories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other'];
      
      for (const cat of defaultCategories) {
        const categoryData = {
          name: cat,
          userId: userId,
          createdAt: Timestamp.now()
        };
        await addDoc(collection(db, 'categories'), categoryData);
        console.log(`Added category: ${cat}`);
      }
      
      // Return the newly created categories
      return await getCategories();
    }
    
    return categories;
  } catch (error: any) {
    console.error('Get categories error:', error);
    return [];
  }
};

// Update a category
export const updateCategory = async (categoryId: string, newName: string) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('No user logged in');
    
    // Check if category with new name already exists
    const existingQuery = query(
      collection(db, 'categories'),
      where('userId', '==', userId),
      where('name', '==', newName)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      const existingCategory = existingSnapshot.docs[0];
      if (existingCategory.id !== categoryId) {
        return { success: false, error: 'A category with this name already exists' };
      }
    }
    
    // Update the category name
    const categoryRef = doc(db, 'categories', categoryId);
    await updateDoc(categoryRef, {
      name: newName,
      updatedAt: Timestamp.now()
    });
    
    // Also update all expenses that use this category
    const expensesQuery = query(
      collection(db, 'expenses'),
      where('userId', '==', userId),
      where('category', '==', categoryId)
    );
    const expensesSnapshot = await getDocs(expensesQuery);
    
    const batch = writeBatch(db);
    expensesSnapshot.forEach((expenseDoc) => {
      const expenseRef = doc(db, 'expenses', expenseDoc.id);
      batch.update(expenseRef, { category: newName });
    });
    
    if (!expensesSnapshot.empty) {
      await batch.commit();
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Update category error:', error);
    return { success: false, error: error.message };
  }
};

// Delete a category
export const deleteCategory = async (categoryId: string) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('No user logged in');
    
    // Get the category name first
    const categoryRef = doc(db, 'categories', categoryId);
    const categoryDoc = await getDocs(query(collection(db, 'categories'), where('__name__', '==', categoryId)));
    
    // Check if category is being used in any expense
    const expensesQuery = query(
      collection(db, 'expenses'),
      where('userId', '==', userId),
      where('category', '==', categoryId)
    );
    const expensesSnapshot = await getDocs(expensesQuery);
    
    if (!expensesSnapshot.empty) {
      return { success: false, error: 'Cannot delete category that has expenses. Please delete or reassign expenses first.' };
    }
    
    await deleteDoc(doc(db, 'categories', categoryId));
    return { success: true };
  } catch (error: any) {
    console.error('Delete category error:', error);
    return { success: false, error: error.message };
  }
};

// Update an expense
export const updateExpense = async (expenseId: string, updates: Partial<Expense>) => {
  try {
    const expenseRef = doc(db, 'expenses', expenseId);
    await updateDoc(expenseRef, updates);
    return { success: true };
  } catch (error: any) {
    console.error('Update expense error:', error);
    return { success: false, error: error.message };
  }
};