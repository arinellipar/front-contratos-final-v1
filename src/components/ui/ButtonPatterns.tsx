import React from "react";
import { Button } from "./Button";
import {
  RefreshCw,
  Plus,
  Download,
  Edit,
  Trash2,
  Eye,
  Save,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Padrões de botões consistentes baseados no estilo do botão "Atualizar"
 * Todos os botões seguem o mesmo padrão visual e de tamanho
 */

// Padrão base para todos os botões
const baseButtonClasses =
  "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200";

// Botão Atualizar/Refresh (padrão de referência)
export const RefreshButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  isRefreshing?: boolean;
  className?: string;
}> = ({ onClick, disabled = false, isRefreshing = false, className }) => (
  <Button
    variant="outline"
    onClick={onClick}
    disabled={disabled}
    className={cn(baseButtonClasses, className)}
  >
    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
    {isRefreshing ? "Atualizando..." : "Atualizar"}
  </Button>
);

// Botão Novo/Criar
export const CreateButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  text?: string;
  className?: string;
}> = ({ onClick, disabled = false, text = "Novo", className }) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      baseButtonClasses,
      "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white",
      className
    )}
  >
    <Plus className="h-4 w-4" />
    {text}
  </Button>
);

// Botão Exportar
export const ExportButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  isExporting?: boolean;
  className?: string;
}> = ({ onClick, disabled = false, isExporting = false, className }) => (
  <Button
    variant="outline"
    onClick={onClick}
    disabled={disabled}
    className={cn(baseButtonClasses, className)}
  >
    <Download className="h-4 w-4" />
    {isExporting ? "Exportando..." : "Exportar"}
  </Button>
);

// Botão Editar
export const EditButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  text?: string;
  className?: string;
}> = ({ onClick, disabled = false, text = "Editar", className }) => (
  <Button
    variant="outline"
    onClick={onClick}
    disabled={disabled}
    className={cn(baseButtonClasses, className)}
  >
    <Edit className="h-4 w-4" />
    {text}
  </Button>
);

// Botão Visualizar
export const ViewButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  text?: string;
  className?: string;
}> = ({ onClick, disabled = false, text = "Visualizar", className }) => (
  <Button
    variant="outline"
    onClick={onClick}
    disabled={disabled}
    className={cn(baseButtonClasses, className)}
  >
    <Eye className="h-4 w-4" />
    {text}
  </Button>
);

// Botão Salvar
export const SaveButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  isSaving?: boolean;
  text?: string;
  className?: string;
}> = ({
  onClick,
  disabled = false,
  isSaving = false,
  text = "Salvar",
  className,
}) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      baseButtonClasses,
      "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white",
      className
    )}
  >
    <Save className="h-4 w-4" />
    {isSaving ? "Salvando..." : text}
  </Button>
);

// Botão Excluir
export const DeleteButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  text?: string;
  className?: string;
}> = ({ onClick, disabled = false, text = "Excluir", className }) => (
  <Button
    variant="destructive"
    onClick={onClick}
    disabled={disabled}
    className={cn(baseButtonClasses, className)}
  >
    <Trash2 className="h-4 w-4" />
    {text}
  </Button>
);

// Botão Cancelar
export const CancelButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  text?: string;
  className?: string;
}> = ({ onClick, disabled = false, text = "Cancelar", className }) => (
  <Button
    variant="outline"
    onClick={onClick}
    disabled={disabled}
    className={cn(baseButtonClasses, className)}
  >
    <X className="h-4 w-4" />
    {text}
  </Button>
);

// Botão Secundário Genérico
export const SecondaryButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ onClick, disabled = false, icon, children, className }) => (
  <Button
    variant="outline"
    onClick={onClick}
    disabled={disabled}
    className={cn(baseButtonClasses, className)}
  >
    {icon}
    {children}
  </Button>
);

// Botão Primário Genérico
export const PrimaryButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ onClick, disabled = false, icon, children, className }) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      baseButtonClasses,
      "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white",
      className
    )}
  >
    {icon}
    {children}
  </Button>
);

// Hook para padronizar botões customizados
export const useButtonPattern = () => {
  return {
    baseClasses: baseButtonClasses,
    iconSize: "h-4 w-4",
    createButtonClasses:
      "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white",
    saveButtonClasses:
      "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white",
  };
};
