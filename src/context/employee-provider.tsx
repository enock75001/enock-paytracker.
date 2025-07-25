
'use client';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { type Employee, type Department, type ArchivedPayroll } from '@/lib/types';
import { initialDays, mockDepartments, mockEmployees, mockArchives } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, addDoc, doc, updateDoc, deleteDoc, getDoc, setDoc, query } from 'firebase/firestore';

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

export const EmployeeProvider = ({ children }: { children: ReactNode }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [archives, setArchives] = useState<ArchivedPayroll[]>([]);
  const [loading, setLoading] = useState(true);
  const days = initialDays;

  const fetchData = useCallback(async () => {
      try {
          const departmentsQuery = query(collection(db, "departments"));
          const employeesQuery = query(collection(db, "employees"));
          const archivesQuery = query(collection(db, "archives"));

          const [departmentsSnapshot, employeesSnapshot, archivesSnapshot] = await Promise.all([
              getDocs(departmentsQuery),
              getDocs(employeesQuery),
              getDocs(archivesQuery),
          ]);

          const departmentsData = departmentsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Department[];
          const employeesData = employeesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Employee[];
          const archivesData = archivesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as ArchivedPayroll[];
          
          const safeEmployees = employeesData.map(e => ({...e, currentWeekWage: e.currentWeekWage || e.dailyWage }));

          setDepartments(departmentsData);
          setEmployees(safeEmployees);
          setArchives(archivesData.sort((a,b) => (b.period || "").localeCompare(a.period || "")));
      } catch (error) {
          console.error("Error fetching data:", error);
      }
  }, []);


  useEffect(() => {
    const initializeData = async () => {
        setLoading(true);
        const metadataRef = doc(db, "metadata", "initialization");
        try {
            const metadataDoc = await getDoc(metadataRef);
            if (!metadataDoc.exists()) {
                console.log("Database is empty. Initializing with mock data...");
                const batch = writeBatch(db);

                mockDepartments.forEach(dept => {
                    const docRef = doc(collection(db, "departments"));
                    batch.set(docRef, { name: dept.name, manager: dept.manager });
                });
                mockEmployees.forEach(emp => {
                    const docRef = doc(collection(db, "employees"));
                    batch.set(docRef, emp);
                });
                 mockArchives.forEach(archive => {
                    const docRef = doc(collection(db, "archives"));
                    batch.set(docRef, {
                        period: archive.period,
                        totalPayroll: archive.totalPayroll,
                        departments: archive.departments,
                    });
                });
                
                batch.set(metadataRef, { initialized: true, timestamp: new Date() });
                
                await batch.commit();
                console.log("Mock data initialized.");
            }
            await fetchData();
        } catch (error) {
            console.error("Error during data initialization:", error);
        } finally {
            setLoading(false);
        }
    };
    initializeData();
  }, [fetchData]);


  const addEmployee = async (employeeData: Omit<Employee, 'id' | 'attendance' | 'registrationDate' | 'currentWeekWage'>) => {
    const newEmployee: Omit<Employee, 'id'> = {
      ...employeeData,
      registrationDate: new Date().toISOString().split('T')[0],
      attendance: days.reduce((acc, day) => ({ ...acc, [day]: false }), {}),
      photoUrl: employeeData.photoUrl || `https://placehold.co/100x100.png?text=${employeeData.firstName.charAt(0)}${employeeData.lastName.charAt(0)}`,
      currentWeekWage: employeeData.dailyWage,
    };
    const docRef = await addDoc(collection(db, "employees"), newEmployee);
    setEmployees(prev => [...prev, { ...newEmployee, id: docRef.id }]);
  };

  const updateEmployee = async (employeeId: string, data: EmployeeUpdatePayload) => {
    const docRef = doc(db, "employees", employeeId);
    // When updating an employee, only dailyWage is persisted. 
    // The change to currentWeekWage will apply at the start of the next week.
    const { dailyWage, ...restData } = data;
    const employeeToUpdate = employees.find(e => e.id === employeeId);
    
    if (!employeeToUpdate) return;
  
    // Check if the dailyWage has changed. If so, it will be the new base wage.
    // The current week's wage remains unchanged until startNewWeek() is called.
    const updatedData = {
        ...restData,
        dailyWage: dailyWage
    };
  
    await updateDoc(docRef, updatedData);
    
    setEmployees(prev => prev.map(emp =>
      emp.id === employeeId ? { 
        ...emp, 
        ...restData,
        dailyWage: dailyWage,
        // currentWeekWage is NOT updated here to preserve this week's payroll calculation.
      } : emp
    ));
  };
  

  const updateAttendance = async (employeeId: string, day: string, isPresent: boolean) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;
    const newAttendance = { ...employee.attendance, [day]: isPresent };
    const docRef = doc(db, "employees", employeeId);
    await updateDoc(docRef, { attendance: newAttendance });
    setEmployees(prev =>
      prev.map(emp => emp.id === employeeId ? { ...emp, attendance: newAttendance } : emp)
    );
  };
  
  const deleteEmployee = async (employeeId: string) => {
    await deleteDoc(doc(db, "employees", employeeId));
    setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
  };
  
  const transferEmployee = async (employeeId: string, newDomain: string) => {
     const docRef = doc(db, "employees", employeeId);
     await updateDoc(docRef, { domain: newDomain });
     setEmployees(prev => prev.map(emp =>
      emp.id === employeeId ? { ...emp, domain: newDomain } : emp
    ));
  }

  const addDepartment = async (department: Omit<Department, 'id'>) => {
     const nameExists = departments.some(d => d.name.toLowerCase() === department.name.toLowerCase());
     if(nameExists) {
        throw new Error("Un département avec ce nom existe déjà.");
     }
    const docRef = await addDoc(collection(db, "departments"), department);
    setDepartments([...departments, { ...department, id: docRef.id }]);
  };

  const updateDepartment = async (originalName: string, updatedDepartmentData: Omit<Department, 'id'>) => {
      const originalDept = departments.find(d => d.name === originalName);
      if(!originalDept || !originalDept.id) return;

      const nameExists = departments.some(d => d.name.toLowerCase() === updatedDepartmentData.name.toLowerCase() && d.name.toLowerCase() !== originalName.toLowerCase());
      if (nameExists) throw new Error("Un autre département avec ce nouveau nom existe déjà.");

      const isRenaming = originalName !== updatedDepartmentData.name;
      
      const batch = writeBatch(db);
      const oldDeptRef = doc(db, "departments", originalDept.id);

      if(isRenaming) {
        // If renaming, we can just update the name field of the existing document.
        // We also need to update all employees in that department.
        batch.update(oldDeptRef, updatedDepartmentData);
        
        const employeesToUpdateQuery = query(collection(db, 'employees'), where('domain', '==', originalName));
        const employeesToUpdateSnapshot = await getDocs(employeesToUpdateQuery);
        employeesToUpdateSnapshot.forEach(empDoc => {
            batch.update(doc(db, "employees", empDoc.id), { domain: updatedDepartmentData.name });
        });
      } else {
        // Just update the manager info
        batch.update(oldDeptRef, { manager: updatedDepartmentData.manager });
      }
      
      await batch.commit();
      await fetchData(); // Refetch all data to ensure consistency
  };

  const deleteDepartment = async (departmentName: string) => {
     const hasEmployees = employees.some(e => e.domain === departmentName);
     if (hasEmployees) {
         throw new Error("Impossible de supprimer. Veuillez d'abord réaffecter les employés de ce département.");
     }
     const deptToDelete = departments.find(d => d.name === departmentName);
     if(deptToDelete && deptToDelete.id) {
       await deleteDoc(doc(db, "departments", deptToDelete.id));
       setDepartments(prev => prev.filter(d => d.name !== departmentName));
     }
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

    const periodId = `Semaine du ${new Date().toLocaleDateString('fr-FR')}`;
    const newArchiveData = {
        period: periodId,
        totalPayroll,
        departments: Object.entries(departmentTotals).map(([name, data]) => ({ name, ...data })),
    };
    
    const batch = writeBatch(db);
    
    // Add new archive
    const archiveRef = doc(collection(db, "archives"));
    batch.set(archiveRef, newArchiveData);

    // Reset employees attendance and update wages
    const updatedEmployeesForState: Employee[] = [];
    employees.forEach(emp => {
        const empRef = doc(db, "employees", emp.id);
        const newAttendance = days.reduce((acc, day) => ({ ...acc, [day]: false }), {});
        const newCurrentWeekWage = emp.dailyWage; // New salary takes effect now
        batch.update(empRef, {
            attendance: newAttendance,
            currentWeekWage: newCurrentWeekWage,
        });
        updatedEmployeesForState.push({ ...emp, attendance: newAttendance, currentWeekWage: newCurrentWeekWage });
    });
    
    await batch.commit();

    // Update state locally
    setArchives(prev => [{ ...newArchiveData, id: archiveRef.id }, ...prev].sort((a,b) => (b.period || "").localeCompare(a.period || "")));
    setEmployees(updatedEmployeesForState);
  }

  const value = { employees, departments, archives, addEmployee, updateEmployee, updateAttendance, deleteEmployee, transferEmployee, days, addDepartment, updateDepartment, deleteDepartment, startNewWeek };
  
  return (
    <EmployeeContext.Provider value={value}>
      {loading ? (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="text-center">
                <p className="text-lg font-semibold">Chargement des données...</p>
                <p className="text-sm text-muted-foreground">Veuillez patienter.</p>
            </div>
        </div>
      ) : children}
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

    