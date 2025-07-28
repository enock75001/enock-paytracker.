
'use server';
/**
 * @fileOverview Un agent IA pour générer des rapports d'activité.
 *
 * - generateWeeklyReport - Une fonction qui gère la génération de rapport.
 * - GenerateReportInput - Le type d'entrée pour la fonction.
 * - GenerateReportOutput - Le type de retour pour la fonction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateReportInputSchema = z.object({
  totalEmployees: z.number().describe("Le nombre total d'employés."),
  totalPayroll: z.number().describe("La masse salariale totale pour la période."),
  period: z.string().describe("La période couverte par le rapport (ex: Semaine du ... au ...)."),
  recentlyAddedEmployees: z.array(z.string()).describe("Liste des noms des employés récemment ajoutés."),
});
export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;

const GenerateReportOutputSchema = z.object({
  reportText: z.string().describe("Le texte complet du rapport d'activité généré."),
});
export type GenerateReportOutput = z.infer<typeof GenerateReportOutputSchema>;

export async function generateWeeklyReport(input: GenerateReportInput): Promise<GenerateReportOutput> {
  return generateReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateReportPrompt',
  input: { schema: GenerateReportInputSchema },
  output: { schema: GenerateReportOutputSchema },
  prompt: `Vous êtes un assistant de gestion des ressources humaines. Votre tâche est de rédiger un court rapport synthétique et professionnel sur l'activité de la semaine en se basant sur les données fournies.

Le ton doit être informatif et direct. Mettez en évidence les points clés.

**Données de la semaine pour la période : {{{period}}}**

*   **Nombre total d'employés :** {{{totalEmployees}}}
*   **Masse salariale totale :** {{{totalPayroll}}} FCFA
{{#if recentlyAddedEmployees}}
*   **Nouveaux employés cette semaine :** 
{{#each recentlyAddedEmployees}}
    *   {{{this}}}
{{/each}}
{{/if}}

Rédigez une seule phrase ou un paragraphe court (pas plus de 3 phrases) qui résume la situation. Mentionnez la masse salariale, et s'il y a eu de nouvelles embauches, mentionnez-le positivement.

Par exemple : "Pour la période du..., l'activité est stable avec un total de {{{totalEmployees}}} employés et une masse salariale s'élevant à {{{totalPayroll}}} FCFA. Nous souhaitons la bienvenue à nos nouvelles recrues."

Générez uniquement le texte du rapport dans le champ 'reportText'.`,
});

const generateReportFlow = ai.defineFlow(
  {
    name: 'generateReportFlow',
    inputSchema: GenerateReportInputSchema,
    outputSchema: GenerateReportOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
