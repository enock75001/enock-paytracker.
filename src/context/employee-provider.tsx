
'use client';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { type Employee, type Department, type ArchivedPayroll, type Admin } from '@/lib/types';
import { initialDays } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, addDoc, doc, updateDoc, deleteDoc, getDoc, setDoc, query, where } from 'firebase/firestore';

type EmployeeUpdatePayload = Omit<Employee, 'id' | 'attendance' | 'registrationDate' | 'currentWeekWage' | 'companyId'>;

interface EmployeeContextType {
  employees: Employee[];
  departments: Department[];
  archives: ArchivedPayroll[];
  admins: Admin[];
  companyId: string | null;
  setCompanyId: (companyId: string | null) => void;
  isLoading: boolean;
  addEmployee: (employee: Omit<Employee, 'id' | 'attendance' | 'registrationDate' | 'currentWeekWage' | 'companyId'>) => Promise<void>;
  updateEmployee: (employeeId: string, data: EmployeeUpdatePayload) => Promise<void>;
  updateAttendance: (employeeId: string, day: string, isPresent: boolean) => Promise<void>;
  deleteEmployee: (employeeId: string) => Promise<void>;
  transferEmployee: (employeeId: string, newDomain: string) => Promise<void>;
  days: string[];
  addDepartment: (department: Omit<Department, 'id' | 'companyId'>) => Promise<void>;
  updateDepartment: (originalName: string, updatedDepartment: Omit<Department, 'id' | 'companyId'>) => Promise<void>;
  deleteDepartment: (departmentName: string) => Promise<void>;
  startNewWeek: () => Promise<void>;
  fetchAdmins: () => Promise<void>;
  deleteArchive: (archiveId: string) => Promise<void>;
  fetchDataForCompany: (companyId: string) => Promise<void>;
  clearData: () => void;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider = ({ children }: { children: ReactNode }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [archives, setArchives] = useState<ArchivedPayroll[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const days = initialDays;

  const clearData = useCallback(() => {
    setEmployees([]);
    setDepartments([]);
    setArchives([]);
    setAdmins([]);
    setCompanyId(null);
  }, []);

  const fetchAdmins = useCallback(async () => {
    if (!companyId) return;
    const adminsQuery = query(collection(db, "admins"), where("companyId", "==", companyId));
    const adminsSnapshot = await getDocs(adminsQuery);
    const adminsData = adminsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Admin[];
    setAdmins(adminsData);
  }, [companyId]);

  const fetchDataForCompany = useCallback(async (companyId: string) => {
      setLoading(true);
      try {
          const departmentsQuery = query(collection(db, "departments"), where("companyId", "==", companyId));
          const employeesQuery = query(collection(db, "employees"), where("companyId", "==", companyId));
          const archivesQuery = query(collection(db, "archives"), where("companyId", "==", companyId));

          const [departmentsSnapshot, employeesSnapshot, archivesSnapshot, _] = await Promise.all([
              getDocs(departmentsQuery),
              getDocs(employeesQuery),
              getDocs(archivesQuery),
              fetchAdmins(),
          ]);

          const departmentsData = departmentsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Department[];
          const employeesData = employeesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Employee[];
          const archivesData = archivesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as ArchivedPayroll[];
          
          const safeEmployees = employeesData.map(e => ({...e, currentWeekWage: e.currentWeekWage || e.dailyWage }));

          setDepartments(departmentsData);
          setEmployees(safeEmployees);
          setArchives(archivesData.sort((a,b) => (b.period || "").localeCompare(a.period || "")));
      } catch (error) {
          console.error("Error fetching company data:", error);
      } finally {
          setLoading(false);
      }
  }, [fetchAdmins]);


  useEffect(() => {
      const storedCompanyId = sessionStorage.getItem('companyId');
      if (storedCompanyId) {
          setCompanyId(storedCompanyId);
          fetchDataForCompany(storedCompanyId);
      } else {
          setLoading(false);
      }
  }, [fetchDataForCompany]);


  const addEmployee = async (employeeData: Omit<Employee, 'id' | 'attendance' | 'registrationDate' | 'currentWeekWage' | 'companyId'>) => {
    if (!companyId) throw new Error("Aucune entreprise sélectionnée.");
    const newEmployee: Omit<Employee, 'id'> = {
      ...employeeData,
      companyId,
      registrationDate: new Date().toISOString().split('T')[0],
      attendance: days.reduce((acc, day) => ({ ...acc, [day]: false }), {}),
      photoUrl: employeeData.photoUrl || `https://placehold.co/100x100.png?text=${employeeData.firstName.charAt(0)}${employeeData.lastName.charAt(0)}`,
      currentWeekWage: employeeData.dailyWage,
    };
    const docRef = await addDoc(collection(db, "employees"), newEmployee);
    setEmployees(prev => [...prev, { ...newEmployee, id: docRef.id }]);
  };

  const updateEmployee = async (employeeId: string, data: EmployeeUpdatePayload) => {
    if (!companyId) throw new Error("Aucune entreprise sélectionnée.");
    const docRef = doc(db, "employees", employeeId);
    const { dailyWage, ...restData } = data;
    const employeeToUpdate = employees.find(e => e.id === employeeId);
    
    if (!employeeToUpdate) return;
  
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

  const addDepartment = async (department: Omit<Department, 'id' | 'companyId'>) => {
     if (!companyId) throw new Error("Aucune entreprise sélectionnée.");
     const nameExists = departments.some(d => d.name.toLowerCase() === department.name.toLowerCase());
     if(nameExists) {
        throw new Error("Un département avec ce nom existe déjà.");
     }
    const newDepartment = { ...department, companyId };
    const docRef = await addDoc(collection(db, "departments"), newDepartment);
    setDepartments([...departments, { ...newDepartment, id: docRef.id }]);
  };

  const updateDepartment = async (originalName: string, updatedDepartmentData: Omit<Department, 'id' | 'companyId'>) => {
      if (!companyId) throw new Error("Aucune entreprise sélectionnée.");
      const originalDept = departments.find(d => d.name === originalName);
      if(!originalDept || !originalDept.id) return;

      const nameExists = departments.some(d => d.name.toLowerCase() === updatedDepartmentData.name.toLowerCase() && d.name.toLowerCase() !== originalName.toLowerCase());
      if (nameExists) throw new Error("Un autre département avec ce nouveau nom existe déjà.");

      const isRenaming = originalName !== updatedDepartmentData.name;
      
      const batch = writeBatch(db);
      const oldDeptRef = doc(db, "departments", originalDept.id);

      if(isRenaming) {
        batch.update(oldDeptRef, { ...updatedDepartmentData });
        
        const employeesToUpdateQuery = query(collection(db, 'employees'), where('companyId', '==', companyId), where('domain', '==', originalName));
        const employeesToUpdateSnapshot = await getDocs(employeesToUpdateQuery);
        employeesToUpdateSnapshot.forEach(empDoc => {
            batch.update(doc(db, "employees", empDoc.id), { domain: updatedDepartmentData.name });
        });
      } else {
        batch.update(oldDeptRef, { manager: updatedDepartmentData.manager });
      }
      
      await batch.commit();
      fetchDataForCompany(companyId); // Refetch all data to ensure consistency
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
    if (!companyId) throw new Error("Aucune entreprise sélectionnée.");
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
        companyId,
        period: periodId,
        totalPayroll,
        departments: Object.entries(departmentTotals).map(([name, data]) => ({ name, ...data })),
    };
    
    const batch = writeBatch(db);
    
    const archiveRef = doc(collection(db, "archives"));
    batch.set(archiveRef, newArchiveData);

    const updatedEmployeesForState: Employee[] = [];
    const employeesQuery = query(collection(db, "employees"), where("companyId", "==", companyId));
    const employeesSnapshot = await getDocs(employeesQuery);

    employeesSnapshot.docs.forEach(empDoc => {
        const emp = { id: empDoc.id, ...empDoc.data() } as Employee;
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

    setArchives(prev => [{ ...newArchiveData, id: archiveRef.id }, ...prev].sort((a,b) => (b.period || "").localeCompare(a.period || "")));
    setEmployees(updatedEmployeesForState);
  };
  
  const deleteArchive = async (archiveId: string) => {
    if (!archiveId) return;
    await deleteDoc(doc(db, "archives", archiveId));
    setArchives(prev => prev.filter(archive => archive.id !== archiveId));
  };


  const value = { 
    employees, departments, archives, admins, companyId, setCompanyId, isLoading: loading,
    addEmployee, updateEmployee, updateAttendance, deleteEmployee, transferEmployee, 
    days, addDepartment, updateDepartment, deleteDepartment, startNewWeek, 
    fetchAdmins, deleteArchive, fetchDataForCompany, clearData
  };
  
  return (
    <EmployeeContext.Provider value={value}>
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
