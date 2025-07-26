
export type Attendance = {
  [day: string]: boolean;
};

export type PayPeriod = 'weekly' | 'bi-weekly' | 'monthly';

export interface Company {
    id: string;
    companyIdentifier: string; // The "EPT-XXXX" unique ID
    name: string;
    superAdminName: string;
    payPeriod: PayPeriod;
    payPeriodStartDate?: string; // ISO string for the start date of the first pay period
    logoUrl?: string;
    description?: string;
}

export type Adjustment = {
    id: string;
    date: string; // ISO string date
    type: 'bonus' | 'deduction';
    amount: number;
    reason: string;
};

export interface Employee {
  id: string;
  companyId: string;
  firstName: string;
  lastName:string;
  poste: string; // Employee's position/role
  domain: string;
  birthDate: string;
  address: string;
  registrationDate: string;
  dailyWage: number;
  currentWeekWage: number; // Salaire utilisé pour la paie de la semaine actuelle
  phone: string;
  photoUrl: string;
  attendance: Attendance;
  adjustments: Adjustment[];
}

export interface Department {
  id?: string;
  companyId: string;
  name: string;
  managerId: string | null; // ID of the employee who is the manager
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
