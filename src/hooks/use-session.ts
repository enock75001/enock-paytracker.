
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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const loadSession = useCallback(() => {
    if (typeof window !== 'undefined') {
        const userType = sessionStorage.getItem('userType') as 'admin' | 'manager' | 'employee' | 'owner' | null;
        const adminId = sessionStorage.getItem('adminId');
        const managerId = sessionStorage.getItem('managerId');
        const employeeId = sessionStorage.getItem('employeeId');

        let currentUserId = null;
        if (userType === 'admin') {
            currentUserId = adminId;
        } else if (userType === 'manager') {
            currentUserId = managerId;
        } else if (userType === 'employee') {
            currentUserId = employeeId;
        } else if (userType === 'owner') {
            currentUserId = 'owner';
        }
        
        const data: SessionData = {
          userType,
          adminName: sessionStorage.getItem('adminName') || '',
          companyName: sessionStorage.getItem('companyName') || '',
          departmentName: sessionStorage.getItem('departmentName') || '',
          managerName: sessionStorage.getItem('managerName') || '',
          employeeName: sessionStorage.getItem('employeeName') || '',
          userId: currentUserId,
          companyId: sessionStorage.getItem('companyId'),
          isOwner: userType === 'owner',
        };
        setSessionData(data);
        setIsLoggedIn(!!currentUserId);
    } else {
        setIsLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    loadSession();

    const handleStorageChange = (event: StorageEvent) => {
        if (event.key && event.key.startsWith('genkit')) return;
        loadSession();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };

  }, [loadSession]);

  return {
    sessionData,
    isLoggedIn,
  };
}
