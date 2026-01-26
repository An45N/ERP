import { useState } from 'react';
import { X, BookOpen, Video, FileText, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';

interface HelpResource {
  title: string;
  description: string;
  type: 'doc' | 'video' | 'article';
  url: string;
}

interface InlineHelpProps {
  topic: string;
  resources: HelpResource[];
}

export function InlineHelp({ topic, resources }: InlineHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (type: string) => {
    switch (type) {
      case 'doc': return <FileText className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'article': return <BookOpen className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:text-blue-700"
      >
        <BookOpen className="h-4 w-4 mr-2" />
        Need help with {topic}?
      </Button>
    );
  }

  return (
    <Card className="mt-4 border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Help: {topic}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {resources.map((resource, index) => (
            <a
              key={index}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="text-blue-600 mt-1">
                {getIcon(resource.type)}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{resource.title}</h4>
                <p className="text-sm text-gray-600">{resource.description}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Pre-configured help for common pages
export const helpResources = {
  dashboard: [
    {
      title: 'Dashboard Overview',
      description: 'Learn about key metrics and how to interpret your dashboard',
      type: 'video' as const,
      url: '/help/videos/dashboard-overview',
    },
    {
      title: 'Quick Actions Guide',
      description: 'How to use quick actions to speed up your workflow',
      type: 'doc' as const,
      url: '/help/docs/quick-actions',
    },
  ],
  accounts: [
    {
      title: 'Chart of Accounts Setup',
      description: 'Complete guide to setting up your chart of accounts',
      type: 'video' as const,
      url: '/help/videos/chart-of-accounts',
    },
    {
      title: 'Account Types Explained',
      description: 'Understanding assets, liabilities, equity, revenue, and expenses',
      type: 'article' as const,
      url: '/help/articles/account-types',
    },
  ],
  journalEntries: [
    {
      title: 'Creating Journal Entries',
      description: 'Step-by-step guide to recording transactions',
      type: 'video' as const,
      url: '/help/videos/journal-entries',
    },
    {
      title: 'Double-Entry Accounting Basics',
      description: 'Understanding debits and credits',
      type: 'doc' as const,
      url: '/help/docs/double-entry',
    },
  ],
  invoices: [
    {
      title: 'Invoice Creation Tutorial',
      description: 'How to create and send professional invoices',
      type: 'video' as const,
      url: '/help/videos/creating-invoices',
    },
    {
      title: 'Recording Payments',
      description: 'How to record invoice payments and partial payments',
      type: 'doc' as const,
      url: '/help/docs/recording-payments',
    },
  ],
  reports: [
    {
      title: 'Financial Reports Guide',
      description: 'Understanding and generating financial reports',
      type: 'video' as const,
      url: '/help/videos/financial-reports',
    },
    {
      title: 'Report Customization',
      description: 'How to filter and customize your reports',
      type: 'doc' as const,
      url: '/help/docs/report-customization',
    },
  ],
};
