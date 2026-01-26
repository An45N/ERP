import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      <Link 
        to="/" 
        className="hover:text-gray-900 transition-colors"
        aria-label="Home"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={index} className="flex items-center space-x-2">
            <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
            {item.href && !isLast ? (
              <Link 
                to={item.href} 
                className="hover:text-gray-900 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span 
                className={isLast ? 'text-gray-900 font-medium' : ''}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
