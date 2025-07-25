import { type Employee, type Department, type ArchivedPayroll } from './types';

// Use French day names for consistency
export const initialDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// Consistent initial attendance data to avoid hydration mismatch
const createInitialAttendance = (employeeId: string) => {
  const attendance: { [key: string]: boolean } = {};
  initialDays.forEach((day, index) => {
    // Create a predictable but varied pattern based on employee ID and day index
    const seed = parseInt(employeeId, 10) + index;
    attendance[day] = seed % 3 !== 0; // e.g., present 2/3 of the time
  });
  return attendance;
};


export const mockDepartments: Department[] = [
  {
    name: 'Peinture Intérieure',
    manager: { name: 'Mr. Bernard', pin: '1234' },
    subgroups: [
        { name: 'Équipe A - Plafonds', leader: 'Chef A' },
        { name: 'Équipe B - Murs', leader: 'Chef B' }
    ]
  },
  {
    name: 'Peinture Extérieure',
    manager: { name: 'Mme. Cissé', pin: '5678' },
    subgroups: [
        { name: 'Équipe C - Façades', leader: 'Chef C' },
        { name: 'Équipe D - Boiseries', leader: 'Chef D' }
    ]
  },
  {
    name: 'Finitions Spéciales',
    manager: { name: 'Mr. Konan', pin: '4321' },
    subgroups: [
        { name: 'Équipe E - Effets décoratifs', leader: 'Chef E' }
    ]
  },
];


export const mockEmployees: Employee[] = [
  {
    id: '1',
    firstName: 'Jean',
    lastName: 'Dupont',
    domain: 'Peinture Intérieure',
    subgroup: 'Équipe A - Plafonds',
    birthDate: '1990-05-15',
    address: '123 Rue de la Paix, Abidjan',
    registrationDate: '2023-01-10',
    dailyWage: 5000,
    phone: '0123456789',
    photoUrl: 'https://placehold.co/100x100.png',
    attendance: createInitialAttendance('1'),
  },
  {
    id: '2',
    firstName: 'Amina',
    lastName: 'Traoré',
    domain: 'Peinture Extérieure',
    subgroup: 'Équipe C - Façades',
    birthDate: '1985-11-20',
    address: '456 Avenue des Baobabs, Dakar',
    registrationDate: '2022-11-05',
    dailyWage: 5500,
    phone: '0987654321',
    photoUrl: 'https://placehold.co/100x100.png',
    attendance: createInitialAttendance('2'),
  },
  {
    id: '3',
    firstName: 'Pierre',
    lastName: 'Kone',
    domain: 'Peinture Intérieure',
    subgroup: 'Équipe B - Murs',
    birthDate: '1992-03-25',
    address: '789 Boulevard de la Lagune, Cotonou',
    registrationDate: '2023-03-20',
    dailyWage: 5000,
    phone: '0612345678',
    photoUrl: 'https://placehold.co/100x100.png',
    attendance: createInitialAttendance('3'),
  },
  {
    id: '4',
    firstName: 'Sophie',
    lastName: 'Diop',
    domain: 'Finitions Spéciales',
    subgroup: 'Équipe E - Effets décoratifs',
    birthDate: '1995-08-30',
    address: '101 Rue de la Téranga, Lomé',
    registrationDate: '2023-06-15',
    dailyWage: 4800,
    phone: '0712345678',
    photoUrl: 'https://placehold.co/100x100.png',
    attendance: createInitialAttendance('4'),
  },
   {
    id: '5',
    firstName: 'Moussa',
    lastName: 'Sow',
    domain: 'Peinture Extérieure',
    subgroup: 'Équipe D - Boiseries',
    birthDate: '1988-07-12',
    address: '212 Rue du Commerce, Bamako',
    registrationDate: '2021-09-01',
    dailyWage: 5200,
    phone: '0587654321',
    photoUrl: 'https://placehold.co/100x100.png',
    attendance: createInitialAttendance('5'),
  },
];


export const mockArchives: ArchivedPayroll[] = [
  {
    period: "2024-06",
    totalPayroll: 1250000,
    departments: [
      { name: "Peinture Intérieure", total: 500000, employeeCount: 2 },
      { name: "Peinture Extérieure", total: 650000, employeeCount: 2 },
      { name: "Finitions Spéciales", total: 100000, employeeCount: 1 },
    ],
  },
  {
    period: "2024-05",
    totalPayroll: 1235000,
    departments: [
      { name: "Peinture Intérieure", total: 480000, employeeCount: 2 },
      { name: "Peinture Extérieure", total: 655000, employeeCount: 2 },
      { name: "Finitions Spéciales", total: 100000, employeeCount: 1 },
    ],
  },
  {
    period: "2023-12",
    totalPayroll: 1100000,
    departments: [
        { name: "Peinture Intérieure", total: 450000, employeeCount: 2 },
        { name: "Peinture Extérieure", total: 550000, employeeCount: 2 },
        { name: "Finitions Spéciales", total: 100000, employeeCount: 1 },
    ]
  }
];
