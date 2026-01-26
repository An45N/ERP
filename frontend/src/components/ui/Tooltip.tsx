import { ReactNode, useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  showIcon?: boolean;
}

export function Tooltip({ 
  content, 
  children, 
  position = 'top',
  showIcon = true 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-y-transparent border-l-transparent',
  };

  return (
    <div className="relative inline-block">
      <div
        className="inline-flex items-center cursor-help"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        tabIndex={0}
        role="tooltip"
        aria-label={content}
      >
        {children || (showIcon && <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />)}
      </div>

      {isVisible && (
        <div className={`absolute z-50 ${positionClasses[position]}`}>
          <div className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 max-w-xs shadow-lg">
            {content}
            <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`} />
          </div>
        </div>
      )}
    </div>
  );
}

interface HelpTextProps {
  children: ReactNode;
  className?: string;
}

export function HelpText({ children, className = '' }: HelpTextProps) {
  return (
    <p className={`text-sm text-gray-500 mt-1 ${className}`}>
      {children}
    </p>
  );
}

interface FieldLabelProps {
  label: string;
  required?: boolean;
  helpText?: string;
  tooltip?: string;
}

export function FieldLabel({ label, required, helpText, tooltip }: FieldLabelProps) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {tooltip && <Tooltip content={tooltip} />}
      </div>
      {helpText && <HelpText>{helpText}</HelpText>}
    </div>
  );
}
