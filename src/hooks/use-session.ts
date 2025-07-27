
'use client';

import { useState, useEffect } from 'react';

interface SessionData {
  userType: 'admin' | 'manager' | 'employee' | null;
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

  useEffect(() => {
    // This effect runs only once on the client-side
    setIsClient(true);
    
    const userType = sessionStorage.getItem('userType') as 'admin' | 'manager' | 'employee' | null;
    const adminId = sessionStorage.getItem('adminId');
    const managerId = sessionStorage.getItem('managerId');
    const employeeId = sessionStorage.getItem('employeeId');
    
    setSessionData({
      userType,
      adminName: sessionStorage.getItem('adminName') || '',
      companyName: sessionStorage.getItem('companyName') || '',
      departmentName: sessionStorage.getItem('department') || '',
      managerName: sessionStorage.getItem('managerName') || '',
      employeeName: sessionStorage.getItem('employeeName') || '',
      userId: adminId || managerId || employeeId,
      companyId: sessionStorage.getItem('companyId'),
    });
  }, []); // Empty dependency array ensures it runs only once on mount on the client

  return {
    sessionData,
    isLoggedIn: isClient && !!sessionData.userType,
  };
}
