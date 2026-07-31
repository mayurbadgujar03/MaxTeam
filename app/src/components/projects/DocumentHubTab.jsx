import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/api/projects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LazyViewerModal } from './LazyViewerModal';
import { useToast } from '@/hooks/use-toast';
import {
  UploadCloud,
  FileText,
  Presentation,
  Sparkles,
  Loader2,
  Download,
  Eye,
  Trash2,
  Clock,
} from 'lucide-react';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function formatFileSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function DocumentHubTab({ project, canManageProject }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const reportInputRef = useRef(null);
  const presentationInputRef = useRef(null);

  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null); // 'report' | 'presentation' | null

  // ── Upload mutation ─────────────────────────────────────────────────────
  const uploadMutation = useMutation({
    mutationFn: ({ projectId, docType, formData }) =>
      projectsApi.uploadDocument(projectId, docType, formData),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', project._id] });
      toast({
        title: 'Document uploaded',
        description: `Your ${variables.docType} has been uploaded successfully.`,
      });
    },
    onError: (err) => {
      toast({
        title: 'Upload failed',
        description: err?.response?.data?.message || err.message || 'Something went wrong.',
        variant: 'destructive',
      });
    },
  });

  // ── Delete mutation ─────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: ({ projectId, docType, versionIndex }) =>
      projectsApi.deleteDocument(projectId, docType, versionIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', project._id] });
      toast({ title: 'Version deleted' });
    },
    onError: (err) => {
      toast({
        title: 'Delete failed',
        description: err?.response?.data?.message || err.message || 'Something went wrong.',
        variant: 'destructive',
      });
    },
  });

  // ── Client-side validation + upload trigger ─────────────────────────────
  const handleFile = (file, docType) => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Only PDF files are allowed.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: `Maximum file size is 5 MB. Your file is ${formatFileSize(file.size)}.`,
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    uploadMutation.mutate({ projectId: project._id, docType, formData });
  };

  // ── Drag & drop handlers ────────────────────────────────────────────────
  const handleDragOver = (e, slot) => {
    e.preventDefault();
    setDragOverSlot(slot);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverSlot(null);
  };

  const handleDrop = (e, docType) => {
    e.preventDefault();
    setDragOverSlot(null);
    const file = e.dataTransfer?.files?.[0];
    handleFile(file, docType);
  };

  // ── Open viewer ─────────────────────────────────────────────────────────
  const openViewer = (doc, docType) => {
    setViewerDoc({ ...doc, docType });
    setIsViewerOpen(true);
  };

  // ── Render a version list for a given doc type ──────────────────────────
  const renderVersionList = (docType, versions, icon, inputRef) => {
    const Icon = icon;
    const colorClass = docType === 'report'
      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    const label = docType === 'report' ? 'Project Report / Thesis' : 'Presentation Slides';
    const isUploading = uploadMutation.isPending
      && uploadMutation.variables?.docType === docType;

    return (
      <Card className="border border-slate-200 dark:border-slate-800 bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className={`rounded-lg p-2 ${colorClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">{label}</CardTitle>
              <CardDescription className="text-xs">
                Max file size: 5 MB (PDF Only) · Up to 3 versions retained
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Version cards */}
          {versions && versions.length > 0 ? (
            <div className="space-y-2">
              {versions.map((doc, idx) => {
                const versionLabel = idx === versions.length - 1
                  ? `Version ${idx + 1} (Latest)`
                  : `Version ${idx + 1}`;

                return (
                  <div
                    key={doc._id || idx}
                    className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors ${idx === versions.length - 1
                      ? 'border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-500/10'
                      : 'border-slate-200 dark:border-slate-800 bg-background'
                      }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${idx === versions.length - 1
                          ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground'
                          }`}>
                          {versionLabel}
                        </span>
                        {doc.isLocked && (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">🔒 Locked</span>
                        )}
                      </div>
                      <p className="text-xs font-semibold truncate mt-1">{doc.fileName}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                        {doc.fileSize && (
                          <span>· {formatFileSize(doc.fileSize)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        title="View document"
                        onClick={() => openViewer(doc, docType)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Download">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                      {canManageProject && !doc.isLocked && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          title="Delete version"
                          disabled={deleteMutation.isPending}
                          onClick={() =>
                            deleteMutation.mutate({
                              projectId: project._id,
                              docType,
                              versionIndex: idx,
                            })
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Upload dropzone (always shown when user can manage) */}
          {canManageProject && (
            <>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  handleFile(file, docType);
                  // Reset so the same file can be re-selected
                  e.target.value = '';
                }}
              />
              <div
                onDragOver={(e) => handleDragOver(e, docType)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, docType)}
                onClick={() => inputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${dragOverSlot === docType
                  ? 'border-indigo-500 bg-indigo-500/5 scale-[1.01]'
                  : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5'
                  }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-7 w-7 text-indigo-500 animate-spin" />
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      Uploading to cloud…
                    </p>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-7 w-7 text-muted-foreground/60" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Drag & drop PDF, or{' '}
                        <span className="text-indigo-500 underline">browse</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Max file size: 5 MB (PDF Only)
                      </p>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* Empty state when viewer-only user and no docs */}
          {!canManageProject && (!versions || versions.length === 0) && (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No documents have been uploaded yet.
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // ── Resolve arrays (graceful fallback for legacy single-object data) ────
  const reportVersions = Array.isArray(project?.documents?.report)
    ? project.documents.report
    : project?.documents?.report?.url
      ? [project.documents.report]
      : [];

  const presentationVersions = Array.isArray(project?.documents?.presentation)
    ? project.documents.presentation
    : project?.documents?.presentation?.url
      ? [project.documents.presentation]
      : [];

  return (
    <div className="space-y-6">
      {/* Overview header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 border rounded-xl bg-card shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Document Repository & Peer Annotations
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Upload project documents (PDF only, max 5 MB). Up to 3 versions are retained — older versions are automatically removed.
          </p>
        </div>

        {/* Quick-open latest report in viewer */}
        {reportVersions.length > 0 && (
          <Button
            onClick={() => openViewer(reportVersions[reportVersions.length - 1], 'report')}
            className="gap-2 shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
          >
            <Sparkles className="h-4 w-4" />
            Open Latest Report
          </Button>
        )}
      </div>

      {/* Document slots grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {renderVersionList('report', reportVersions, FileText, reportInputRef)}
        {renderVersionList('presentation', presentationVersions, Presentation, presentationInputRef)}
      </div>

      {/* Lazy Viewer Modal */}
      {viewerDoc && (
        <LazyViewerModal
          open={isViewerOpen}
          onOpenChange={setIsViewerOpen}
          documentId={viewerDoc._id || project._id}
          documentUrl={viewerDoc.url}
          documentName={viewerDoc.fileName}
          projectId={project._id}
          docType={viewerDoc.docType}
        />
      )}
    </div>
  );
}
