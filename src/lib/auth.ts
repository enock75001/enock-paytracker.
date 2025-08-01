

'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import type { Admin, Company, Department, Employee, PayPeriod } from './types';

export async function findCompanyByIdentifier(companyIdentifier: string): Promise<(Company & { id: string }) | null> {
    const q = query(collection(db, "companies"), where("companyIdentifier", "==", companyIdentifier));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const companyDoc = querySnapshot.docs[0];
    const companyData = { id: companyDoc.id, ...companyDoc.data() } as Company & { id: string };

    // Trial Expiration check is universal
    const codeQuery = query(collection(db, "registration_codes"), where("usedByCompanyId", "==", companyDoc.id));
    const codeSnapshot = await getDocs(codeQuery);
    if (!codeSnapshot.empty) {
        const codeDoc = codeSnapshot.docs[0];
        const codeData = codeDoc.data();
        if (codeData.expiresAt && new Date(codeData.expiresAt.toDate()) < new Date()) {
            throw new Error("Votre période d'essai a expiré. Veuillez contacter le propriétaire pour activer votre compte de façon permanente.");
        }
    }
    
    return companyData;
}


export async function registerCompany(
    companyName: string, 
    companyIdentifier: string, 
    adminName: string, 
    adminEmail: string,
    adminPhone: string,
    adminPassword: string, 
    payPeriod: PayPeriod,
    registrationCode: string
): Promise<{company: Company & {id: string}, admin: Admin & {id: string}}> {
    
    // Verify registration code
    const codeQuery = query(collection(db, "registration_codes"), where("code", "==", registrationCode));
    const codeSnapshot = await getDocs(codeQuery);
    if (codeSnapshot.empty) {
        throw new Error("Code d'inscription invalide.");
    }
    const codeDoc = codeSnapshot.docs[0];
    const codeData = codeDoc.data();

    if (codeData.isUsed) {
        throw new Error("Ce code d'inscription a déjà été utilisé.");
    }
    if (codeData.expiresAt && new Date(codeData.expiresAt.toDate()) < new Date()) {
        throw new Error("Ce code d'inscription a expiré.");
    }


    const existingCompany = await findCompanyByIdentifier(companyIdentifier).catch(() => null);
    if (existingCompany) {
        throw new Error("Une entreprise avec cet identifiant existe déjà.");
    }

    const batch = writeBatch(db);
    
    const companyRef = doc(collection(db, "companies"));

    // Mark code as used
    batch.update(codeDoc.ref, { 
        isUsed: true,
        usedByCompanyId: companyRef.id,
        usedByCompanyName: companyName,
    });

    const newCompany = { 
        name: companyName,
        companyIdentifier,
        superAdminName: adminName,
        superAdminEmail: adminEmail, 
        superAdminPhone: adminPhone,
        payPeriod,
        payPeriodStartDate: new Date().toISOString(),
        logoUrl: '',
        description: '',
        registrationDate: new Date().toISOString(),
        status: 'active' as const,
    };
    batch.set(companyRef, newCompany);

    const adminRef = doc(collection(db, "admins"));
    const newAdmin = {
        companyId: companyRef.id,
        name: adminName,
        password: adminPassword,
        role: 'superadmin'
    };
    batch.set(adminRef, newAdmin);

    await batch.commit();

    // TODO: Intégration de l'envoi d'email transactionnel
    // Pour activer cette fonctionnalité, vous devez intégrer un service d'envoi d'email comme SendGrid, Mailgun, ou Resend.
    // Vous pouvez utiliser une Cloud Function Firebase (déclenchée par la création d'une nouvelle entreprise)
    // ou appeler une API Route Next.js depuis cette fonction.
    
    // Exemple de logique à implémenter :
    /*
    const ownerEmail = 'VOTRE_ADRESSE_EMAIL_PROPRIETAIRE@example.com';

    // 1. Envoyer un email de bienvenue à l'administrateur de l'entreprise
    await sendEmail({
        to: adminEmail,
        subject: `Bienvenue sur Enock PayTracker, ${companyName} !`,
        html: `<h1>Bienvenue !</h1><p>Votre entreprise, ${companyName}, a été inscrite avec succès.</p><p>Votre identifiant entreprise est : <strong>${companyIdentifier}</strong></p><p>Vous pouvez maintenant vous connecter à votre espace administrateur.</p>`
    });

    // 2. Envoyer un email de notification au propriétaire du site
    await sendEmail({
        to: ownerEmail,
        subject: `Nouvelle Inscription : ${companyName}`,
        html: `<h1>Nouvelle entreprise inscrite</h1><ul><li>Nom : ${companyName}</li><li>ID : ${companyIdentifier}</li><li>Admin : ${adminName}</li><li>Email : ${adminEmail}</li><li>Téléphone : ${adminPhone}</li></ul>`
    });
    */
    // La fonction `sendEmail` serait une fonction personnalisée qui utilise le SDK de votre service d'email.


    return {
        company: { id: companyRef.id, ...newCompany },
        admin: { id: adminRef.id, ...newAdmin }
    };
}


export async function loginAdmin(companyId: string, name: string, password: string): Promise<(Admin & { id: string }) | null> {
    const q = query(collection(db, "admins"), 
        where("companyId", "==", companyId),
        where("name", "==", name), 
        where("password", "==", password)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }
    
    const adminDoc = querySnapshot.docs[0];
    const adminData = { id: adminDoc.id, ...adminDoc.data() } as Admin & { id: string };

    const companyDoc = await getDoc(doc(db, "companies", companyId));
    if (companyDoc.exists() && companyDoc.data().status === 'suspended' && adminData.role !== 'superadmin') {
        throw new Error("Le compte de cette entreprise est suspendu. Seul le super administrateur peut se connecter.");
    }

    return adminData;
}

export async function loginEmployee(companyId: string, phone: string): Promise<Employee | null> {
    const companyDoc = await getDoc(doc(db, "companies", companyId));
    if (companyDoc.exists() && companyDoc.data().status === 'suspended') {
        throw new Error("Le compte de cette entreprise est temporairement suspendu. Veuillez contacter votre responsable.");
    }

    const q = query(collection(db, "employees"), 
        where("companyId", "==", companyId),
        where("phone", "==", phone)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }
    
    const employeeDoc = querySnapshot.docs[0];
    return { id: employeeDoc.id, ...employeeDoc.data() } as Employee;
}


export async function findManagerByPin(companyId: string, pin: string): Promise<{ manager: Employee, department: Department }> {
    const companyDoc = await getDoc(doc(db, "companies", companyId));
    if (companyDoc.exists() && companyDoc.data().status === 'suspended') {
        throw new Error("Le compte de cette entreprise est temporairement suspendu. Veuillez contacter votre administrateur.");
    }

    // The PIN is the manager's phone number
    const employeesQuery = query(
        collection(db, "employees"),
        where("companyId", "==", companyId),
        where("phone", "==", pin)
    );
    const employeesSnapshot = await getDocs(employeesQuery);

    if (employeesSnapshot.empty) {
        throw new Error("Aucun employé trouvé avec ce code PIN.");
    }
    
    const manager = employeesSnapshot.docs[0].data() as Employee;
    manager.id = employeesSnapshot.docs[0].id;

    const departmentsQuery = query(
        collection(db, "departments"),
        where("companyId", "==", companyId),
        where("managerId", "==", manager.id)
    );
    const departmentsSnapshot = await getDocs(departmentsQuery);
    
    if (departmentsSnapshot.empty) {
        throw new Error("Vous n'êtes pas assigné comme responsable à un département.");
    }
    
    const department = departmentsSnapshot.docs[0].data() as Department;
    department.id = departmentsSnapshot.docs[0].id;
    
    return { manager, department };
}

export async function addAdmin(companyId: string, name: string, password: string): Promise<void> {
    const nameExistsQuery = query(collection(db, "admins"), where("companyId", "==", companyId), where("name", "==", name));
    const nameExistsSnapshot = await getDocs(nameExistsQuery);
    if (!nameExistsSnapshot.empty) {
        throw new Error("Un administrateur avec ce nom existe déjà dans cette entreprise.");
    }
    await addDoc(collection(db, "admins"), { companyId, name, password, role: 'adjoint' });
}

export async function updateAdminPassword(companyId: string, adminId: string, currentPassword: string, newPassword: string): Promise<void> {
    const adminRef = doc(db, "admins", adminId);
    const adminDoc = await getDoc(adminRef);

    if (!adminDoc.exists() || adminDoc.data().companyId !== companyId) {
        throw new Error("Administrateur non trouvé.");
    }
    
    if(adminDoc.data().password !== currentPassword) {
        throw new Error("Le mot de passe actuel est incorrect.");
    }

    await updateDoc(adminRef, { password: newPassword });
}

export async function deleteAdmin(adminId: string): Promise<void> {
    const adminRef = doc(db, "admins", adminId);
    const adminDoc = await getDoc(adminRef);

    if (!adminDoc.exists() || adminDoc.data().role === 'superadmin') {
        throw new Error("Impossible de supprimer cet administrateur.");
    }
    await deleteDoc(adminRef);
}
