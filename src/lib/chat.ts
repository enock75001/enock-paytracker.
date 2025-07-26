
'use server';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { type OnlineUser } from './types';

export async function updateUserPresence(userData: Omit<OnlineUser, 'userId'>) {
    const sessionUserId = userData.senderId;
    if (!sessionUserId) return;
    const presenceRef = doc(db, 'online_users', sessionUserId);
    
    const presenceData: Partial<OnlineUser> = { // Use Partial to build the object
        userId: sessionUserId,
        companyId: userData.companyId,
        name: userData.name,
        role: userData.role,
        lastSeen: Date.now(),
    };

    // Only add departmentName if it exists
    if (userData.departmentName) {
        presenceData.departmentName = userData.departmentName;
    }

    await setDoc(presenceRef, presenceData);
}
