import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "./ui/Command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/Popover";
import { api } from "../lib/api";
import { useCompanyStore } from "../store/companyStore";
import { CreateCompanyDialog } from "./CreateCompanyDialog";

interface Company {
  id: string;
  name: string;
}

export function CompanySelector() {
  const [open, setOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const { companyId, companyName, setCompany } = useCompanyStore();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await api.get("/companies");
      console.log("Companies fetched:", response.data);
      setCompanies(response.data);
    } catch (err) {
      console.error("Failed to fetch companies:", err);
      const message = err instanceof Error ? err.message : "Failed to load companies";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[300px] justify-between"
          >
            {loading ? (
              <span className="text-gray-500">Loading companies...</span>
            ) : error ? (
              <span className="text-red-500">{error}</span>
            ) : companyId ? (
              companyName
            ) : (
              "Select company..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search companies..." />
            <CommandEmpty>
              {loading ? (
                "Loading..."
              ) : error ? (
                <div className="p-2 text-center">
                  <div className="text-sm text-red-500 mb-2">{error}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchCompanies()}
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                "No companies found."
              )}
            </CommandEmpty>
            <CommandGroup>
              {companies.map((company) => (
                <CommandItem
                  key={company.id}
                  value={company.id}
                  onSelect={() => {
                    setCompany(company.id, company.name);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      companyId === company.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {company.name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  setIsCreateDialogOpen(true);
                }}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create new company
              </CommandItem>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      <CreateCompanyDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCompanyCreated={(company) => {
          setCompanies((prev) => [...prev, company]);
          setCompany(company.id, company.name);
        }}
      />
    </>
  );
}
