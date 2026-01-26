import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { Search, X, Plus, Trash2 } from 'lucide-react';

export interface SearchFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: string | string[];
  value2?: string; // For 'between' operator
}

interface AdvancedSearchProps {
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select';
    options?: Array<{ value: string; label: string }>;
  }>;
  onSearch: (filters: SearchFilter[]) => void;
  onClear: () => void;
}

export function AdvancedSearch({ fields, onSearch, onClear }: AdvancedSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilter[]>([
    { field: fields[0]?.key || '', operator: 'contains', value: '' }
  ]);

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'between', label: 'Between' },
    { value: 'in', label: 'In (comma-separated)' },
  ];

  const handleAddFilter = () => {
    setFilters([...filters, { field: fields[0]?.key || '', operator: 'contains', value: '' }]);
  };

  const handleRemoveFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleFilterChange = (index: number, key: keyof SearchFilter, value: any) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [key]: value };
    setFilters(newFilters);
  };

  const handleSearch = () => {
    const validFilters = filters.filter(f => f.value && f.value !== '');
    onSearch(validFilters);
    setIsOpen(false);
  };

  const handleClear = () => {
    setFilters([{ field: fields[0]?.key || '', operator: 'contains', value: '' }]);
    onClear();
    setIsOpen(false);
  };

  const getFieldType = (fieldKey: string) => {
    return fields.find(f => f.key === fieldKey)?.type || 'text';
  };

  const getFieldOptions = (fieldKey: string) => {
    return fields.find(f => f.key === fieldKey)?.options || [];
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Search className="h-4 w-4" />
        Advanced Search
        {filters.some(f => f.value) && (
          <span className="ml-1 px-2 py-0.5 text-xs bg-primary text-white rounded-full">
            {filters.filter(f => f.value).length}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 z-50 w-[600px]">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Advanced Search</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filters.map((filter, index) => (
                  <div key={index} className="flex items-start gap-2">
                    {/* Field */}
                    <select
                      value={filter.field}
                      onChange={(e) => handleFilterChange(index, 'field', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {fields.map((field) => (
                        <option key={field.key} value={field.key}>
                          {field.label}
                        </option>
                      ))}
                    </select>

                    {/* Operator */}
                    <select
                      value={filter.operator}
                      onChange={(e) => handleFilterChange(index, 'operator', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {operators.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>

                    {/* Value */}
                    <div className="flex-1">
                      {getFieldType(filter.field) === 'select' ? (
                        <select
                          value={filter.value as string}
                          onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Select...</option>
                          {getFieldOptions(filter.field).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          type={getFieldType(filter.field)}
                          value={filter.value as string}
                          onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
                          placeholder="Value"
                        />
                      )}
                    </div>

                    {/* Value 2 (for between) */}
                    {filter.operator === 'between' && (
                      <Input
                        type={getFieldType(filter.field)}
                        value={filter.value2 || ''}
                        onChange={(e) => handleFilterChange(index, 'value2', e.target.value)}
                        placeholder="To"
                        className="flex-1"
                      />
                    )}

                    {/* Remove */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFilter(index)}
                      disabled={filters.length === 1}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {/* Add Filter */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddFilter}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Filter
                </Button>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={handleSearch} className="flex-1">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  <Button variant="outline" onClick={handleClear} className="flex-1">
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
