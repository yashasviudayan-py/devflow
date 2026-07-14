"use client";

import { projectSortFields } from "@devflow/shared";
import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyFilteredState } from "@/components/EmptyFilteredState";
import { PaginationControls } from "@/components/PaginationControls";
import { EmptyProjectsState, ProjectList } from "@/components/ProjectList";
import { SearchInput } from "@/components/SearchInput";
import { SortControls } from "@/components/SortControls";
import { Button, buttonClasses } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { getOrganizationProjects, type Project } from "@/lib/api";
import { projectSortOptions } from "@/lib/listOptions";
import {
  mergeSearchParams,
  parseEnumParam,
  parsePageSize,
  parseSortOrder,
  type QueryUpdates,
} from "@/lib/listQuery";
import { useCursorPagination } from "@/lib/useCursorPagination";

type ProjectsSectionProps = {
  organizationId: string;
  canCreate: boolean;
};

/**
 * Search + sort + cursor pagination for an organization's projects. All filter
 * state lives in the URL (shareable, refresh-safe); the page position is local
 * (cursor pagination has no shareable page number), so a refresh restarts at
 * page 1 with filters intact.
 */
export function ProjectsSection({ organizationId, canCreate }: ProjectsSectionProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const q = searchParams.get("q") ?? "";
  const sortBy = parseEnumParam(searchParams.get("sortBy"), projectSortFields);
  const sortOrder = parseSortOrder(searchParams.get("sortOrder"));
  const pageSize = parsePageSize(searchParams.get("limit"));
  // Reset to page 1 whenever the query (not the cursor) changes.
  const filterKey = JSON.stringify({ q, sortBy, sortOrder, pageSize });

  const { cursor, pageIndex, hasPrev, goNext, goPrev } = useCursorPagination(filterKey);

  const [projects, setProjects] = useState<Project[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    setError(null);

    getOrganizationProjects(organizationId, {
      q: q || undefined,
      sortBy,
      sortOrder,
      limit: pageSize,
      cursor,
    })
      .then((page) => {
        if (!isActive) {
          return;
        }
        setProjects(page.projects);
        setNextCursor(page.nextCursor);
      })
      .catch(() => {
        if (isActive) {
          setError("Could not load projects. Please try again.");
        }
      });

    return () => {
      isActive = false;
    };
  }, [organizationId, q, sortBy, sortOrder, pageSize, cursor]);

  function applyParams(updates: QueryUpdates) {
    const query = mergeSearchParams(searchParams, updates);
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  // Only `q` narrows the list; sort/limit just reshape it.
  const isFiltered = q.length > 0;
  const hasProjects = projects !== null && projects.length > 0;
  const showControls = projects !== null && (hasProjects || isFiltered);
  const showPagination = projects !== null && (hasProjects || pageIndex > 0);

  return (
    <section className="mt-10">
      <SectionHeader
        title="Projects"
        actions={
          canCreate && hasProjects ? (
            <Link
              href={`/organizations/${organizationId}/projects/new`}
              className={buttonClasses("primary", "sm")}
            >
              <Plus aria-hidden className="h-4 w-4" strokeWidth={2} />
              New project
            </Link>
          ) : undefined
        }
      />

      {showControls ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={q}
            onChange={(value) => applyParams({ q: value || undefined })}
            placeholder="Search projects…"
            label="Search projects"
          />
          <div className="flex items-center gap-2">
            <SortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              options={projectSortOptions}
              onChange={(next) => applyParams({ sortBy: next.sortBy, sortOrder: next.sortOrder })}
            />
            {isFiltered ? (
              <Button variant="ghost" onClick={() => applyParams({ q: undefined })}>
                Reset
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        {error ? (
          <ErrorState message={error} />
        ) : projects === null ? (
          <LoadingState label="Loading projects…" />
        ) : projects.length === 0 ? (
          isFiltered ? (
            <EmptyFilteredState noun="projects" onReset={() => applyParams({ q: undefined })} />
          ) : (
            <EmptyProjectsState organizationId={organizationId} canCreate={canCreate} />
          )
        ) : (
          <ProjectList projects={projects} organizationId={organizationId} canCreate={canCreate} />
        )}
      </div>

      {showPagination ? (
        <div className="mt-4">
          <PaginationControls
            pageIndex={pageIndex}
            hasPrev={hasPrev}
            hasNext={nextCursor !== null}
            pageSize={pageSize}
            isLoading={projects === null}
            onPrev={goPrev}
            onNext={() => goNext(nextCursor)}
            onPageSizeChange={(size) => applyParams({ limit: size })}
          />
        </div>
      ) : null}
    </section>
  );
}
