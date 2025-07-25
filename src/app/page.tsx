
'use client';

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator";
import { useEmployees } from "@/context/employee-provider";
import { ChevronRight } from "lucide-react";

export default function LoginPage() {
  const { employees } = useEmployees();
  const domains = [...new Set(employees.map(e => e.domain))];

  return (
    <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center container mx-auto p-4">
      <Card className="mx-auto max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">PayTracker</CardTitle>
          <CardDescription>
            Veuillez sélectionner votre type de connexion.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <Link href="/dashboard" className="w-full">
              <Button className="w-full h-12 text-lg">
                Connexion Administrateur
              </Button>
          </Link>
          
          <div className="relative">
            <Separator />
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                    Ou connectez-vous en tant que Responsable
                </span>
            </div>
          </div>

          <div className="grid gap-2">
            {domains.map(domain => (
                <Link key={domain} href={`/department/${encodeURIComponent(domain)}`} className="w-full">
                    <Button variant="outline" className="w-full justify-between">
                        <span>{domain}</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </Link>
            ))}
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
