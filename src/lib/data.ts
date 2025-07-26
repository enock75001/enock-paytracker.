
import { type PayPeriod } from './types';

// This file is now mainly for constants, as mock data is no longer initialized by default.
// The new flow requires a company to register first.

// Use French day names for consistency
export const initialDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];


export const payPeriods: { value: PayPeriod, label: string }[] = [
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'bi-weekly', label: 'Quinzaine (14 jours)' },
    { value: 'monthly', label: 'Mensuel' }
];
