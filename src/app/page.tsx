
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/header";
import { useEmployees } from "@/context/employee-provider";
import { Users, FileText, MessageSquare, Briefcase, BarChart, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";


export default function LandingPage() {
  const { siteSettings } = useEmployees();

  if (siteSettings?.isUnderMaintenance) {
      return (
          <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 flex items-center justify-center container mx-auto p-4">
                  <Card className="mx-auto max-w-md w-full text-center">
                      <CardHeader>
                          <CardTitle className="text-2xl font-headline">Site en Maintenance</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <p>{siteSettings.maintenanceMessage}</p>
                      </CardContent>
                  </Card>
              </main>
          </div>
      )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1">
            <section className="w-full py-20 md:py-28 lg:py-32">
                <div className="container px-4 md:px-6">
                    <div className="grid gap-6 lg:grid-cols-[1fr_550px] lg:gap-12 xl:grid-cols-[1fr_650px]">
                        <div className="flex flex-col justify-center space-y-6">
                            <div className="space-y-4">
                                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                                    La Gestion de Paie Intelligente, Réinventée.
                                </h1>
                                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                                    Enock PayTracker est la plateforme tout-en-un pour les entreprises modernes. Suivi des présences, gestion des employés, et paie automatisée, le tout avec la puissance de l'IA.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 min-[400px]:flex-row">
                                <Button asChild size="lg">
                                    <Link href="/login">Accéder à mon espace</Link>
                                </Button>
                                 <Button asChild size="lg" variant="outline">
                                    <Link href="/login">Inscrire mon entreprise</Link>
                                </Button>
                            </div>
                        </div>
                        <Image
                            src="https://i.postimg.cc/xdLntsjG/Chat-GPT-Image-27-juil-2025-19-35-13.png"
                            data-ai-hint="payroll management dashboard"
                            width="650"
                            height="400"
                            alt="Hero"
                            className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last"
                        />
                    </div>
                </div>
            </section>
            
            <section className="w-full py-20 md:py-28 lg:py-32 bg-secondary">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Une Plateforme Complète et Intuitive</h2>
                            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                Tout ce dont vous avez besoin pour gérer efficacement votre personnel et vos finances, en un seul endroit.
                            </p>
                        </div>
                    </div>
                    <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:gap-16 mt-16">
                        <div className="grid gap-2 text-center">
                            <Users className="h-10 w-10 mx-auto text-primary" />
                            <h3 className="text-xl font-bold">Gestion du Personnel</h3>
                            <p className="text-sm text-muted-foreground">
                                Centralisez les informations, gérez les départements et suivez les présences sans effort.
                            </p>
                        </div>
                        <div className="grid gap-2 text-center">
                            <FileText className="h-10 w-10 mx-auto text-primary" />
                            <h3 className="text-xl font-bold">Paie et Finances</h3>
                            <p className="text-sm text-muted-foreground">
                                Générez des fiches de paie précises, gérez les avances sur salaire et archivez vos paiements en un clic.
                            </p>
                        </div>
                        <div className="grid gap-2 text-center">
                            <Shield className="h-10 w-10 mx-auto text-primary" />
                            <h3 className="text-xl font-bold">Administration Simplifiée</h3>
                            <p className="text-sm text-muted-foreground">
                                Contrôlez les accès, gérez les justifications d'absence et communiquez via la messagerie interne.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
        
        <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
            <p className="text-xs text-muted-foreground">&copy; 2024 Enock PayTracker. Tous droits réservés.</p>
            <nav className="sm:ml-auto flex gap-4 sm:gap-6">
                <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
                    Termes et Conditions
                </Link>
                <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
                    Politique de Confidentialité
                </Link>
            </nav>
        </footer>
    </div>
  )
}
