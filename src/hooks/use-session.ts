
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

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
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined') {
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
    }
  }, [pathname]);

  return {
    sessionData,
    isLoggedIn: isClient && !!sessionData.userType,
  };
}
