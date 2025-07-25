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
