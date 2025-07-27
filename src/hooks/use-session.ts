
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
};

export function useSession() {
  const [sessionData, setSessionData] = useState<SessionData>(initialSessionData);
  const [isClient, setIsClient] = useState(false);

  const loadSession = useCallback(() => {
    const userType = sessionStorage.getItem('userType') as 'admin' | 'manager' | 'employee' | 'owner' | null;
    const adminId = sessionStorage.getItem('adminId');
    const managerId = sessionStorage.getItem('managerId');
    const employeeId = sessionStorage.getItem('employeeId');
    
    // For owner, there's no specific ID, we can just use a placeholder if needed
    const userId = userType === 'owner' ? 'owner' : (adminId || managerId || employeeId);
    
    setSessionData({
      userType,
      adminName: sessionStorage.getItem('adminName') || '',
      companyName: sessionStorage.getItem('companyName') || '',
      departmentName: sessionStorage.getItem('departmentName') || '', // Corrected key
      managerName: sessionStorage.getItem('managerName') || '',
      employeeName: sessionStorage.getItem('employeeName') || '',
      userId,
      companyId: sessionStorage.getItem('companyId'),
    });
  }, []);

  useEffect(() => {
    // This effect runs only once on the client-side
    setIsClient(true);
    loadSession();

    // Listen to storage changes to keep session in sync across tabs
    const handleStorageChange = () => {
        loadSession();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };

  }, [loadSession]);

  return {
    sessionData,
    isLoggedIn: isClient && !!sessionData.userType,
  };
}
