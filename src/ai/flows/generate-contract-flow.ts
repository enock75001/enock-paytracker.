
'use server';
/**
 * @fileOverview Un agent IA pour générer des contrats de travail.
 *
 * - generateContract - Une fonction qui gère la génération de contrat.
 * - GenerateContractInput - Le type d'entrée pour la fonction.
 * - GenerateContractOutput - Le type de retour pour la fonction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const GenerateContractInputSchema = z.object({
  companyName: z.string().describe("Le nom de l'entreprise."),
  employeeName: z.string().describe("Le nom complet de l'employé."),
  employeeAddress: z.string().describe("L'adresse de l'employé."),
  employeePoste: z.string().describe("Le poste de l'employé."),
  monthlyWage: z.number().describe("Le salaire mensuel brut de l'employé."),
  hireDate: z.string().describe("La date d'embauche au format ISO (ex: 2024-07-29)."),
});
export type GenerateContractInput = z.infer<typeof GenerateContractInputSchema>;

const GenerateContractOutputSchema = z.object({
  contractText: z.string().describe('Le texte complet du contrat de travail généré.'),
});
export type GenerateContractOutput = z.infer<typeof GenerateContractOutputSchema>;

export async function generateContract(input: GenerateContractInput): Promise<GenerateContractOutput> {
  // Format dates for the prompt
  const formattedHireDate = format(new Date(input.hireDate), "d MMMM yyyy", { locale: fr });

  return generateContractFlow({
    ...input,
    hireDate: formattedHireDate, // Pass the formatted date
  });
}

const prompt = ai.definePrompt({
  name: 'generateContractPrompt',
  input: { schema: GenerateContractInputSchema },
  output: { schema: GenerateContractOutputSchema },
  prompt: `Vous êtes un assistant juridique spécialisé en droit du travail ivoirien. Votre tâche est de générer un Contrat de Travail à Durée Déterminée (CDD) simple et standard.

Utilisez les informations suivantes pour remplir le contrat. Assurez-vous que le format est clair, professionnel et utilise des termes juridiques appropriés pour un CDD en Côte d'Ivoire. Le contrat doit inclure les sections essentielles : identification des parties, objet du contrat, fonctions et responsabilités, durée du contrat (fixé à 3 mois pour cet exemple), rémunération, et lieu de travail.

**Informations pour le contrat :**

*   **Entreprise (L'Employeur) :** {{{companyName}}}
*   **Employé(e) :** {{{employeeName}}}
*   **Adresse de l'Employé(e) :** {{{employeeAddress}}}
*   **Poste :** {{{employeePoste}}}
*   **Salaire Mensuel Brut :** {{{monthlyWage}}} FCFA
*   **Date d'entrée en fonction :** {{{hireDate}}}

**Structure du contrat à générer :**

Rédige le contrat en utilisant le formatage Markdown. Commence par un titre clair, suivi des articles.

Exemple de structure :
# CONTRAT DE TRAVAIL A DUREE DETERMINEE

## ARTICLE 1 : PARTIES AU CONTRAT
...

## ARTICLE 2 : OBJET ET NATURE DU CONTRAT
...

## ARTICLE 3 : DUREE DU CONTRAT
Le présent contrat est conclu pour une durée déterminée de trois (3) mois, prenant effet à compter du {{{hireDate}}}.

... et ainsi de suite pour les autres articles.

Assurez-vous de générer uniquement le texte du contrat dans le champ 'contractText'.`,
});

const generateContractFlow = ai.defineFlow(
  {
    name: 'generateContractFlow',
    inputSchema: GenerateContractInputSchema,
    outputSchema: GenerateContractOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
