
'use client';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { type Employee, type Department, type ArchivedPayroll } from '@/lib/types';
import { mockEmployees, initialDays, mockDepartments } from '@/lib/data';

type EmployeeUpdatePayload = Omit<Employee, 'id' | 'attendance' | 'registrationDate' | 'currentWeekWage'>;

interface EmployeeContextType {
  employees: Employee[];
  departments: Department[];
  archives: ArchivedPayroll[];
  addEmployee: (employee: Omit<Employee, 'id' | 'attendance' | 'registrationDate' | 'currentWeekWage'>) => void;
  updateEmployee: (employeeId: string, data: EmployeeUpdatePayload) => void;
  updateAttendance: (employeeId: string, day: string, isPresent: boolean) => void;
  deleteEmployee: (employeeId: string) => void;
  transferEmployee: (employeeId: string, newDomain: string) => void;
  days: string[];
  addDepartment: (department: Department) => void;
  updateDepartment: (originalName: string, updatedDepartment: Department) => void;
  deleteDepartment: (departmentName: string) => void;
  startNewWeek: () => void;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider = ({ children }: { children: ReactNode }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [archives, setArchives] = useState<ArchivedPayroll[]>([]);
  const [isClient, setIsClient] = useState(false);
  const days = initialDays;

   useEffect(() => {
    setIsClient(true);
    
    try {
      const storedEmployees = localStorage.getItem('employees');
      const storedDepartments = localStorage.getItem('departments');
      const storedArchives = localStorage.getItem('archives');

      if (storedEmployees && storedDepartments) {
        setEmployees(JSON.parse(storedEmployees));
        setDepartments(JSON.parse(storedDepartments));
        setArchives(storedArchives ? JSON.parse(storedArchives) : []);
      } else {
        // If no data in localStorage, initialize with mock data
        setEmployees(mockEmployees);
        setDepartments(mockDepartments);
        setArchives([]);
      }
    } catch (error) {
        console.error("Failed to read from localStorage", error);
        // Fallback to mock data if localStorage is corrupt or inaccessible
        setEmployees(mockEmployees);
        setDepartments(mockDepartments);
        setArchives([]);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
        try {
            localStorage.setItem('employees', JSON.stringify(employees));
            localStorage.setItem('departments', JSON.stringify(departments));
            localStorage.setItem('archives', JSON.stringify(archives));
        } catch (error) {
            console.error("Failed to write to localStorage", error);
        }
    }
  }, [employees, departments, archives, isClient]);


  const addEmployee = (employeeData: Omit<Employee, 'id' | 'attendance' | 'registrationDate' | 'currentWeekWage'>) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: (employees.length > 999 ? Math.random() : employees.length + 1).toString(),
      registrationDate: new Date().toISOString().split('T')[0],
      attendance: days.reduce((acc, day) => ({ ...acc, [day]: false }), {}),
      photoUrl: employeeData.photoUrl || 'https://placehold.co/100x100.png',
      currentWeekWage: employeeData.dailyWage, // Initialize currentWeekWage
    };
    setEmployees(prev => [...prev, newEmployee]);
  };

  const updateEmployee = (employeeId: string, data: EmployeeUpdatePayload) => {
    setEmployees(prev => prev.map(emp =>
      emp.id === employeeId
        ? {
            ...emp,
            firstName: data.firstName,
            lastName: data.lastName,
            domain: data.domain,
            birthDate: data.birthDate,
            address: data.address,
            dailyWage: data.dailyWage, // Only update the base daily wage
            phone: data.phone,
            photoUrl: data.photoUrl,
          }
        : emp
    ));
  };

  const updateAttendance = (employeeId: string, day: string, isPresent: boolean) => {
    setEmployees(prev =>
      prev.map(emp =>
        emp.id === employeeId
          ? { ...emp, attendance: { ...emp.attendance, [day]: isPresent } }
          : emp
      )
    );
  };
  
  const deleteEmployee = (employeeId: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
  };
  
  const transferEmployee = (employeeId: string, newDomain: string) => {
     setEmployees(prev => prev.map(emp =>
      emp.id === employeeId ? { ...emp, domain: newDomain } : emp
    ));
  }

  const addDepartment = (department: Department) => {
    if (departments.some(d => d.name.toLowerCase() === department.name.toLowerCase())) {
      throw new Error("Un département avec ce nom existe déjà.");
    }
    setDepartments(prev => [...prev, department]);
  };

  const updateDepartment = (originalName: string, updatedDepartment: Department) => {
    if (originalName.toLowerCase() !== updatedDepartment.name.toLowerCase()) {
      if (departments.some(d => d.name.toLowerCase() === updatedDepartment.name.toLowerCase())) {
        throw new Error("Un autre département avec ce nouveau nom existe déjà.");
      }
    }
    
    setDepartments(prev =>
      prev.map(d => (d.name === originalName ? updatedDepartment : d))
    );

    setEmployees(prev => 
      prev.map(emp => emp.domain === originalName ? { ...emp, domain: updatedDepartment.name } : emp)
    )
  };

  const deleteDepartment = (departmentName: string) => {
    if (employees.some(emp => emp.domain === departmentName)) {
      throw new Error("Impossible de supprimer. Veuillez d'abord réaffecter les employés de ce département.");
    }
    setDepartments(prev => prev.filter(d => d.name !== departmentName));
  };
  
  const startNewWeek = () => {
     // 1. Archive current week's payroll
    const totalPayroll = employees.reduce((total, emp) => {
        const daysPresent = days.filter(day => emp.attendance[day]).length;
        const weeklyWage = emp.currentWeekWage || emp.dailyWage || 0;
        return total + (daysPresent * weeklyWage);
    }, 0);

    const departmentTotals: { [key: string]: { total: number, employeeCount: number } } = {};

    employees.forEach(emp => {
        if (!departmentTotals[emp.domain]) {
            departmentTotals[emp.domain] = { total: 0, employeeCount: 0 };
        }
        const daysPresent = days.filter(day => emp.attendance[day]).length;
        const weeklyWage = emp.currentWeekWage || emp.dailyWage || 0;
        departmentTotals[emp.domain].total += (daysPresent * weeklyWage);
        departmentTotals[emp.domain].employeeCount += 1;
    });

    const newArchive: ArchivedPayroll = {
        period: `Semaine du ${new Date().toLocaleDateString('fr-FR')}`,
        totalPayroll,
        departments: Object.entries(departmentTotals).map(([name, data]) => ({ name, ...data })),
    };
    
    setArchives(prev => [newArchive, ...prev]);

    // 2. Reset attendance and update wages for the new week
    setEmployees(prev => prev.map(emp => ({
        ...emp,
        attendance: days.reduce((acc, day) => ({ ...acc, [day]: false }), {}),
        currentWeekWage: emp.dailyWage, // Update current wage from base wage
    })));
  }

  const value = { employees, departments, archives, addEmployee, updateEmployee, updateAttendance, deleteEmployee, transferEmployee, days, addDepartment, updateDepartment, deleteDepartment, startNewWeek };
  
  return (
    <EmployeeContext.Provider value={value}>
      {isClient ? children : null}
    </EmployeeContext.Provider>
  );
};

export const useEmployees = () => {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployees must be used within an EmployeeProvider');
  }
  return context;
};
