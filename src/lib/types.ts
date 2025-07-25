export type Attendance = {
  [day: string]: boolean;
};

export interface Employee {
  id: string;
  firstName: string;
  lastName:string;
  domain: string;
  birthDate: string;
  address: string;
  registrationDate: string;
  dailyWage: number;
  phone: string;
  photoUrl: string;
  attendance: Attendance;
}

export interface Department {
  name: string;
  manager: {
    name: string;
    pin: string;
  };
}

export interface ArchivedPayroll {
  period: string; // e.g., "2024-05"
  totalPayroll: number;
  departments: {
    name: string;
    total: number;
    employeeCount: number;
  }[];
}
