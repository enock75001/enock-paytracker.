
'use server';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { type OnlineUser } from './types';

export async function updateUserPresence(userData: Omit<OnlineUser, 'userId'>) {
    const sessionUserId = userData.senderId;
    if (!sessionUserId) return;
    const presenceRef = doc(db, 'online_users', sessionUserId);
    
    const presenceData: OnlineUser = {
        userId: sessionUserId,
        companyId: userData.companyId,
        name: userData.name,
        role: userData.role,
        departmentName: userData.departmentName,
        lastSeen: Date.now(),
    };

    await setDoc(presenceRef, presenceData);
}
