import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const baseUrl = "https://korea90.xyz";
  
  // Structured data for breadcrumbs
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "الرئيسية",
        "item": baseUrl
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 2,
        "name": item.label,
        "item": item.path ? `${baseUrl}${item.path}` : undefined
      }))
    ]
  };

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
      <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 text-xs md:text-sm font-bold" aria-label="Breadcrumb">
      <Link 
        to="/" 
        className="flex items-center gap-1.5 text-slate-400 hover:text-primary transition-colors whitespace-nowrap"
      >
        <Home className="w-3.5 h-3.5" />
        الرئيسية
      </Link>

      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-600 shrink-0 rtl:rotate-180" />
          {item.path ? (
            <Link 
              to={item.path} 
              className="text-slate-400 hover:text-primary transition-colors whitespace-nowrap"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-100 whitespace-nowrap">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
      </nav>
    </>
  );
}
