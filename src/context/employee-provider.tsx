'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { type Employee, type Department } from '@/lib/types';
import { mockEmployees, initialDays, mockDepartments } from '@/lib/data';

interface EmployeeContextType {
  employees: Employee[];
  departments: Department[];
  addEmployee: (employee: Omit<Employee, 'id' | 'attendance' | 'registrationDate'>) => void;
  updateAttendance: (employeeId: string, day: string, isPresent: boolean) => void;
  days: string[];
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider = ({ children }: { children: ReactNode }) => {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const days = initialDays;

  const addEmployee = (employeeData: Omit<Employee, 'id' | 'attendance' | 'registrationDate'>) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: (employees.length + 1).toString(),
      registrationDate: new Date().toISOString().split('T')[0],
      attendance: days.reduce((acc, day) => ({ ...acc, [day]: false }), {}),
      photoUrl: employeeData.photoUrl || 'https://placehold.co/100x100.png'
    };
    setEmployees(prev => [...prev, newEmployee]);
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

  return (
    <EmployeeContext.Provider value={{ employees, departments, addEmployee, updateAttendance, days }}>
      {children}
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
