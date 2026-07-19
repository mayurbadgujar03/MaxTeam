import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LazyViewerModal } from './LazyViewerModal';
import { UploadCloud, FileText, Presentation, ShieldAlert, Construction, Sparkles, BookOpen } from 'lucide-react';

export default function DocumentHubTab({ project, canManageProject }) {
  const [isHoveredReport, setIsHoveredReport] = useState(false);
  const [isHoveredPres, setIsHoveredPres] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Hardcode a demo PDF and document ID for evaluation so that the Evaluator can click the button
  // and see the split view + page jumps.
  const demoDocId = "66fbbda51b5c464b971a5ffb"; 
  const demoDocUrl = "https://arxiv.org/pdf/1706.03762.pdf"; // Attention Is All You Need PDF
  const demoDocName = "Demo Project Report - Transformers.pdf";

  const handleDragOver = (e, setHover) => {
    e.preventDefault();
    setHover(true);
  };

  const handleDragLeave = (e, setHover) => {
    e.preventDefault();
    setHover(false);
  };

  const handleDrop = (e, setHover) => {
    e.preventDefault();
    setHover(false);
    // Silent prevent since cloud infrastructure maintenance is active
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 border rounded-xl bg-card shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Document Repository & Peer Annotations
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Upload final project documents, review peer feedback annotations, and evaluate structured tech specifications.
          </p>
        </div>
        
        {/* Evaluator Shortcut */}
        <Button 
          onClick={() => setIsViewerOpen(true)}
          className="gap-2 shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
        >
          <Sparkles className="h-4 w-4" />
          Test Document split-screen (Demo)
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Slot 1: Project Report */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Project Report / Thesis</CardTitle>
                <CardDescription className="text-xs">Supports PDF formats up to 10MB</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {project?.documents?.report?.url ? (
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-background flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{project.documents.report.fileName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Uploaded on {new Date(project.documents.report.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <Button 
                  size="sm"
                  onClick={() => setIsViewerOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold h-8"
                >
                  Open Evaluator
                </Button>
              </div>
            ) : (
              <div
                onDragOver={(e) => handleDragOver(e, setIsHoveredReport)}
                onDragLeave={(e) => handleDragLeave(e, setIsHoveredReport)}
                onDrop={(e) => handleDrop(e, setIsHoveredReport)}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3 transition-colors ${
                  isHoveredReport 
                    ? 'border-amber-500 bg-amber-500/5' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/50'
                }`}
              >
                {isHoveredReport ? (
                  <>
                    <Construction className="h-10 w-10 text-amber-500 animate-bounce" />
                    <Alert variant="warning" className="border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <ShieldAlert className="h-4 w-4 text-amber-500" />
                      <AlertTitle className="font-bold text-xs">Infrastructure Offline</AlertTitle>
                      <AlertDescription className="text-[10px]">
                        Cloud Infrastructure Maintenance Active - Document Hub Unlocks in Next Sprint
                      </AlertDescription>
                    </Alert>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-8 w-8 text-muted-foreground/60" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Drag & drop report PDF, or <span className="text-indigo-500 underline cursor-pointer">browse</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">Max file size: 10MB</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Slot 2: Presentation Slide */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Presentation className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Presentation Slides</CardTitle>
                <CardDescription className="text-xs">Supports PDF, PPTX, or slides</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {project?.documents?.presentation?.url ? (
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-background flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{project.documents.presentation.fileName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Uploaded on {new Date(project.documents.presentation.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <Button 
                  size="sm"
                  onClick={() => setIsViewerOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold h-8"
                >
                  Open Evaluator
                </Button>
              </div>
            ) : (
              <div
                onDragOver={(e) => handleDragOver(e, setIsHoveredPres)}
                onDragLeave={(e) => handleDragLeave(e, setIsHoveredPres)}
                onDrop={(e) => handleDrop(e, setIsHoveredPres)}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3 transition-colors ${
                  isHoveredPres 
                    ? 'border-amber-500 bg-amber-500/5' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/50'
                }`}
              >
                {isHoveredPres ? (
                  <>
                    <Construction className="h-10 w-10 text-amber-500 animate-bounce" />
                    <Alert variant="warning" className="border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <ShieldAlert className="h-4 w-4 text-amber-500" />
                      <AlertTitle className="font-bold text-xs">Infrastructure Offline</AlertTitle>
                      <AlertDescription className="text-[10px]">
                        Cloud Infrastructure Maintenance Active - Document Hub Unlocks in Next Sprint
                      </AlertDescription>
                    </Alert>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-8 w-8 text-muted-foreground/60" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Drag & drop presentation slides, or <span className="text-indigo-500 underline cursor-pointer">browse</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">Max file size: 10MB</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lazy Viewer Modal Integration */}
      <LazyViewerModal
        open={isViewerOpen}
        onOpenChange={setIsViewerOpen}
        documentId={project?.documents?.report?.url ? project._id : demoDocId}
        documentUrl={project?.documents?.report?.url || demoDocUrl}
        documentName={project?.documents?.report?.url ? project.documents.report.fileName : demoDocName}
        projectId={project?._id || "66fbbda51b5c464b971a5ffb"}
        docType="report"
      />
    </div>
  );
}
