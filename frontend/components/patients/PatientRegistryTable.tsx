"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Patient, PatientStatus, RegistryFilterParams, PagedResponse } from "@/types/patient";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatTime, formatDate, DEPARTMENTS } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  Search,
  Filter,
  ClipboardList,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  ArrowUpDown,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface PatientRegistryTableProps {
  onRefreshNeeded?: () => void;
}

export function PatientRegistryTable({ onRefreshNeeded }: PatientRegistryTableProps) {
  // Filter States
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("ALL");
  const [status, setStatus] = useState<PatientStatus | "ALL">("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination States
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pagedData, setPagedData] = useState<PagedResponse<Patient>>({
    content: [],
    pageNumber: 0,
    pageSize: 10,
    totalElements: 0,
    totalPages: 0,
    isFirst: true,
    isLast: true,
  });

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Fetch paginated data from backend
  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: RegistryFilterParams = {
        page,
        size: pageSize,
        search: search.trim() ? search.trim() : undefined,
        department: department !== "ALL" ? department : undefined,
        status: status !== "ALL" ? status : undefined,
        sortBy,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const result = await api.getPatientsPaged(params);
      setPagedData(result);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Failed to load patient records from database.");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, department, status, sortBy, startDate, endDate]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const clearFilters = () => {
    setSearch("");
    setDepartment("ALL");
    setStatus("ALL");
    setSortBy("newest");
    setStartDate("");
    setEndDate("");
    setPage(0);
  };

  const hasActiveFilters =
    search !== "" ||
    department !== "ALL" ||
    status !== "ALL" ||
    startDate !== "" ||
    endDate !== "" ||
    sortBy !== "newest";

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm overflow-hidden transition-colors duration-200">
      {/* Search & Filter Header */}
      <div className="p-6 border-b border-slate-100 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <ClipboardList className="w-6 h-6 text-brand-600 dark:text-brand-400" />
              Patient Registry
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Search, filter, and review all patient historical records.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 font-semibold inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-950/40"
              >
                <X className="w-3.5 h-3.5" />
                Clear Filters
              </button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPatients}
              disabled={isLoading}
              className="text-xs h-8"
              title="Refresh registry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-brand-500" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Filter Controls Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, token (e.g. GEN-001), or ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Department Select */}
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Select */}
          <div className="relative">
            <ArrowUpDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="newest">Newest Registration</option>
              <option value="oldest">Oldest Registration</option>
              <option value="name_asc">Name (A → Z)</option>
              <option value="name_desc">Name (Z → A)</option>
              <option value="token_asc">Token (Ascending)</option>
              <option value="token_desc">Token (Descending)</option>
              <option value="department_asc">Department</option>
              <option value="status_asc">Status</option>
            </select>
          </div>
        </div>

        {/* Filter Controls Row 2: Date Range & Status Filter */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-navy-800">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(["ALL", "WAITING", "CALLED", "COMPLETED", "CANCELLED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatus(s);
                  setPage(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  status === s
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 border border-slate-200 dark:border-navy-700"
                }`}
              >
                {s === "ALL" ? "All Statuses" : s}
              </button>
            ))}
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Date:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(0);
              }}
              className="px-2 py-1 text-xs rounded-md border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-800 dark:text-slate-200"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(0);
              }}
              className="px-2 py-1 text-xs rounded-md border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="m-5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchPatients} className="text-xs">
            Retry
          </Button>
        </div>
      )}

      {/* Table Content */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 dark:text-brand-400 mb-2" />
          <p className="text-sm">Loading patient records...</p>
        </div>
      ) : pagedData.content.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No Matching Records"
          description="No patients match your search and filter criteria. Try adjusting filters or clearing your query."
          className="m-6 border-0 bg-transparent"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm sm:text-base text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/80 dark:bg-navy-950/60 text-xs uppercase tracking-wider text-slate-400 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-navy-800">
              <tr>
                <th className="py-3.5 px-4">Token</th>
                <th className="py-3.5 px-4">Patient Name</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Age</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Registered At</th>
                <th className="py-3.5 px-4">Called At</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800 font-normal">
              {pagedData.content.map((patient) => (
                <tr
                  key={patient.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-navy-800/60 transition-colors"
                >
                  {/* Token */}
                  <td className="py-3.5 px-4">
                    <Badge variant="token">{patient.tokenNumber}</Badge>
                  </td>

                  {/* Name */}
                  <td className="py-3.5 px-4 text-slate-900 dark:text-white font-semibold">
                    {patient.name}
                  </td>

                  {/* Department */}
                  <td className="py-3.5 px-4">
                    <Badge variant="dept">{patient.department}</Badge>
                  </td>

                  {/* Age */}
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    {patient.age !== null ? `${patient.age} yrs` : "—"}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <Badge status={patient.status} />
                  </td>

                  {/* Registered At */}
                  <td className="py-3.5 px-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    <div>{formatDate(patient.registrationTime)}</div>
                    <div className="text-xs text-slate-400">{formatTime(patient.registrationTime)}</div>
                  </td>

                  {/* Called At */}
                  <td className="py-3.5 px-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {patient.calledTime ? (
                      <div>
                        <div>{formatDate(patient.calledTime)}</div>
                        <div className="text-xs text-slate-400">{formatTime(patient.calledTime)}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPatient(patient)}
                      className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-900 dark:text-white"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="ml-2 text-slate-500 dark:text-slate-400">
            Showing{" "}
            <strong>
              {pagedData.totalElements === 0 ? 0 : page * pageSize + 1}–
              {Math.min((page + 1) * pageSize, pagedData.totalElements)}
            </strong>{" "}
            of <strong>{pagedData.totalElements}</strong> records
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Page {pagedData.totalPages === 0 ? 0 : page + 1} of {pagedData.totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={pagedData.isFirst || isLoading}
              className="h-8 w-8 p-0"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={pagedData.isLast || isLoading}
              className="h-8 w-8 p-0"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <Dialog
          isOpen={true}
          onClose={() => setSelectedPatient(null)}
          title="Patient Record Details"
          description="Complete historical details and consultation status."
          maxWidth="lg"
        >
          <div className="space-y-4 py-2 text-sm text-slate-700 dark:text-slate-300">
            {/* Header Highlight Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Token</span>
                <div className="text-2xl font-mono font-black text-slate-900 dark:text-white mt-0.5">
                  {selectedPatient.tokenNumber}
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {selectedPatient.name}
                  {selectedPatient.age !== null && (
                    <span className="text-sm font-normal text-slate-500 ml-2">
                      ({selectedPatient.age} years)
                    </span>
                  )}
                </div>
              </div>
              <div className="flex sm:flex-col items-start sm:items-end gap-1.5">
                <Badge status={selectedPatient.status} />
                <Badge variant="dept">{selectedPatient.department}</Badge>
              </div>
            </div>

            {/* Timestamps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900">
                <span className="text-xs text-slate-400 uppercase font-semibold">Registered</span>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">
                  {formatDate(selectedPatient.registrationTime)}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  {formatTime(selectedPatient.registrationTime)}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900">
                <span className="text-xs text-slate-400 uppercase font-semibold">Called</span>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">
                  {selectedPatient.calledTime ? formatDate(selectedPatient.calledTime) : "Not yet called"}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  {selectedPatient.calledTime ? formatTime(selectedPatient.calledTime) : "—"}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900">
                <span className="text-xs text-slate-400 uppercase font-semibold">Completed</span>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">
                  {selectedPatient.completedTime ? formatDate(selectedPatient.completedTime) : "In progress / N/A"}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  {selectedPatient.completedTime ? formatTime(selectedPatient.completedTime) : "—"}
                </div>
              </div>
            </div>

            {/* Visit Note */}
            {selectedPatient.notes && (
              <div className="p-3 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900">
                <span className="text-xs text-slate-400 uppercase font-semibold">Visit Note / Reason</span>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                  {selectedPatient.notes}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-navy-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedPatient(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
