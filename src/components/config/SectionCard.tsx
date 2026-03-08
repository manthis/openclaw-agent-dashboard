'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface SectionCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function SectionCard({ title, icon, children }: SectionCardProps) {
  return (
    <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}
