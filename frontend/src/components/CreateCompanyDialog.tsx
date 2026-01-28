import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { api } from "../lib/api";
import toast from "react-hot-toast";
import { Building2 } from "lucide-react";

interface CreateCompanyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCompanyCreated: (company: { id: string; name: string }) => void;
}

export function CreateCompanyDialog({
  isOpen,
  onClose,
  onCompanyCreated,
}: CreateCompanyDialogProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Company code is required");
      return;
    }
    if (!name.trim()) {
      setError("Company name is required");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await api.post("/companies", { 
        code: code.trim().toUpperCase(),
        name: name.trim() 
      });
      onCompanyCreated(response.data);
      toast.success("Company created successfully");
      setCode("");
      setName("");
      onClose();
    } catch (err) {
      console.error("Failed to create company:", err);
      const message = err instanceof Error ? err.message : "Failed to create company";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <DialogTitle>Create New Company</DialogTitle>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label htmlFor="company-code" className="block text-sm font-medium text-gray-700 mb-2">
              Company Code
            </label>
            <Input
              id="company-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g., COMP001"
              maxLength={50}
              className="w-full"
            />
            <p className="mt-1 text-xs text-gray-500">
              Unique identifier for the company (will be converted to uppercase)
            </p>
          </div>
          <div>
            <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <Input
              id="company-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter company name"
              autoComplete="organization"
              className="w-full"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="min-w-24"
            >
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
