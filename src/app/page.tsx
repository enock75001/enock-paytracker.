
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/header";
import { useEmployees } from "@/context/employee-provider";
import { Users, FileText, MessageSquare } from "lucide-react";
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
            <section className="w-full py-12 md:py-24 lg:py-32">
                <div className="container px-4 md:px-6">
                    <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
                        <div className="flex flex-col justify-center space-y-4">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                                    Simplifiez la Gestion de Paie de Votre Entreprise
                                </h1>
                                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                                    Enock PayTracker est l'outil tout-en-un pour suivre les présences, gérer les employés, et automatiser la paie en toute simplicité.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 min-[400px]:flex-row">
                                <Button asChild size="lg">
                                    <Link href="/login">Commencer</Link>
                                </Button>
                            </div>
                        </div>
                        <Image
                            src="https://i.postimg.cc/xdLntsjG/Chat-GPT-Image-27-juil-2025-19-35-13.png"
                            data-ai-hint="payroll management dashboard"
                            width="600"
                            height="400"
                            alt="Hero"
                            className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
                        />
                    </div>
                </div>
            </section>
            
            <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="space-y-2">
                            <Badge>Fonctionnalités Clés</Badge>
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Une Solution Complète</h2>
                            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                De la présence à la paie, en passant par la gestion des avances et la communication interne.
                            </p>
                        </div>
                    </div>
                    <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:gap-16 mt-12">
                        <div className="grid gap-1 text-center">
                            <Users className="h-8 w-8 mx-auto text-primary" />
                            <h3 className="text-lg font-bold">Gestion des Employés</h3>
                            <p className="text-sm text-muted-foreground">
                                Centralisez les informations de vos employés, gérez les départements et suivez les présences sans effort.
                            </p>
                        </div>
                        <div className="grid gap-1 text-center">
                            <FileText className="h-8 w-8 mx-auto text-primary" />
                            <h3 className="text-lg font-bold">Paie Automatisée</h3>
                            <p className="text-sm text-muted-foreground">
                                Générez des fiches de paie précises, gérez les avances sur salaire et archivez vos paiements en un clic.
                            </p>
                        </div>
                        <div className="grid gap-1 text-center">
                            <MessageSquare className="h-8 w-8 mx-auto text-primary" />
                            <h3 className="text-lg font-bold">Communication Intégrée</h3>
                            <p className="text-sm text-muted-foreground">
                                Un système de messagerie interne pour une communication fluide entre administrateurs et responsables.
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
