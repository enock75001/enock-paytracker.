
'use client';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { type Employee, type Department, type ArchivedPayroll } from '@/lib/types';
import { initialDays, mockDepartments, mockEmployees, mockArchives } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, addDoc, doc, updateDoc, deleteDoc, getDoc, query } from 'firebase/firestore';

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

  const fetchData = useCallback(async (isInitial = false, initialData?: { departments: Department[], employees: Employee[], archives: ArchivedPayroll[] }) => {
    try {
        if (isInitial && initialData) {
            setDepartments(initialData.departments);
            setEmployees(initialData.employees);
            setArchives(initialData.archives);
        } else {
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
            
            // Ensure data consistency
            const safeEmployees = employeesData.map(e => ({...e, currentWeekWage: e.currentWeekWage || e.dailyWage }));

            setDepartments(departmentsData);
            setEmployees(safeEmployees);
            setArchives(archivesData.sort((a,b) => (b.period || "").localeCompare(a.period || "")));
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
  }, []);


  useEffect(() => {
    const initializeData = async () => {
        setLoading(true);
        try {
            const departmentsSnapshot = await getDocs(collection(db, "departments"));
            if (departmentsSnapshot.empty) {
                console.log("Database is empty. Initializing with mock data...");
                const batch = writeBatch(db);

                const newDepartments = mockDepartments.map(d => ({...d, id: d.name.replace(/\s+/g, '-').toLowerCase()}));
                const newArchives = mockArchives.map(a => ({...a, id: a.period}));

                newDepartments.forEach(dept => {
                    const docRef = doc(db, "departments", dept.id);
                    batch.set(docRef, { name: dept.name, manager: dept.manager });
                });
                mockEmployees.forEach(emp => {
                    const docRef = doc(collection(db, "employees"));
                    batch.set(docRef, emp);
                });
                 newArchives.forEach(archive => {
                    const docRef = doc(db, "archives", archive.id);
                    batch.set(docRef, {
                        period: archive.period,
                        totalPayroll: archive.totalPayroll,
                        departments: archive.departments,
                    });
                });
                await batch.commit();
                console.log("Mock data initialized.");
                await fetchData();
            } else {
                 await fetchData();
            }
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
    const updatedData = { ...data, dailyWage: data.dailyWage };
    await updateDoc(docRef, updatedData);
    setEmployees(prev => prev.map(emp =>
      emp.id === employeeId ? { ...emp, ...updatedData, currentWeekWage: emp.currentWeekWage || updatedData.dailyWage } : emp
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
    const newId = department.name.replace(/\s+/g, '-').toLowerCase();
    await setDoc(doc(db, "departments", newId), department);
    setDepartments([...departments, { ...department, id: newId }]);
  };

  const updateDepartment = async (originalName: string, updatedDepartmentData: Omit<Department, 'id'>) => {
      const originalDept = departments.find(d => d.name === originalName);
      if(!originalDept || !originalDept.id) return;

      const nameExists = departments.some(d => d.name.toLowerCase() === updatedDepartmentData.name.toLowerCase() && d.name.toLowerCase() !== originalName.toLowerCase());
      if (nameExists) throw new Error("Un autre département avec ce nouveau nom existe déjà.");

      const isRenaming = originalName !== updatedDepartmentData.name;
      
      if(isRenaming) {
        // Delete old and create new to change ID, and update employees
        const newId = updatedDepartmentData.name.replace(/\s+/g, '-').toLowerCase();
        const batch = writeBatch(db);

        // 1. Create new department doc
        const newDeptRef = doc(db, "departments", newId);
        batch.set(newDeptRef, updatedDepartmentData);

        // 2. Delete old department doc
        const oldDeptRef = doc(db, "departments", originalDept.id);
        batch.delete(oldDeptRef);

        // 3. Update employees in the old department
        const employeesToUpdate = employees.filter(e => e.domain === originalName);
        employeesToUpdate.forEach(emp => {
            const empRef = doc(db, "employees", emp.id);
            batch.update(empRef, { domain: updatedDepartmentData.name });
        });

        await batch.commit();

      } else {
        // Just update the manager info
        const docRef = doc(db, "departments", originalDept.id);
        await updateDoc(docRef, { manager: updatedDepartmentData.manager });
      }
      
      // refetch all data to ensure consistency
      await fetchData();
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
    const archiveRef = doc(db, "archives", `archive-${new Date().getTime()}`);
    batch.set(archiveRef, newArchiveData);

    // Reset employees attendance and update wages
    const updatedEmployeesForState: Employee[] = [];
    employees.forEach(emp => {
        const empRef = doc(db, "employees", emp.id);
        const newAttendance = days.reduce((acc, day) => ({ ...acc, [day]: false }), {});
        const newCurrentWeekWage = emp.dailyWage;
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

    