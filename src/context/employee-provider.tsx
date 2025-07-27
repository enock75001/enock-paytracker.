

'use client';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { type Employee, type Department, type ArchivedPayroll, type Admin, type Company, type PayPeriod, type Adjustment, type PayStub, OnlineUser, ChatMessage, Loan, Notification, SiteSettings, AbsenceJustification } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, addDoc, doc, updateDoc, deleteDoc, getDoc, setDoc, query, where, arrayUnion, arrayRemove, orderBy, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { format, startOfWeek, endOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, startOfDay, parseISO, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import { useSession } from '@/hooks/use-session';

type EmployeeUpdatePayload = Omit<Employee, 'id' | 'attendance' | 'registrationDate' | 'currentWeekWage' | 'companyId' | 'adjustments'>;

type ChatMessageMap = {
    [conversationId: string]: ChatMessage[];
};

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
  updateDepartment: (departmentId: string, updatedDepartment: Omit<Department, 'id' | 'companyId'>) => Promise<void>;
  deleteDepartment: (departmentId: string) => Promise<void>;
  startNewWeek: () => Promise<void>;
  fetchAdmins: () => Promise<void>;
  deleteArchive: (archiveId: string) => Promise<void>;
  fetchDataForCompany: (companyId: string) => Promise<void>;
  clearData: () => void;
  updateCompanyProfile: (data: Partial<Omit<Company, 'id' | 'superAdminName'>>) => Promise<void>;
  addAdjustment: (employeeId: string, adjustment: Omit<Adjustment, 'id' | 'date'>) => Promise<void>;
  deleteAdjustment: (employeeId: string, adjustmentId: string) => Promise<void>;
  fetchEmployeePayStubs: (employeeId: string) => Promise<PayStub[]>;
  onlineUsers: OnlineUser[];
  chatMessages: ChatMessageMap;
  sendMessage: (text: string, receiverId: string) => Promise<void>;
  userId: string;
  userRole: 'admin' | 'manager' | 'employee' | null;
  loans: Loan[];
  addLoan: (loanData: Omit<Loan, 'id' | 'balance' | 'status' | 'companyId'>) => Promise<void>;
  updateLoanStatus: (loanId: string, status: Loan['status']) => Promise<void>;
  notifications: Notification[];
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  siteSettings: SiteSettings | null;
  submitAbsenceJustification: (justification: Omit<AbsenceJustification, 'id' | 'companyId' | 'status' | 'submittedAt'>) => Promise<void>;
  justifications: AbsenceJustification[];
  updateJustificationStatus: (justificationId: string, status: 'approved' | 'rejected', reviewedBy: string) => Promise<void>;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

const generateDaysAndPeriod = (payPeriod: PayPeriod = 'weekly', startDateStr?: string): { days: string[], period: string, dates: Date[] } => {
    const referenceDate = startDateStr ? parseISO(startDateStr) : new Date();
    // Fallback to today if the parsed date is invalid
    const today = startOfDay(isNaN(referenceDate.getTime()) ? new Date() : referenceDate);
    let startDate, endDate;
    let period: string;
    
    const weekOptions = { weekStartsOn: 1 as 0 | 1 | 2 | 3 | 4 | 5 | 6 }; // Monday

    switch (payPeriod) {
        case 'monthly':
            startDate = startOfMonth(today);
            endDate = endOfMonth(today);
            period = `Mois de ${format(startDate, 'MMMM yyyy', { locale: fr })}`;
            break;
        case 'bi-weekly':
             startDate = startOfWeek(today, weekOptions);
             endDate = addDays(startDate, 13);
             period = `Quinzaine du ${format(startDate, 'dd MMM', { locale: fr })} au ${format(endDate, 'dd MMM yyyy', { locale: fr })}`;
             break;
        case 'weekly':
        default:
            startDate = startOfWeek(today, weekOptions);
            endDate = endOfWeek(today, weekOptions);
            period = `Semaine du ${format(startDate, 'dd MMM', { locale: fr })} au ${format(endDate, 'dd MMM yyyy', { locale: fr })}`;
            break;
    }

    const allDates = eachDayOfInterval({ start: startDate, end: endDate });
    // getDay() returns 0 for Sunday
    const dates = allDates.filter(date => getDay(date) !== 0);
    const days = dates.map(date => format(date, 'EEEE dd', { locale: fr }));

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
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessageMap>({});
  const [loans, setLoans] = useState<Loan[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [justifications, setJustifications] = useState<AbsenceJustification[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  
  const { sessionData } = useSession();
  const { userId, userRole, companyId: sessionCompanyId } = sessionData;

  const { days, period: weekPeriod, dates: weekDates } = generateDaysAndPeriod(company?.payPeriod, company?.payPeriodStartDate);

  useEffect(() => {
    // Fetch global site settings once
    const settingsRef = doc(db, 'site_settings', 'main');
    const unsubscribe = onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
            setSiteSettings(doc.data() as SiteSettings);
        }
    });
    return () => unsubscribe();
  }, []);

  const clearData = useCallback(() => {
    setEmployees([]);
    setDepartments([]);
    setArchives([]);
    setAdmins([]);
    setCompany(null);
    setCompanyId(null);
    setOnlineUsers([]);
    setChatMessages({});
    setLoans([]);
    setNotifications([]);
    setJustifications([]);
    setLoading(true);
  }, []);

  const fetchAdmins = useCallback(async (cId: string) => {
    if (!cId) return;
    const adminsQuery = query(collection(db, "admins"), where("companyId", "==", cId));
    const adminsSnapshot = await getDocs(adminsQuery);
    const adminsData = adminsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Admin[];
    setAdmins(adminsData);
  }, []);
  
  const fetchDataForCompany = useCallback(async (cId: string) => {
      if (!cId) {
          setLoading(false);
          return;
      }
      setLoading(true);
      try {
          const companyDocRef = doc(db, 'companies', cId);
          const companyDocSnap = await getDoc(companyDocRef);

          if (!companyDocSnap.exists()) {
              throw new Error("Company not found");
          }
          const companyData = { id: companyDocSnap.id, ...companyDocSnap.data() } as Company;
          setCompany(companyData);

          const { days: dynamicDays } = generateDaysAndPeriod(companyData.payPeriod, companyData.payPeriodStartDate);

          const departmentsQuery = query(collection(db, "departments"), where("companyId", "==", cId));
          const employeesQuery = query(collection(db, "employees"), where("companyId", "==", cId));
          const archivesQuery = query(collection(db, "archives"), where("companyId", "==", cId));
          const loansQuery = query(collection(db, "loans"), where("companyId", "==", cId));
          const justificationsQuery = query(collection(db, "justifications"), where("companyId", "==", cId));

          const [departmentsSnapshot, employeesSnapshot, archivesSnapshot, loansSnapshot, justificationsSnapshot] = await Promise.all([
              getDocs(departmentsQuery),
              getDocs(employeesQuery),
              getDocs(archivesQuery),
              getDocs(loansQuery),
              getDocs(justificationsQuery),
          ]);
          
          await fetchAdmins(cId);

          const departmentsData = departmentsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Department[];
          const employeesData = employeesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Employee[];
          const archivesData = archivesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as ArchivedPayroll[];
          const loansData = loansSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Loan[];
          
          const justificationsData = justificationsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as AbsenceJustification[];
          justificationsData.sort((a, b) => {
                const dateA = a.submittedAt ? parseISO(a.submittedAt).getTime() : 0;
                const dateB = b.submittedAt ? parseISO(b.submittedAt).getTime() : 0;
                return dateB - dateA;
            });
          
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
          setEmployees(safeEmployees.sort((a,b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)));
          setArchives(archivesData.sort((a,b) => (b.period || "").localeCompare(a.period || "")));
          setLoans(loansData);
          setJustifications(justificationsData);
      } catch (error) {
          console.error("Error fetching company data:", error);
          clearData(); 
      } finally {
          setLoading(false);
      }
  }, [fetchAdmins, clearData]);

  useEffect(() => {
    if (sessionCompanyId) {
      setCompanyId(sessionCompanyId);
      fetchDataForCompany(sessionCompanyId);
    } else {
      setLoading(false);
    }
  }, [sessionCompanyId, fetchDataForCompany]);

  useEffect(() => {
    if (!companyId || !userId) return;
    
    const setupListeners = () => {
        const listeners: (() => void)[] = [];

        const onlineUsersQuery = query(collection(db, 'online_users'), where('companyId', '==', companyId));
        listeners.push(onSnapshot(onlineUsersQuery, (snapshot) => {
            const users: OnlineUser[] = [];
            snapshot.forEach(doc => {
                const user = doc.data() as OnlineUser;
                if (Date.now() - user.lastSeen < 5 * 60 * 1000) {
                     users.push({ ...user, userId: doc.id });
                }
            });
            setOnlineUsers(users);
        }));
        
        const messagesQuery = query(collection(db, "messages"), where('conversationParticipants', 'array-contains', userId));
        listeners.push(onSnapshot(messagesQuery, (snapshot) => {
          const allMessages = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            timestamp: doc.data().timestamp instanceof Timestamp ? doc.data().timestamp.toMillis() : doc.data().timestamp,
          }));
        
          const newMessagesByConversation: ChatMessageMap = {};
        
          allMessages.forEach(message => {
            if (!newMessagesByConversation[message.conversationId]) {
              newMessagesByConversation[message.conversationId] = [];
            }
            newMessagesByConversation[message.conversationId].push(message as ChatMessage);
          });
          
          for(const conversationId in newMessagesByConversation) {
              newMessagesByConversation[conversationId].sort((a,b) => a.timestamp - b.timestamp);
          }
        
          setChatMessages(prev => ({ ...prev, ...newMessagesByConversation }));
        }));

        if (userRole === 'admin') {
            const notificationsQuery = query(collection(db, 'notifications'), where('companyId', '==', companyId), orderBy('createdAt', 'desc'));
            listeners.push(onSnapshot(notificationsQuery, (snapshot) => {
                const notificationsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Notification[];
                setNotifications(notificationsData);
            }));
        }

        return () => listeners.forEach(unsub => unsub());
    };

    const unsubscribe = setupListeners();
    return () => unsubscribe();
}, [companyId, userId, userRole]);

  const createNotificationForAllAdmins = async (notificationData: Omit<Notification, 'id' | 'companyId' | 'isRead' | 'createdAt'>) => {
        if (!companyId) return;
        
        await addDoc(collection(db, 'notifications'), {
            ...notificationData,
            companyId,
            isRead: false,
            createdAt: new Date().toISOString(),
        });
  };

  const markNotificationAsRead = async (notificationId: string) => {
        const notifRef = doc(db, 'notifications', notificationId);
        await updateDoc(notifRef, { isRead: true });
  };

  const markAllNotificationsAsRead = async () => {
        const batch = writeBatch(db);
        notifications.forEach(n => {
            if (!n.isRead) {
                const notifRef = doc(db, 'notifications', n.id!);
                batch.update(notifRef, { isRead: true });
            }
        });
        await batch.commit();
  }

  const addEmployee = async (employeeData: Omit<Employee, 'id' | 'attendance' | 'registrationDate' | 'currentWeekWage' | 'companyId' | 'adjustments'>) => {
    if (!companyId) throw new Error("Aucune entreprise sélectionnée.");
    const newEmployee: Omit<Employee, 'id'> = {
      ...employeeData,
      companyId,
      registrationDate: new Date().toISOString().split('T')[0],
      attendance: days.reduce((acc, day) => ({ ...acc, [day]: false }), {}),
      photoUrl: employeeData.photoUrl || 'https://i.postimg.cc/xdLntsjG/Chat-GPT-Image-27-juil-2025-19-35-13.png',
      currentWeekWage: employeeData.dailyWage,
      adjustments: [],
    };
    const docRef = await addDoc(collection(db, "employees"), newEmployee);
    setEmployees(prev => [...prev, { ...newEmployee, id: docRef.id }].sort((a,b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)));
    
    createNotificationForAllAdmins({
        title: "Nouvel Employé Ajouté",
        description: `${employeeData.firstName} ${employeeData.lastName} a été ajouté au département ${employeeData.domain}.`,
        link: `/employee/${docRef.id}`,
        type: 'success'
    });
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
    ).sort((a,b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)));
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
    const isManager = departments.some(d => d.managerId === employeeId);
    if (isManager) {
        throw new Error("Cet employé est manager d'un département. Veuillez d'abord assigner un nouveau manager.");
    }
    const hasActiveLoan = loans.some(l => l.employeeId === employeeId && l.status === 'active');
    if (hasActiveLoan) {
      throw new Error("Cet employé a une avance en cours. Veuillez d'abord régler la situation de l'avance.");
    }
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

  const updateDepartment = async (departmentId: string, updatedDepartmentData: Omit<Department, 'id' | 'companyId'>) => {
      if (!companyId) throw new Error("Aucune entreprise sélectionnée.");
      
      const deptRef = doc(db, "departments", departmentId);
      await updateDoc(deptRef, updatedDepartmentData);

      if (companyId) {
        fetchDataForCompany(companyId);
      }
  };

  const deleteDepartment = async (departmentId: string) => {
     const department = departments.find(d => d.id === departmentId);
     if (!department) return;
     const hasEmployees = employees.some(e => e.domain === department.name);
     if (hasEmployees) {
         throw new Error("Impossible de supprimer. Veuillez d'abord réaffecter les employés de ce département.");
     }

     await deleteDoc(doc(db, "departments", departmentId));
     setDepartments(prev => prev.filter(d => d.id !== departmentId));
  };
  
  const startNewWeek = async () => {
    if (!companyId || !company) throw new Error("Aucune entreprise sélectionnée.");
    
    const batch = writeBatch(db);

    const totalPayroll = employees.reduce((total, emp) => {
        const daysPresent = days.filter(day => emp.attendance[day]).length;
        const weeklyWage = emp.currentWeekWage || emp.dailyWage || 0;
        const totalAdjustments = (emp.adjustments || []).reduce((acc, adj) => adj.type === 'bonus' ? acc + adj.amount : acc - adj.amount, 0);
        
        const activeLoan = loans.find(l => l.employeeId === emp.id && l.status === 'active');
        const loanRepayment = activeLoan ? Math.min(activeLoan.balance, activeLoan.repaymentAmount) : 0;
        
        return total + (daysPresent * weeklyWage) + totalAdjustments - loanRepayment;
    }, 0);
    
    const departmentTotals: { [key: string]: { total: number, employeeCount: number } } = {};
    employees.forEach(emp => {
        if (!departmentTotals[emp.domain]) {
            departmentTotals[emp.domain] = { total: 0, employeeCount: 0 };
        }
        const daysPresent = days.filter(day => emp.attendance[day]).length;
        const weeklyWage = emp.currentWeekWage || emp.dailyWage || 0;
        const totalAdjustments = (emp.adjustments || []).reduce((acc, adj) => adj.type === 'bonus' ? acc + adj.amount : acc - adj.amount, 0);

        const activeLoan = loans.find(l => l.employeeId === emp.id && l.status === 'active');
        const loanRepayment = activeLoan ? Math.min(activeLoan.balance, activeLoan.repaymentAmount) : 0;
        
        departmentTotals[emp.domain].total += (daysPresent * weeklyWage) + totalAdjustments - loanRepayment;
        departmentTotals[emp.domain].employeeCount += 1;
    });

    const newArchiveData = {
        companyId,
        period: weekPeriod,
        totalPayroll,
        departments: Object.entries(departmentTotals).map(([name, data]) => ({ name, ...data })),
    };
    
    const archiveRef = doc(collection(db, "archives"));
    batch.set(archiveRef, newArchiveData);

    const { days: nextPeriodDays } = generateDaysAndPeriod(company?.payPeriod, company?.payPeriodStartDate);
    const payDate = new Date().toISOString();

    for (const emp of employees) {
        const empRef = doc(db, "employees", emp.id);

        const daysPresent = days.filter(day => emp.attendance[day]).length;
        const currentWage = emp.currentWeekWage || emp.dailyWage || 0;
        const basePay = daysPresent * currentWage;
        const totalAdjustments = (emp.adjustments || []).reduce((acc, adj) => adj.type === 'bonus' ? acc + adj.amount : acc - adj.amount, 0);
        
        const activeLoan = loans.find(l => l.employeeId === emp.id && l.status === 'active');
        const loanRepayment = activeLoan ? Math.min(activeLoan.balance, activeLoan.repaymentAmount) : 0;
        
        const totalPay = basePay + totalAdjustments - loanRepayment;

        const payStub: Omit<PayStub, 'id'> = {
            companyId,
            employeeId: emp.id,
            employeeName: `${emp.firstName} ${emp.lastName}`,
            period: weekPeriod,
            payDate,
            daysPresent,
            dailyWageAtTime: currentWage,
            basePay,
            adjustments: emp.adjustments || [],
            totalAdjustments,
            loanRepayment,
            totalPay,
        };
        const payStubRef = doc(collection(db, "pay_stubs"));
        batch.set(payStubRef, payStub);
        
        if (activeLoan && loanRepayment > 0) {
            const loanRef = doc(db, "loans", activeLoan.id);
            const newBalance = activeLoan.balance - loanRepayment;
            const newStatus = newBalance <= 0 ? 'repaid' : 'active';
            batch.update(loanRef, { balance: newBalance, status: newStatus });

            if (newStatus === 'repaid') {
                 createNotificationForAllAdmins({
                    title: "Avance Remboursée",
                    description: `L'avance de ${emp.firstName} ${emp.lastName} a été entièrement remboursée.`,
                    link: `/employee/${emp.id}`,
                    type: 'success'
                });
            }
        }
        
        const newAttendance = nextPeriodDays.reduce((acc, day) => ({ ...acc, [day]: false }), {});
        const newCurrentWeekWage = emp.dailyWage;
        batch.update(empRef, {
            attendance: newAttendance,
            currentWeekWage: newCurrentWeekWage,
            adjustments: [],
        });
    }
    
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
      setEmployees(prev => prev.map(emp => emp.id === employeeId ? { ...emp, adjustments: [...(emp.adjustments || []), newAdjustment] } : emp));
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

    const fetchEmployeePayStubs = async (employeeId: string): Promise<PayStub[]> => {
        if (!companyId) return [];
        const q = query(
            collection(db, "pay_stubs"), 
            where("companyId", "==", companyId), 
            where("employeeId", "==", employeeId)
        );
        const querySnapshot = await getDocs(q);
        const stubs = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as PayStub[];
        stubs.sort((a, b) => {
          const dateA = a.payDate ? parseISO(a.payDate).getTime() : 0;
          const dateB = b.payDate ? parseISO(b.payDate).getTime() : 0;
          return dateB - dateA;
        });
        return stubs;
    };
    
  const sendMessage = async (text: string, receiverId: string) => {
    if (!userId) {
        console.error("Attempted to send message without a userId.");
        return;
    };
    const conversationId = [userId, receiverId].sort().join('_');
    const conversationParticipants = [userId, receiverId];
    await addDoc(collection(db, 'messages'), {
      conversationId,
      conversationParticipants,
      senderId: userId,
      receiverId,
      text,
      timestamp: serverTimestamp(),
      read: false,
    });
  };

  const addLoan = async (loanData: Omit<Loan, 'id' | 'balance' | 'status' | 'companyId'>) => {
    if (!companyId) throw new Error("Company ID is missing");
    const newLoan: Omit<Loan, 'id'> = {
      ...loanData,
      companyId,
      balance: loanData.amount,
      status: 'active',
    };
    const docRef = await addDoc(collection(db, "loans"), newLoan);
    setLoans(prev => [...prev, { ...newLoan, id: docRef.id }]);
  };

  const updateLoanStatus = async (loanId: string, status: Loan['status']) => {
    const loanRef = doc(db, "loans", loanId);
    await updateDoc(loanRef, { status });
    setLoans(prev => prev.map(l => l.id === loanId ? { ...l, status } : l));
  };
  
  const submitAbsenceJustification = async (justificationData: Omit<AbsenceJustification, 'id' | 'companyId' | 'status' | 'submittedAt' | 'reviewedAt' | 'reviewedBy'>) => {
    if (!companyId) throw new Error("Company ID is missing");
    const newJustification: Omit<AbsenceJustification, 'id'> = {
      ...justificationData,
      companyId,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, "justifications"), newJustification);
    setJustifications(prev => [{...newJustification, id: docRef.id}, ...prev]);
    
    createNotificationForAllAdmins({
        title: "Nouvelle Justification d'Absence",
        description: `${justificationData.employeeName} a soumis une justification pour le ${justificationData.dayName}.`,
        link: `/department/${encodeURIComponent(justificationData.departmentName)}`,
        type: 'info'
    });
  };

  const updateJustificationStatus = async (justificationId: string, status: 'approved' | 'rejected', reviewedBy: string) => {
    const justification = justifications.find(j => j.id === justificationId);
    if (!justification) return;

    const justificationRef = doc(db, "justifications", justificationId);
    
    await updateDoc(justificationRef, { 
        status, 
        reviewedBy,
        reviewedAt: new Date().toISOString(),
    });

    const updatedJustification = { ...justification, status, reviewedBy };
    setJustifications(prev => prev.map(j => j.id === justificationId ? updatedJustification : j));
    
    if (status === 'approved') {
        await updateAttendance(justification.employeeId, justification.dayName, true);
    }

    createNotificationForAllAdmins({
        title: `Justification ${status === 'approved' ? 'Approuvée' : 'Rejetée'}`,
        description: `La justification de ${justification.employeeName} a été ${status === 'approved' ? 'approuvée' : 'rejetée'} par ${reviewedBy}.`,
        link: `/employee/${justification.employeeId}`,
        type: status === 'approved' ? 'success' : 'warning'
    });
  };

  const value = { 
    employees, departments, archives, admins, company, companyId, setCompanyId, isLoading: loading,
    addEmployee, updateEmployee, updateAttendance, deleteEmployee, transferEmployee, 
    days, weekPeriod, weekDates,
    addDepartment, updateDepartment, deleteDepartment, startNewWeek, 
    fetchAdmins: () => companyId ? fetchAdmins(companyId) : Promise.resolve(), 
    deleteArchive, fetchDataForCompany, clearData,
    updateCompanyProfile, addAdjustment, deleteAdjustment,
    fetchEmployeePayStubs,
    onlineUsers,
    chatMessages,
    sendMessage,
    userId: userId || '',
    userRole,
    loans,
    addLoan,
    updateLoanStatus,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    siteSettings,
    submitAbsenceJustification,
    justifications,
    updateJustificationStatus
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
