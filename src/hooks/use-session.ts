
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
    const userType = sessionStorage.getItem('userType') as 'admin' | 'manager' | 'employee' | 'owner' | null;
    const adminId = sessionStorage.getItem('adminId');
    const managerId = sessionStorage.getItem('managerId');
    const employeeId = sessionStorage.getItem('employeeId');
    const ownerLoggedIn = sessionStorage.getItem('ownerLoggedIn') === 'true';
    
    const userId = ownerLoggedIn ? 'owner' : (adminId || managerId || employeeId);
    
    setSessionData({
      userType,
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
    isLoggedIn: isClient && (!!sessionData.userType || sessionData.isOwner),
  };
}
