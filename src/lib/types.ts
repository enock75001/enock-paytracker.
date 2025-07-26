
export type Attendance = {
  [day: string]: boolean;
};

export type PayPeriod = 'weekly' | 'bi-weekly' | 'monthly';

export interface Company {
    id: string;
    companyIdentifier: string; // The "EPT-XXXX" unique ID
    name: string;
    superAdminName: string;
    superAdminEmail: string;
    payPeriod: PayPeriod;
    payPeriodStartDate?: string; // ISO string for the start date of the first pay period
    logoUrl?: string;
    description?: string;
    registrationDate?: string;
    status: 'active' | 'suspended';
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

export interface PayStub {
  id?: string;
  companyId: string;
  employeeId: string;
  employeeName: string; // For easier display without extra lookups
  period: string; // e.g., "Semaine du 21 Juil au 27 Juil 2024"
  payDate: string; // ISO string date when the stub was generated
  daysPresent: number;
  basePay: number;
  adjustments: Adjustment[]; // Store the actual adjustments for that period
  totalAdjustments: number;
  totalPay: number;
  dailyWageAtTime: number;
}


export interface Admin {
    id: string;
    companyId: string;
    name: string;
    password: string;
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

export interface ChatMessage {
  id?: string;
  conversationId: string; // New field to group messages. e.g., 'userId1_userId2'
  senderId: string;
  receiverId: string; // New field for private messages
  text: string;
  timestamp: any; // Can be a server timestamp or a number
  read: boolean;
}

export interface OnlineUser {
    userId: string;
    senderId?: string; // adminId or employeeId for manager
    companyId: string;
    name: string;
    role: 'admin' | 'manager';
    departmentName?: string;
    lastSeen: number; // Unix timestamp
}
