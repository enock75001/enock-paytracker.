
'use client';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { type Employee, type Department, type ArchivedPayroll, type Admin, type Company, type PayPeriod, type Adjustment } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, addDoc, doc, updateDoc, deleteDoc, getDoc, setDoc, query, where, arrayUnion, arrayRemove } from 'firebase/firestore';
import { format, startOfWeek, endOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDaysInMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';

type EmployeeUpdatePayload = Omit<Employee, 'id' | 'attendance' | 'registrationDate' | 'currentWeekWage' | 'companyId' | 'adjustments'>;

interface EmployeeContextType {
  employees: Employee[];
  departments: Department[];
  archives: ArchivedPayroll[];
  admins: Admin[];
  company: Company | null;
  companyId: string | null;
  setCompanyId: (companyId: string | null) => void;
  isLoading: boolean;
  addEmployee: (employee: Omit<Employee, 'id' | 'attendance' | 'registrationDate' | 'currentWeekWage' | 'companyId' | 'adjustments'>) => Promise<void>;
  updateEmployee: (employeeId: string, data: EmployeeUpdatePayload) => Promise<void>;
  updateAttendance: (employeeId: string, day: string, isPresent: boolean) => Promise<void>;
  deleteEmployee: (employeeId: string) => Promise<void>;
  transferEmployee: (employeeId: string, newDomain: string) => Promise<void>;
  days: string[];
  weekPeriod: string;
  weekDates: Date[];
  addDepartment: (department: Omit<Department, 'id' | 'companyId'>) => Promise<void>;
  updateDepartment: (originalName: string, updatedDepartment: Omit<Department, 'id' | 'companyId'>) => Promise<void>;
  deleteDepartment: (departmentName: string) => Promise<void>;
  startNewWeek: () => Promise<void>;
  fetchAdmins: () => Promise<void>;
  deleteArchive: (archiveId: string) => Promise<void>;
  fetchDataForCompany: (companyId: string) => Promise<void>;
  clearData: () => void;
  updateCompanyProfile: (data: Partial<Omit<Company, 'id' | 'superAdminName'>>) => Promise<void>;
  addAdjustment: (employeeId: string, adjustment: Omit<Adjustment, 'id' | 'date'>) => Promise<void>;
  deleteAdjustment: (employeeId: string, adjustmentId: string) => Promise<void>;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

const generateDaysAndPeriod = (payPeriod: PayPeriod = 'weekly'): { days: string[], period: string, dates: Date[] } => {
    const today = new Date();
    let startDate, endDate;
    let period: string;

    switch (payPeriod) {
        case 'monthly':
            startDate = startOfMonth(today);
            endDate = endOfMonth(today);
            period = `Mois de ${format(today, 'MMMM yyyy', { locale: fr })}`;
            break;
        case 'bi-weekly':
            const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
            startDate = startOfThisWeek;
            endDate = addDays(startOfThisWeek, 13);
            period = `Quinzaine du ${format(startDate, 'dd MMM', { locale: fr })} au ${format(endDate, 'dd MMM yyyy', { locale: fr })}`;
            break;
        case 'weekly':
        default:
            startDate = startOfWeek(today, { weekStartsOn: 1 });
            endDate = endOfWeek(today, { weekStartsOn: 1 });
            period = `Semaine du ${format(startDate, 'dd MMM', { locale: fr })} au ${format(endDate, 'dd MMM yyyy', { locale: fr })}`;
            break;
    }

    const dates = eachDayOfInterval({ start: startDate, end: endDate });
    const days = dates.map(date => format(date, 'EEEE', { locale: fr }));

    return { days, period, dates };
};

export const EmployeeProvider = ({ children }: { children: ReactNode }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [archives, setArchives] = useState<ArchivedPayroll[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { days, period: weekPeriod, dates: weekDates } = generateDaysAndPeriod(company?.payPeriod);

  const clearData = useCallback(() => {
    setEmployees([]);
    setDepartments([]);
    setArchives([]);
    setAdmins([]);
    setCompany(null);
    setCompanyId(null);
  }, []);

  const fetchAdmins = useCallback(async (cId: string) => {
    if (!cId) return;
    const adminsQuery = query(collection(db, "admins"), where("companyId", "==", cId));
    const adminsSnapshot = await getDocs(adminsQuery);
    const adminsData = adminsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Admin[];
    setAdmins(adminsData);
  }, []);

  const fetchDataForCompany = useCallback(async (cId: string) => {
      setLoading(true);
      try {
          const companyDocRef = doc(db, 'companies', cId);
          const companyDocSnap = await getDoc(companyDocRef);

          if (!companyDocSnap.exists()) {
              throw new Error("Company not found");
          }
          const companyData = { id: companyDocSnap.id, ...companyDocSnap.data() } as Company;
          setCompany(companyData);

          const { days: dynamicDays } = generateDaysAndPeriod(companyData.payPeriod);

          const departmentsQuery = query(collection(db, "departments"), where("companyId", "==", cId));
          const employeesQuery = query(collection(db, "employees"), where("companyId", "==", cId));
          const archivesQuery = query(collection(db, "archives"), where("companyId", "==", cId));

          const [departmentsSnapshot, employeesSnapshot, archivesSnapshot] = await Promise.all([
              getDocs(departmentsQuery),
              getDocs(employeesQuery),
              getDocs(archivesQuery),
          ]);
          
          await fetchAdmins(cId);

          const departmentsData = departmentsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Department[];
          const employeesData = employeesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Employee[];
          const archivesData = archivesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as ArchivedPayroll[];
          
          const safeEmployees = employeesData.map(e => {
            const newAttendance = { ...e.attendance };
            dynamicDays.forEach(day => {
                if (!(day in newAttendance)) {
                    newAttendance[day] = false;
                }
            });
            return {...e, currentWeekWage: e.currentWeekWage || e.dailyWage, attendance: newAttendance, adjustments: e.adjustments || [] };
          });


          setDepartments(departmentsData);
          setEmployees(safeEmployees);
          setArchives(archivesData.sort((a,b) => (b.period || "").localeCompare(a.period || "")));
      } catch (error) {
          console.error("Error fetching company data:", error);
          clearData(); 
      } finally {
          setLoading(false);
      }
  }, [fetchAdmins, clearData]);


  useEffect(() => {
      const storedCompanyId = sessionStorage.getItem('companyId');
      if (storedCompanyId) {
          setCompanyId(storedCompanyId);
          if(!company){ 
            fetchDataForCompany(storedCompanyId);
          }
      } else {
          setLoading(false);
      }
  }, [fetchDataForCompany, company]);


  const addEmployee = async (employeeData: Omit<Employee, 'id' | 'attendance' | 'registrationDate' | 'currentWeekWage' | 'companyId' | 'adjustments'>) => {
    if (!companyId) throw new Error("Aucune entreprise sélectionnée.");
    const newEmployee: Omit<Employee, 'id'> = {
      ...employeeData,
      companyId,
      registrationDate: new Date().toISOString().split('T')[0],
      attendance: days.reduce((acc, day) => ({ ...acc, [day]: false }), {}),
      photoUrl: employeeData.photoUrl || `https://placehold.co/100x100.png?text=${employeeData.firstName.charAt(0)}${employeeData.lastName.charAt(0)}`,
      currentWeekWage: employeeData.dailyWage,
      adjustments: [],
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
      fetchDataForCompany(companyId);
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
        const totalAdjustments = emp.adjustments.reduce((acc, adj) => adj.type === 'bonus' ? acc + adj.amount : acc - adj.amount, 0);
        return total + (daysPresent * weeklyWage) + totalAdjustments;
    }, 0);

    const departmentTotals: { [key: string]: { total: number, employeeCount: number } } = {};

    employees.forEach(emp => {
        if (!departmentTotals[emp.domain]) {
            departmentTotals[emp.domain] = { total: 0, employeeCount: 0 };
        }
        const daysPresent = days.filter(day => emp.attendance[day]).length;
        const weeklyWage = emp.currentWeekWage || emp.dailyWage || 0;
        const totalAdjustments = emp.adjustments.reduce((acc, adj) => adj.type === 'bonus' ? acc + adj.amount : acc - adj.amount, 0);
        departmentTotals[emp.domain].total += (daysPresent * weeklyWage) + totalAdjustments;
        departmentTotals[emp.domain].employeeCount += 1;
    });

    const newArchiveData = {
        companyId,
        period: weekPeriod,
        totalPayroll,
        departments: Object.entries(departmentTotals).map(([name, data]) => ({ name, ...data })),
    };
    
    const batch = writeBatch(db);
    
    const archiveRef = doc(collection(db, "archives"));
    batch.set(archiveRef, newArchiveData);

    const updatedEmployeesForState: Employee[] = [];
    const employeesQuery = query(collection(db, "employees"), where("companyId", "==", companyId));
    const employeesSnapshot = await getDocs(employeesQuery);
    
    const { days: nextPeriodDays } = generateDaysAndPeriod(company?.payPeriod);

    employeesSnapshot.docs.forEach(empDoc => {
        const emp = { id: empDoc.id, ...empDoc.data() } as Employee;
        const empRef = doc(db, "employees", emp.id);
        const newAttendance = nextPeriodDays.reduce((acc, day) => ({ ...acc, [day]: false }), {});
        const newCurrentWeekWage = emp.dailyWage;
        batch.update(empRef, {
            attendance: newAttendance,
            currentWeekWage: newCurrentWeekWage,
            adjustments: [], // Clear adjustments for the new period
        });
        updatedEmployeesForState.push({ ...emp, attendance: newAttendance, currentWeekWage: newCurrentWeekWage, adjustments: [] });
    });
    
    await batch.commit();
    
    if (companyId) {
        fetchDataForCompany(companyId);
    }
  };
  
  const deleteArchive = async (archiveId: string) => {
    if (!archiveId) return;
    await deleteDoc(doc(db, "archives", archiveId));
    setArchives(prev => prev.filter(archive => archive.id !== archiveId));
  };
  
  const updateCompanyProfile = async (data: Partial<Omit<Company, 'id' | 'superAdminName'>>) => {
      if (!companyId) throw new Error("Aucune entreprise sélectionnée.");
      const companyRef = doc(db, 'companies', companyId);
      await updateDoc(companyRef, data);
      setCompany(prev => prev ? { ...prev, ...data } : null);
      if (data.name) {
          sessionStorage.setItem('companyName', data.name);
      }
  };
  
  const addAdjustment = async (employeeId: string, adjustmentData: Omit<Adjustment, 'id' | 'date'>) => {
      const newAdjustment: Adjustment = {
        ...adjustmentData,
        id: uuidv4(),
        date: new Date().toISOString(),
      };
      const employeeRef = doc(db, "employees", employeeId);
      await updateDoc(employeeRef, {
        adjustments: arrayUnion(newAdjustment)
      });
      setEmployees(prev => prev.map(emp => emp.id === employeeId ? { ...emp, adjustments: [...emp.adjustments, newAdjustment] } : emp));
  };

  const deleteAdjustment = async (employeeId: string, adjustmentId: string) => {
      const employee = employees.find(e => e.id === employeeId);
      if (!employee) return;
      const adjustmentToDelete = employee.adjustments.find(adj => adj.id === adjustmentId);
      if (!adjustmentToDelete) return;
      
      const employeeRef = doc(db, "employees", employeeId);
      await updateDoc(employeeRef, {
        adjustments: arrayRemove(adjustmentToDelete)
      });
      setEmployees(prev => prev.map(emp => emp.id === employeeId ? { ...emp, adjustments: emp.adjustments.filter(adj => adj.id !== adjustmentId) } : emp));
  };


  const value = { 
    employees, departments, archives, admins, company, companyId, setCompanyId, isLoading: loading,
    addEmployee, updateEmployee, updateAttendance, deleteEmployee, transferEmployee, 
    days, weekPeriod, weekDates,
    addDepartment, updateDepartment, deleteDepartment, startNewWeek, 
    fetchAdmins: () => companyId ? fetchAdmins(companyId) : Promise.resolve(), 
    deleteArchive, fetchDataForCompany, clearData,
    updateCompanyProfile, addAdjustment, deleteAdjustment
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
