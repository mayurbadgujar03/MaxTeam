import { BatchManagementTab } from '@/components/admin/BatchManagementTab';

export default function BatchesPage() {
  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Batch Management
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Create and manage student batches for your institution workspace.
        </p>
      </div>

      <BatchManagementTab />
    </div>
  );
}
