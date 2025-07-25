
'use client';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch, runTransaction, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Employee, type Department, type ArchivedPayroll } from '@/lib/types';
import { mockEmployees, initialDays, mockDepartments } from '@/lib/data';

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
  addDepartment: (department: Department) => Promise<void>;
  updateDepartment: (originalName: string, updatedDepartment: Department) => Promise<void>;
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

   useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const departmentsSnapshot = await getDocs(collection(db, 'departments'));
        if (departmentsSnapshot.empty) {
          // Initialize with mock data if firestore is empty
          const batch = writeBatch(db);
          mockDepartments.forEach(dept => {
            const docRef = doc(collection(db, 'departments'));
            batch.set(docRef, dept);
          });
          mockEmployees.forEach(emp => {
            const docRef = doc(collection(db, 'employees'));
            batch.set(docRef, emp);
          })
          await batch.commit();
          await fetchData(); // refetch after seeding
          return;
        }

        const departmentsData = departmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department & {id:string}));
        const employeesSnapshot = await getDocs(collection(db, 'employees'));
        const employeesData = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
        const archivesSnapshot = await getDocs(collection(db, 'archives'));
        const archivesData = archivesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArchivedPayroll & {id: string}));

        setDepartments(departmentsData);
        setEmployees(employeesData);
        setArchives(archivesData.sort((a,b) => b.period.localeCompare(a.period)));

      } catch (error) {
        console.error("Failed to fetch data from Firestore", error);
        // Fallback or error handling
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  const addEmployee = async (employeeData: Omit<Employee, 'id' | 'attendance' | 'registrationDate' | 'currentWeekWage'>) => {
    const newEmployee: Omit<Employee, 'id'> = {
      ...employeeData,
      registrationDate: new Date().toISOString().split('T')[0],
      attendance: days.reduce((acc, day) => ({ ...acc, [day]: false }), {}),
      photoUrl: employeeData.photoUrl || `https://placehold.co/100x100.png?text=${employeeData.firstName.charAt(0)}${employeeData.lastName.charAt(0)}`,
      currentWeekWage: employeeData.dailyWage,
    };
    const docRef = await addDoc(collection(db, 'employees'), newEmployee);
    setEmployees(prev => [...prev, { ...newEmployee, id: docRef.id }]);
  };

  const updateEmployee = async (employeeId: string, data: EmployeeUpdatePayload) => {
    const employeeRef = doc(db, 'employees', employeeId);
    await updateDoc(employeeRef, data as any); // Firestore will ignore extra fields
    setEmployees(prev => prev.map(emp =>
      emp.id === employeeId ? { ...emp, ...data } : emp
    ));
  };

  const updateAttendance = async (employeeId: string, day: string, isPresent: boolean) => {
    const employeeRef = doc(db, 'employees', employeeId);
    const fieldToUpdate = `attendance.${day}`;
    await updateDoc(employeeRef, { [fieldToUpdate]: isPresent });

    setEmployees(prev =>
      prev.map(emp =>
        emp.id === employeeId
          ? { ...emp, attendance: { ...emp.attendance, [day]: isPresent } }
          : emp
      )
    );
  };
  
  const deleteEmployee = async (employeeId: string) => {
    await deleteDoc(doc(db, 'employees', employeeId));
    setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
  };
  
  const transferEmployee = async (employeeId: string, newDomain: string) => {
     const employeeRef = doc(db, 'employees', employeeId);
     await updateDoc(employeeRef, { domain: newDomain });
     setEmployees(prev => prev.map(emp =>
      emp.id === employeeId ? { ...emp, domain: newDomain } : emp
    ));
  }

  const addDepartment = async (department: Omit<Department, 'id'>) => {
     const q = query(collection(db, "departments"), where("name", "==", department.name));
     const querySnapshot = await getDocs(q);
     if (!querySnapshot.empty) {
         throw new Error("Un département avec ce nom existe déjà.");
     }
    const docRef = await addDoc(collection(db, 'departments'), department);
    setDepartments(prev => [...prev, { ...department, id: docRef.id }]);
  };

  const updateDepartment = async (originalName: string, updatedDepartment: Omit<Department, 'id'>) => {
    if (originalName.toLowerCase() !== updatedDepartment.name.toLowerCase()) {
      const q = query(collection(db, "departments"), where("name", "==", updatedDepartment.name));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        throw new Error("Un autre département avec ce nouveau nom existe déjà.");
      }
    }
    
    const deptQuery = query(collection(db, "departments"), where("name", "==", originalName));
    const deptSnapshot = await getDocs(deptQuery);
    if(deptSnapshot.empty) {
        throw new Error("Département original non trouvé.");
    }
    const deptDoc = deptSnapshot.docs[0];


    await runTransaction(db, async (transaction) => {
        // 1. Update department
        transaction.update(deptDoc.ref, updatedDepartment as any);

        // 2. Find employees to update
        const employeesQuery = query(collection(db, 'employees'), where('domain', '==', originalName));
        const employeesSnapshot = await getDocs(employeesQuery);

        // 3. Update employees
        employeesSnapshot.forEach(empDoc => {
            transaction.update(empDoc.ref, { domain: updatedDepartment.name });
        });
    });

    setDepartments(prev =>
      prev.map(d => (d.name === originalName ? { ...d, ...updatedDepartment } : d))
    );
    setEmployees(prev => 
      prev.map(emp => emp.domain === originalName ? { ...emp, domain: updatedDepartment.name } : emp)
    )
  };

  const deleteDepartment = async (departmentName: string) => {
     const q = query(collection(db, "employees"), where("domain", "==", departmentName));
     const querySnapshot = await getDocs(q);
     if (!querySnapshot.empty) {
         throw new Error("Impossible de supprimer. Veuillez d'abord réaffecter les employés de ce département.");
     }

    const deptQuery = query(collection(db, "departments"), where("name", "==", departmentName));
    const deptSnapshot = await getDocs(deptQuery);
     if(deptSnapshot.empty) {
        throw new Error("Département non trouvé.");
     }
    const deptDoc = deptSnapshot.docs[0];

    await deleteDoc(deptDoc.ref);
    setDepartments(prev => prev.filter(d => d.name !== departmentName));
  };
  
  const startNewWeek = async () => {
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

    const newArchive: Omit<ArchivedPayroll, 'id'> = {
        period: `Semaine du ${new Date().toLocaleDateString('fr-FR')}`,
        totalPayroll,
        departments: Object.entries(departmentTotals).map(([name, data]) => ({ name, ...data })),
    };
    
    const archiveDocRef = await addDoc(collection(db, 'archives'), newArchive);
    setArchives(prev => [{...newArchive, id: archiveDocRef.id}, ...prev].sort((a,b) => b.period.localeCompare(a.period)));

    // 2. Reset attendance and update wages for the new week in a batch write
    const batch = writeBatch(db);
    const updatedEmployees = employees.map(emp => {
        const empRef = doc(db, 'employees', emp.id);
        const newAttendance = days.reduce((acc, day) => ({ ...acc, [day]: false }), {});
        const newCurrentWeekWage = emp.dailyWage;

        batch.update(empRef, {
            attendance: newAttendance,
            currentWeekWage: newCurrentWeekWage,
        });

        return {
            ...emp,
            attendance: newAttendance,
            currentWeekWage: newCurrentWeekWage
        };
    });
    
    await batch.commit();
    setEmployees(updatedEmployees);
  }

  const value = { employees, departments, archives, addEmployee, updateEmployee, updateAttendance, deleteEmployee, transferEmployee, days, addDepartment, updateDepartment, deleteDepartment, startNewWeek };
  
  return (
    <EmployeeContext.Provider value={value}>
      {loading ? <div className="flex h-screen items-center justify-center">Chargement des données...</div> : children}
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
