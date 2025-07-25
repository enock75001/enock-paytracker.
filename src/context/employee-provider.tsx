
'use client';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { type Employee, type Department, type ArchivedPayroll } from '@/lib/types';
import { mockEmployees, initialDays, mockDepartments, mockArchives } from '@/lib/data';

type EmployeeUpdatePayload = Omit<Employee, 'id' | 'attendance' | 'registrationDate' | 'currentWeekWage'>;

interface EmployeeContextType {
  employees: Employee[];
  departments: Department[];
  archives: ArchivedPayroll[];
  addEmployee: (employee: Omit<Employee, 'id' | 'attendance' | 'registrationDate' | 'currentWeekWage'>) => Promise<void>;
  updateEmployee: (employeeId: string, data: EmployeeUpdatePayload) => Promise<void>;
  updateAttendance: (employeeId: string, day: string, isPresent: boolean) => Promise<void>;
  deleteEmployee: (employeeId: string) => Promise<void>;
  transferEmployee: (employeeId: string, newDomain: string) => Promise<void>;
  days: string[];
  addDepartment: (department: Omit<Department, 'id'>) => Promise<void>;
  updateDepartment: (originalName: string, updatedDepartment: Omit<Department, 'id'>) => Promise<void>;
  deleteDepartment: (departmentName: string) => Promise<void>;
  startNewWeek: () => Promise<void>;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
};


export const EmployeeProvider = ({ children }: { children: ReactNode }) => {
  const [employees, setEmployees] = useLocalStorage<Employee[]>('employees', mockEmployees);
  const [departments, setDepartments] = useLocalStorage<Department[]>('departments', mockDepartments.map(d => ({...d, id: d.name.replace(/\s+/g, '-').toLowerCase() })));
  const [archives, setArchives] = useLocalStorage<ArchivedPayroll[]>('archives', mockArchives.map(a => ({...a, id: a.period })));
  
  const [loading, setLoading] = useState(true);
  const days = initialDays;

   useEffect(() => {
    // Simulate loading for a moment to prevent flash of unstyled content
    const timer = setTimeout(() => {
        setLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, []);


  const addEmployee = async (employeeData: Omit<Employee, 'id' | 'attendance' | 'registrationDate' | 'currentWeekWage'>) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: new Date().getTime().toString(),
      registrationDate: new Date().toISOString().split('T')[0],
      attendance: days.reduce((acc, day) => ({ ...acc, [day]: false }), {}),
      photoUrl: employeeData.photoUrl || `https://placehold.co/100x100.png?text=${employeeData.firstName.charAt(0)}${employeeData.lastName.charAt(0)}`,
      currentWeekWage: employeeData.dailyWage,
    };
    setEmployees([...employees, newEmployee]);
  };

  const updateEmployee = async (employeeId: string, data: EmployeeUpdatePayload) => {
    setEmployees(prev => prev.map(emp =>
      emp.id === employeeId ? { ...emp, ...data, currentWeekWage: emp.currentWeekWage || data.dailyWage, dailyWage: data.dailyWage } : emp
    ));
  };

  const updateAttendance = async (employeeId: string, day: string, isPresent: boolean) => {
    setEmployees(prev =>
      prev.map(emp =>
        emp.id === employeeId
          ? { ...emp, attendance: { ...emp.attendance, [day]: isPresent } }
          : emp
      )
    );
  };
  
  const deleteEmployee = async (employeeId: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
  };
  
  const transferEmployee = async (employeeId: string, newDomain: string) => {
     setEmployees(prev => prev.map(emp =>
      emp.id === employeeId ? { ...emp, domain: newDomain } : emp
    ));
  }

  const addDepartment = async (department: Omit<Department, 'id'>) => {
     const nameExists = departments.some(d => d.name.toLowerCase() === department.name.toLowerCase());
     if(nameExists) {
        throw new Error("Un département avec ce nom existe déjà.");
     }
    const newId = department.name.replace(/\s+/g, '-').toLowerCase();
    setDepartments([...departments, { ...department, id: newId }]);
  };

  const updateDepartment = async (originalName: string, updatedDepartment: Omit<Department, 'id'>) => {
    const nameExists = departments.some(d => d.name.toLowerCase() === updatedDepartment.name.toLowerCase() && d.name.toLowerCase() !== originalName.toLowerCase());
    if (nameExists) {
      throw new Error("Un autre département avec ce nouveau nom existe déjà.");
    }
    
    setDepartments(prev =>
      prev.map(d => (d.name === originalName ? { ...d, ...updatedDepartment } : d))
    );
    setEmployees(prev => 
      prev.map(emp => emp.domain === originalName ? { ...emp, domain: updatedDepartment.name } : emp)
    )
  };

  const deleteDepartment = async (departmentName: string) => {
     const hasEmployees = employees.some(e => e.domain === departmentName);
     if (hasEmployees) {
         throw new Error("Impossible de supprimer. Veuillez d'abord réaffecter les employés de ce département.");
     }

    setDepartments(prev => prev.filter(d => d.name !== departmentName));
  };
  
  const startNewWeek = async () => {
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
        id: `archive-${new Date().getTime()}`,
        period: `Semaine du ${new Date().toLocaleDateString('fr-FR')}`,
        totalPayroll,
        departments: Object.entries(departmentTotals).map(([name, data]) => ({ name, ...data })),
    };
    
    setArchives(prev => [newArchive, ...prev].sort((a,b) => (b.period || "").localeCompare(a.period || "")));

    const updatedEmployees = employees.map(emp => {
        const newAttendance = days.reduce((acc, day) => ({ ...acc, [day]: false }), {});
        const newCurrentWeekWage = emp.dailyWage;
        return {
            ...emp,
            attendance: newAttendance,
            currentWeekWage: newCurrentWeekWage
        };
    });
    
    setEmployees(updatedEmployees);
  }

  const value = { employees, departments, archives, addEmployee, updateEmployee, updateAttendance, deleteEmployee, transferEmployee, days, addDepartment, updateDepartment, deleteDepartment, startNewWeek };
  
  return (
    <EmployeeContext.Provider value={value}>
      {loading ? <div className="flex h-screen items-center justify-center">Chargement...</div> : children}
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
