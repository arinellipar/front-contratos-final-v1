import { LoadingSpinner } from "./LoadingSpinner";

export function FullPageLoader({ text = "Carregando..." }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mb-4" text="" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Sistema Fradema
        </h2>
        <p className="text-gray-600">{text}</p>
      </div>
    </div>
  );
}
