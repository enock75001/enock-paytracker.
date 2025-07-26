
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import type { Admin } from './types';

export async function loginAdmin(name: string, pin: string): Promise<(Admin & { id: string }) | null> {
    const q = query(collection(db, "admins"), where("name", "==", name), where("pin", "==", pin));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }
    
    const adminDoc = querySnapshot.docs[0];
    return { id: adminDoc.id, ...adminDoc.data() } as Admin & { id: string };
}

export async function addAdmin(name: string, pin: string): Promise<void> {
    const nameExistsQuery = query(collection(db, "admins"), where("name", "==", name));
    const nameExistsSnapshot = await getDocs(nameExistsQuery);
    if (!nameExistsSnapshot.empty) {
        throw new Error("Un administrateur avec ce nom existe déjà.");
    }
    await addDoc(collection(db, "admins"), { name, pin, role: 'adjoint' });
}

export async function updateAdminPin(adminId: string, currentPin: string, newPin: string): Promise<void> {
    const adminRef = doc(db, "admins", adminId);
    const adminDoc = await getDoc(adminRef);

    if (!adminDoc.exists()) {
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
