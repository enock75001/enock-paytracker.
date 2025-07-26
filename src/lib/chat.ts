
'use server';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { type OnlineUser } from './types';

export async function updateUserPresence(userData: OnlineUser) {
    if (!userData.userId) return;
    const presenceRef = doc(db, 'online_users', userData.userId);
    await setDoc(presenceRef, userData);
}
