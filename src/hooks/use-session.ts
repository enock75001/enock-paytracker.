
'use client';

import { useState, useEffect } from 'react';

interface SessionData {
  userType: 'admin' | 'manager' | null;
  adminName: string;
  managerName: string;
  companyName: string;
  departmentName: string;
  userId: string | null;
  companyId: string | null;
}

const initialSessionData: SessionData = {
  userType: null,
  adminName: '',
  managerName: '',
  companyName: '',
  departmentName: '',
  userId: null,
  companyId: null,
};

export function useSession() {
  const [sessionData, setSessionData] = useState<SessionData>(initialSessionData);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect runs only once on the client-side
    setIsClient(true);
    
    const userType = sessionStorage.getItem('userType') as 'admin' | 'manager' | null;
    const adminId = sessionStorage.getItem('adminId');
    const managerId = sessionStorage.getItem('managerId');
    
    setSessionData({
      userType,
      adminName: sessionStorage.getItem('adminName') || '',
      companyName: sessionStorage.getItem('companyName') || '',
      departmentName: sessionStorage.getItem('department') || '',
      managerName: sessionStorage.getItem('managerName') || '',
      userId: adminId || managerId,
      companyId: sessionStorage.getItem('companyId'),
    });
  }, []); // Empty dependency array ensures it runs only once on mount on the client

  return {
    sessionData,
    isLoggedIn: isClient && !!sessionData.userType,
  };
}
