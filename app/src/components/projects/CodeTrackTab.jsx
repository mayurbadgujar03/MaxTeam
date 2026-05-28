import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/api/projects';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitCommitHorizontal, ExternalLink, RefreshCw, GitBranch, AlertCircle, Users } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

function CommitTimeline({ commits }) {
  if (!commits || commits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
        <GitCommitHorizontal className="h-8 w-8 opacity-40" />
        <p className="text-sm">No commits found for this member.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* vertical line */}
      <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border" aria-hidden="true" />

      <ul className="space-y-0">
        {commits.map((commit, idx) => (
          <li key={commit.sha} className="relative flex gap-4 pb-6 last:pb-0">
            {/* dot */}
            <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm">
              <GitCommitHorizontal className="h-4 w-4 text-muted-foreground" />
            </span>

            <div className="flex-1 min-w-0 pt-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug line-clamp-2 flex-1">
                  {commit.message.split('\n')[0]}
                </p>
                <a
                  href={commit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  title="View on GitHub"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                  {commit.sha.slice(0, 7)}
                </code>
                <span className="text-xs text-muted-foreground">
                  {commit.author.date
                    ? formatDistanceToNow(new Date(commit.author.date), { addSuffix: true })
                    : 'Unknown date'}
                </span>
                {commit.author.date && (
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    · {format(new Date(commit.author.date), 'MMM d, yyyy HH:mm')}
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MemberCommitTab({ member, commits }) {
  const memberCommits = commits.filter(
    (c) =>
      c.teamMember?.githubUsername?.toLowerCase() ===
      member.githubUsername?.toLowerCase(),
  );

  const initials = member.fullname
    ? member.fullname.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : member.username?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="space-y-6">
      {/* Member header card */}
      <div className="flex items-center gap-4 p-4 rounded-xl border bg-card">
        <Avatar className="h-12 w-12">
          <AvatarImage src={member.avatar?.url} alt={member.fullname || member.username} className="object-cover" />
          <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{member.fullname || member.username}</p>
          <p className="text-sm text-muted-foreground">
            @{member.username} ·{' '}
            <a
              href={`https://github.com/${member.githubUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:underline inline-flex items-center gap-1"
            >
              <GitBranch className="h-3 w-3" />
              {member.githubUsername}
            </a>
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold tabular-nums">{member.commitCount}</p>
          <p className="text-xs text-muted-foreground">commits</p>
        </div>
      </div>

      {/* Timeline */}
      <CommitTimeline commits={memberCommits} />
    </div>
  );
}

export function CodeTrackTab({ projectId }) {
  const [refetchCount, setRefetchCount] = useState(0);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['commits', projectId, refetchCount],
    queryFn: () => projectsApi.getCommits(projectId),
    staleTime: 10 * 60 * 1000, // respect the 10-min backend cache
    retry: false,
  });

  const payload = data?.data;
  const commits = payload?.commits || [];
  const memberSummary = (payload?.memberSummary || []).sort(
    (a, b) => (b.commitCount ?? 0) - (a.commitCount ?? 0),
  );
  const fromCache = payload?.fromCache;

  const handleRefresh = () => {
    setRefetchCount((n) => n + 1);
    refetch();
  };

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-9 w-24 rounded-full" />)}
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────
  if (isError) {
    return (
      <Card className="border-destructive/40">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <AlertCircle className="h-10 w-10 text-destructive/70" />
          <div className="text-center">
            <p className="font-semibold">Could not load commits</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error?.message || 'An unexpected error occurred.'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── No members with github usernames ────────────────────────────────────
  if (memberSummary.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-14 gap-3">
          <Users className="h-10 w-10 text-muted-foreground/40" />
          <div className="text-center">
            <p className="font-semibold">No GitHub usernames configured</p>
            <p className="text-sm text-muted-foreground mt-1">
              Go to the <strong>Members</strong> tab and assign each member's GitHub username to start tracking commits.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Main view ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-muted-foreground" />
            Code Track
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {payload?.totalCommits ?? 0} total commits across {memberSummary.length} tracked member{memberSummary.length !== 1 ? 's' : ''}
            {fromCache && (
              <span className="ml-2 text-xs text-amber-500 dark:text-amber-400">
                · cached
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dataUpdatedAt && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Updated {formatDistanceToNow(new Date(dataUpdatedAt), { addSuffix: true })}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Fetching…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Repo link badge */}
      {payload?.repoUrl && (
        <a
          href={payload.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors border rounded-full px-3 py-1 bg-muted/40"
        >
          <GitBranch className="h-3.5 w-3.5" />
          {payload.repository}
          <ExternalLink className="h-3 w-3" />
        </a>
      )}

      {/* Per-member sub-tabs */}
      <Tabs defaultValue={memberSummary[0]?.githubUsername}>
        <TabsList className="h-auto flex-wrap gap-1 justify-start">
          {memberSummary.map((member) => {
            const initials = member.fullname
              ? member.fullname.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
              : member.username?.charAt(0).toUpperCase() || 'U';

            return (
              <TabsTrigger
                key={member.githubUsername}
                value={member.githubUsername}
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={member.avatar?.url} alt={member.username} className="object-cover" />
                  <AvatarFallback className="text-[9px] font-bold">{initials}</AvatarFallback>
                </Avatar>
                <span className="truncate max-w-[100px]">{member.fullname || member.username}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-1">
                  {member.commitCount}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {memberSummary.map((member) => (
          <TabsContent key={member.githubUsername} value={member.githubUsername} className="mt-6">
            <MemberCommitTab member={member} commits={commits} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
