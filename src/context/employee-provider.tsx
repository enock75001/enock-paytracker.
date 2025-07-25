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
  addDepartment: (department: Department) => void;
  updateDepartment: (originalName: string, updatedDepartment: Department) => void;
  deleteDepartment: (departmentName: string) => void;
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

  const addDepartment = (department: Department) => {
    if (departments.some(d => d.name.toLowerCase() === department.name.toLowerCase())) {
      throw new Error("Un département avec ce nom existe déjà.");
    }
    setDepartments(prev => [...prev, department]);
  };

  const updateDepartment = (originalName: string, updatedDepartment: Department) => {
    // If the name is being changed, check for conflicts
    if (originalName.toLowerCase() !== updatedDepartment.name.toLowerCase()) {
      if (departments.some(d => d.name.toLowerCase() === updatedDepartment.name.toLowerCase())) {
        throw new Error("Un autre département avec ce nouveau nom existe déjà.");
      }
    }
    
    setDepartments(prev =>
      prev.map(d => (d.name === originalName ? updatedDepartment : d))
    );

    // Also update the domain for all employees in that department
    setEmployees(prev => 
      prev.map(emp => emp.domain === originalName ? { ...emp, domain: updatedDepartment.name } : emp)
    )
  };

  const deleteDepartment = (departmentName: string) => {
    // Prevent deletion if employees are still in the department
    if (employees.some(emp => emp.domain === departmentName)) {
      throw new Error("Impossible de supprimer. Veuillez d'abord réaffecter les employés de ce département.");
    }
    setDepartments(prev => prev.filter(d => d.name !== departmentName));
  };


  return (
    <EmployeeContext.Provider value={{ employees, departments, addEmployee, updateAttendance, days, addDepartment, updateDepartment, deleteDepartment }}>
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
