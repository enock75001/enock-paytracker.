

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

export type Loan = {
  id: string;
  employeeId: string;
  companyId: string;
  amount: number;
  repaymentAmount: number; // Amount to be deducted each pay period
  balance: number;
  startDate: string; // ISO string
  status: 'active' | 'repaid' | 'paused' | 'cancelled';
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
  loanRepayment: number;
  totalPay: number;
  dailyWageAtTime: number;
}

export type AbsenceJustification = {
    id: string;
    employeeId: string;
    employeeName: string; // For display
    departmentName: string;
    companyId: string;
    date: string; // The specific date of absence (YYYY-MM-DD)
    dayName: string; // e.g. "Lundi 29"
    reason: string;
    documentUrl?: string; // Optional link to a medical note, etc.
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string; // ISO Timestamp
    reviewedBy?: string; // Manager's name
    reviewedAt?: string; // ISO Timestamp
};


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
  conversationId: string;
  conversationParticipants: string[]; // e.g. ['userId1', 'userId2']
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: any;
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

export interface Notification {
  id?: string;
  companyId: string;
  title: string;
  description: string;
  link?: string;
  isRead: boolean;
  createdAt: string; // ISO string
  type: 'info' | 'warning' | 'success';
}

export interface SiteSettings {
    isUnderMaintenance: boolean;
    maintenanceMessage: string;
}
    
