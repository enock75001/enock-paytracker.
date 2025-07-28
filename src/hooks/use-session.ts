

'use client';

import { useState, useEffect, useCallback } from 'react';

interface SessionData {
  userType: 'admin' | 'manager' | 'employee' | 'owner' | null;
  adminName: string;
  managerName: string;
  employeeName: string;
  companyName: string;
  departmentName: string;
  userId: string | null;
  companyId: string | null;
  isOwner: boolean;
}

const initialSessionData: SessionData = {
  userType: null,
  adminName: '',
  managerName: '',
  employeeName: '',
  companyName: '',
  departmentName: '',
  userId: null,
  companyId: null,
  isOwner: false,
};

export function useSession() {
  const [sessionData, setSessionData] = useState<SessionData>(initialSessionData);
  const [isClient, setIsClient] = useState(false);

  const loadSession = useCallback(() => {
    // We must read all values from sessionStorage inside this callback
    const userType = sessionStorage.getItem('userType') as 'admin' | 'manager' | 'employee' | 'owner' | null;
    const adminId = sessionStorage.getItem('adminId');
    const managerId = sessionStorage.getItem('managerId');
    const employeeId = sessionStorage.getItem('employeeId');
    const ownerLoggedIn = sessionStorage.getItem('ownerLoggedIn') === 'true';
    
    // Determine userId based on what's available
    let userId = null;
    if (ownerLoggedIn) {
        userId = 'owner'; // Special static ID for the owner
    } else if (userType === 'admin') {
        userId = adminId;
    } else if (userType === 'manager') {
        userId = managerId;
    } else if (userType === 'employee') {
        userId = employeeId;
    }
    
    setSessionData({
      userType: ownerLoggedIn ? 'owner' : userType,
      adminName: sessionStorage.getItem('adminName') || '',
      companyName: sessionStorage.getItem('companyName') || '',
      departmentName: sessionStorage.getItem('departmentName') || '',
      managerName: sessionStorage.getItem('managerName') || '',
      employeeName: sessionStorage.getItem('employeeName') || '',
      userId,
      companyId: sessionStorage.getItem('companyId'),
      isOwner: ownerLoggedIn,
    });
  }, []);

  useEffect(() => {
    // This effect runs only once on the client-side
    setIsClient(true);
    loadSession();

    // Listen to storage changes to keep session in sync across tabs
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key && event.key.startsWith('genkit')) return; // Ignore genkit flow state changes
        loadSession();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };

  }, [loadSession]);

  return {
    sessionData,
    isLoggedIn: isClient && (!!sessionData.userId || sessionData.isOwner),
  };
}
