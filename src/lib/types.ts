
export type Attendance = {
  [day: string]: boolean;
};

export interface Company {
    id: string;
    name: string;
    superAdminName: string;
}

export interface Employee {
  id: string;
  companyId: string;
  firstName: string;
  lastName:string;
  domain: string;
  birthDate: string;
  address: string;
  registrationDate: string;
  dailyWage: number;
  currentWeekWage: number; // Salaire utilisé pour la paie de la semaine actuelle
  phone: string;
  photoUrl: string;
  attendance: Attendance;
}

export interface Department {
  id?: string;
  companyId: string;
  name: string;
  manager: {
    name: string;
    pin: string;
  };
}

export interface ArchivedPayroll {
  id?: string;
  companyId: string;
  period: string; // e.g., "2024-W25"
  totalPayroll: number;
  departments: {
    name: string;
    total: number;
    employeeCount: number;
  }[];
}

export interface Admin {
    id: string;
    companyId: string;
    name: string;
    pin: string;
    role: 'superadmin' | 'adjoint';
}

export interface LoginLog {
  id?: string;
  companyId: string;
  companyName: string;
  userName: string;
  userType: 'admin' | 'manager';
  details: string; // Department name for manager, role for admin
  timestamp: string; // ISO string
}
