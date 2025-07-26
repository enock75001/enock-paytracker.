
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import type { Admin, Company, PayPeriod } from './types';

export async function findCompanyByIdentifier(companyIdentifier: string): Promise<(Company & { id: string }) | null> {
    const q = query(collection(db, "companies"), where("companyIdentifier", "==", companyIdentifier));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const companyDoc = querySnapshot.docs[0];
    return { id: companyDoc.id, ...companyDoc.data() } as Company & { id: string };
}


export async function registerCompany(
    companyName: string, 
    companyIdentifier: string, 
    adminName: string, 
    adminPin: string, 
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
    if (codeDoc.data().isUsed) {
        throw new Error("Ce code d'inscription a déjà été utilisé.");
    }

    const existingCompany = await findCompanyByIdentifier(companyIdentifier);
    if (existingCompany) {
        throw new Error("Une entreprise avec cet identifiant existe déjà.");
    }

    const batch = writeBatch(db);

    // Mark code as used
    batch.update(codeDoc.ref, { isUsed: true });

    const companyRef = doc(collection(db, "companies"));
    const newCompany = { 
        name: companyName,
        companyIdentifier,
        superAdminName: adminName, 
        payPeriod,
        payPeriodStartDate: new Date().toISOString(),
        logoUrl: '',
        description: '',
        registrationDate: new Date().toISOString(),
    };
    batch.set(companyRef, newCompany);

    const adminRef = doc(collection(db, "admins"));
    const newAdmin = {
        companyId: companyRef.id,
        name: adminName,
        pin: adminPin,
        role: 'superadmin'
    };
    batch.set(adminRef, newAdmin);

    await batch.commit();

    return {
        company: { id: companyRef.id, ...newCompany },
        admin: { id: adminRef.id, ...newAdmin }
    };
}


export async function loginAdmin(companyId: string, name: string, pin: string): Promise<(Admin & { id: string }) | null> {
    const q = query(collection(db, "admins"), 
        where("companyId", "==", companyId),
        where("name", "==", name), 
        where("pin", "==", pin)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }
    
    const adminDoc = querySnapshot.docs[0];
    return { id: adminDoc.id, ...adminDoc.data() } as Admin & { id: string };
}

export async function addAdmin(companyId: string, name: string, pin: string): Promise<void> {
    const nameExistsQuery = query(collection(db, "admins"), where("companyId", "==", companyId), where("name", "==", name));
    const nameExistsSnapshot = await getDocs(nameExistsQuery);
    if (!nameExistsSnapshot.empty) {
        throw new Error("Un administrateur avec ce nom existe déjà dans cette entreprise.");
    }
    await addDoc(collection(db, "admins"), { companyId, name, pin, role: 'adjoint' });
}

export async function updateAdminPin(companyId: string, adminId: string, currentPin: string, newPin: string): Promise<void> {
    const adminRef = doc(db, "admins", adminId);
    const adminDoc = await getDoc(adminRef);

    if (!adminDoc.exists() || adminDoc.data().companyId !== companyId) {
        throw new Error("Administrateur non trouvé.");
    }
    
    if(adminDoc.data().pin !== currentPin) {
        throw new Error("Le code PIN actuel est incorrect.");
    }

    await updateDoc(adminRef, { pin: newPin });
}

export async function deleteAdmin(adminId: string): Promise<void> {
    const adminRef = doc(db, "admins", adminId);
    const adminDoc = await getDoc(adminRef);

    if (!adminDoc.exists() || adminDoc.data().role === 'superadmin') {
        throw new Error("Impossible de supprimer cet administrateur.");
    }
    await deleteDoc(adminRef);
}
