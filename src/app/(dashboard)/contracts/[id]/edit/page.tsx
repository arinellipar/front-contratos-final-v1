"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

// Define the ContractFormData interface with proper types
interface ContractFormData {
  contrato: string;
  contratante: string;
  contratada: string;
  objeto: string;
  dataContrato: string;
  prazo: string; // This should be string for form inputs
  rescisao?: string;
  multa?: string;
  avisoPrevia?: string;
  observacoes?: string;
  filial: string;
  categoriaContrato: any;
}

export default function EditContractPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<ContractFormData>({
    contrato: "",
    contratante: "",
    contratada: "",
    objeto: "",
    dataContrato: "",
    prazo: "",
    rescisao: "",
    multa: "",
    avisoPrevia: "",
    observacoes: "",
    filial: "",
    categoriaContrato: null,
  });

  useEffect(() => {
    // Fetch contract data
    fetchContractData();
  }, [params.id]);

  const fetchContractData = async () => {
    try {
      const response = await fetch(`/api/contracts/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch contract");

      const data = await response.json();

      // Convert numeric values to strings for form inputs
      const formattedData: Partial<ContractFormData> = {
        contrato: data.contrato,
        contratante: data.contratante,
        contratada: data.contratada,
        objeto: data.objeto,
        dataContrato: data.dataContrato,
        prazo: data.prazo?.toString() || "", // Convert number to string
        rescisao: data.rescisao?.toString() || "",
        multa: data.multa?.toString() || "",
        avisoPrevia: data.avisoPrevia?.toString() || "",
        observacoes: data.observacoes || "",
        filial: data.filial,
        categoriaContrato: data.categoriaContrato,
      };

      setFormData(formattedData as ContractFormData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching contract:", error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Convert string values back to numbers for the API
      const apiData = {
        ...formData,
        prazo: parseInt(formData.prazo) || 0,
        rescisao: formData.rescisao ? parseInt(formData.rescisao) : undefined,
        multa: formData.multa ? parseFloat(formData.multa) : undefined,
        avisoPrevia: formData.avisoPrevia
          ? parseInt(formData.avisoPrevia)
          : undefined,
      };

      const response = await fetch(`/api/contracts/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) throw new Error("Failed to update contract");

      router.push("/dashboard/contracts");
    } catch (error) {
      console.error("Error updating contract:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Contract</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="contrato" className="block text-sm font-medium mb-1">
            Contract Number
          </label>
          <input
            type="text"
            id="contrato"
            name="contrato"
            value={formData.contrato}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label
            htmlFor="contratante"
            className="block text-sm font-medium mb-1"
          >
            Contractor
          </label>
          <input
            type="text"
            id="contratante"
            name="contratante"
            value={formData.contratante}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label
            htmlFor="contratada"
            className="block text-sm font-medium mb-1"
          >
            Contracted Party
          </label>
          <input
            type="text"
            id="contratada"
            name="contratada"
            value={formData.contratada}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label htmlFor="objeto" className="block text-sm font-medium mb-1">
            Object
          </label>
          <textarea
            id="objeto"
            name="objeto"
            value={formData.objeto}
            onChange={handleChange}
            required
            rows={3}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label
            htmlFor="dataContrato"
            className="block text-sm font-medium mb-1"
          >
            Contract Date
          </label>
          <input
            type="date"
            id="dataContrato"
            name="dataContrato"
            value={formData.dataContrato}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label htmlFor="prazo" className="block text-sm font-medium mb-1">
            Term (days)
          </label>
          <input
            type="number"
            id="prazo"
            name="prazo"
            value={formData.prazo}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label htmlFor="rescisao" className="block text-sm font-medium mb-1">
            Termination (days)
          </label>
          <input
            type="number"
            id="rescisao"
            name="rescisao"
            value={formData.rescisao}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label htmlFor="multa" className="block text-sm font-medium mb-1">
            Fine (%)
          </label>
          <input
            type="number"
            id="multa"
            name="multa"
            value={formData.multa}
            onChange={handleChange}
            step="0.01"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label
            htmlFor="avisoPrevia"
            className="block text-sm font-medium mb-1"
          >
            Prior Notice (days)
          </label>
          <input
            type="number"
            id="avisoPrevia"
            name="avisoPrevia"
            value={formData.avisoPrevia}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label
            htmlFor="observacoes"
            className="block text-sm font-medium mb-1"
          >
            Observations
          </label>
          <textarea
            id="observacoes"
            name="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label htmlFor="filial" className="block text-sm font-medium mb-1">
            Branch
          </label>
          <input
            type="text"
            id="filial"
            name="filial"
            value={formData.filial}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/contracts")}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
