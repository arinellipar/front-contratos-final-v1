"use client";

import { PageHeader } from "@/components/layout/Pageheader";
import { ContractForm } from "@/components/contracts/ContractForm";
import { Card, CardContent } from "@/components/ui/card";

export default function CreateContractPage() {
  return (
    <>
      <PageHeader
        title="Novo Contrato"
        description="Cadastre um novo contrato no sistema"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Contratos", href: "/contracts" },
          { label: "Novo Contrato" },
        ]}
      />
      <Card>
        <CardContent className="p-6">
          <ContractForm />
        </CardContent>
      </Card>
    </>
  );
}
