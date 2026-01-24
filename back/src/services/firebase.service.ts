import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

let isInitialized = false;

export const initializeFirebase = () => {
  if (isInitialized) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('Firebase credentials not found in environment variables. WinterMate stats will be unavailable.');
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    isInitialized = true;
    console.log('Firebase Admin initialized successfully.');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
};

export const getWinterMateStats = async (startDate: Date, endDate: Date, previousStartDate: Date, previousEndDate: Date) => {
  if (!isInitialized) {
    initializeFirebase();
    if (!isInitialized) {
      return { count: 0, trend: 0, chartData: [] };
    }
  }

  try {
    const db = getFirestore();
    const usersRef = db.collection('users');

    // We fetch all users because filtering by date on the client side might be safer 
    // if the index is not set up or if the date format varies.
    // However, for performance, we should ideally use queries.
    // Given the user's snippet, they fetched all. Let's try to query by date if possible, 
    // but to be safe and match their logic, we'll fetch and filter for now, 
    // or at least filter by a reasonable cutoff if the collection is huge.
    // For now, let's fetch all users created after the earliest date we care about (previousStartDate).
    
    // Note: Firestore queries require composite indexes for multiple fields or complex ordering.
    // Simple range queries on one field are fine.
    
    // Let's fetch everything for now to ensure we get all data points for the chart
    // Optimisation: If we only need stats for the period, we can filter.
    // But for the chart, we might need cumulative data? 
    // The user request asked for "new users" matrix.
    // "let the number of creators and the curve which goes with and that follows the evolution of the number of creators on the platform"
    // So for WinterMate users, we probably want the same: Total users and their evolution.
    
    // If we want TOTAL users, we need to count everyone up to endDate.
    // If we want NEW users in the period, we filter between startDate and endDate.
    
    // The previous implementation for creators showed "Creators Count" (Total) and "Platform Creators Trend" (Growth).
    // So we should probably do the same for WinterMate users.
    
    const snapshot = await usersRef.get();
    
    let totalUsersUpToEndDate = 0;
    let totalUsersUpToPreviousEndDate = 0;
    
    const chartDataMap = new Map<string, number>();
    
    // Helper to format date key matching the dashboard controller
    const formatDateKey = (date: Date): string => {
       return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    snapshot.forEach(doc => {
      const data = doc.data();
      let createdAt: Date | null = null;

      if (data.createdAt) {
        if (typeof data.createdAt.toDate === 'function') {
          createdAt = data.createdAt.toDate();
        } else if (data.createdAt instanceof Date) {
          createdAt = data.createdAt;
        } else if (typeof data.createdAt === 'string' || typeof data.createdAt === 'number') {
            createdAt = new Date(data.createdAt);
        }
      }

      if (createdAt) {
        if (createdAt <= endDate) {
          totalUsersUpToEndDate++;
        }
        if (createdAt <= previousEndDate) {
          totalUsersUpToPreviousEndDate++;
        }
        
        // For chart data (daily accumulation)
        // We only care about dates within the requested range for the chart?
        // Or do we want the cumulative count at each day?
        // The brand-stats controller calculates cumulative for creators.
        // Let's prepare data for the controller to use.
        // Actually, the controller iterates over days and calculates cumulative.
        // We can just return all user creation dates and let the controller do the heavy lifting / mapping?
        // Or we can return the pre-calculated stats and a map of dates.
      }
    });

    // Calculate trend
    let trend = 0;
    if (totalUsersUpToPreviousEndDate > 0) {
      trend = Math.round(((totalUsersUpToEndDate - totalUsersUpToPreviousEndDate) / totalUsersUpToPreviousEndDate) * 100);
    } else if (totalUsersUpToEndDate > 0) {
      trend = 100;
    }

    // Return the raw creation dates so the controller can map them to the chart points easily
    // This avoids duplicating the date-range logic (day/month granularity) here.
    const creationDates = snapshot.docs
        .map(doc => {
            const data = doc.data();
            if (data.createdAt && typeof data.createdAt.toDate === 'function') return data.createdAt.toDate();
            if (data.createdAt instanceof Date) return data.createdAt;
            if (data.createdAt) return new Date(data.createdAt);
            return null;
        })
        .filter((d): d is Date => d !== null)
        .sort((a, b) => a.getTime() - b.getTime());

    return {
      count: totalUsersUpToEndDate,
      trend,
      creationDates
    };

  } catch (error) {
    console.error('Error fetching WinterMate stats:', error);
    return { count: 0, trend: 0, creationDates: [] };
  }
};
