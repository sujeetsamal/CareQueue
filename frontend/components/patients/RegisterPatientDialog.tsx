"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerPatientSchema, RegisterPatientFormValues } from "@/lib/schemas";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DEPARTMENTS, formatDate } from "@/lib/utils";
import { api } from "@/lib/api";
import { Patient, RegisterPatientInput, SimilarPatient } from "@/types/patient";
import {
  UserPlus,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Users,
  Eye,
  AlertTriangle,
  Clock,
  Loader2,
} from "lucide-react";

interface RegisterPatientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientRegistered: (patient: Patient) => void;
  onSubmitApi: (data: RegisterPatientInput) => Promise<Patient>;
}

export function RegisterPatientDialog({
  isOpen,
  onClose,
  onPatientRegistered,
  onSubmitApi,
}: RegisterPatientDialogProps) {
  const [registeredPatient, setRegisteredPatient] = useState<Patient | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  // Similarity Check State
  const [similarPatients, setSimilarPatients] = useState<SimilarPatient[]>([]);
  const [isSearchingSimilar, setIsSearchingSimilar] = useState(false);
  const [similarityError, setSimilarityError] = useState<string | null>(null);
  const [confirmedActiveDuplicate, setConfirmedActiveDuplicate] = useState(false);
  const [previewPatient, setPreviewPatient] = useState<SimilarPatient | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterPatientFormValues>({
    resolver: zodResolver(registerPatientSchema),
    defaultValues: {
      name: "",
      department: "General Medicine",
      age: "",
      notes: "",
    },
  });

  const nameValue = watch("name") || "";
  const deptValue = watch("department") || "General Medicine";
  const ageValue = watch("age");
  const notesValue = watch("notes") || "";

  // Debounced Similarity Search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmedName = nameValue.trim();
    if (trimmedName.length < 2) {
      setSimilarPatients([]);
      setIsSearchingSimilar(false);
      setSimilarityError(null);
      setConfirmedActiveDuplicate(false);
      return;
    }

    setIsSearchingSimilar(true);
    setSimilarityError(null);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const ageNum = ageValue ? Number(ageValue) : null;
        const results = await api.getSimilarPatients(trimmedName, deptValue, ageNum);
        setSimilarPatients(results);
        setSimilarityError(null);
      } catch (err: unknown) {
        setSimilarityError("Could not verify duplicate records due to a network error.");
      } finally {
        setIsSearchingSimilar(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [nameValue, deptValue, ageValue]);

  // Check if any match is actively waiting
  const hasActiveWaitingMatch = similarPatients.some((p) => p.isWaiting);

  const onSubmit = async (values: RegisterPatientFormValues) => {
    setServerError(null);

    // If an active waiting match exists, require explicit confirmation
    if (hasActiveWaitingMatch && !confirmedActiveDuplicate) {
      setServerError("Please confirm that this is a separate patient registration before proceeding.");
      return;
    }

    try {
      const cleanedData: RegisterPatientInput = {
        name: values.name.trim(),
        department: values.department,
        age:
          values.age !== undefined && values.age !== "" && values.age !== null
            ? Number(values.age)
            : null,
        notes: values.notes?.trim() ? values.notes.trim() : null,
      };

      const result = await onSubmitApi(cleanedData);
      setRegisteredPatient(result);
      onPatientRegistered(result);
    } catch (err: unknown) {
      const error = err as Error;
      setServerError(error.message || "Failed to register patient. Please try again.");
    }
  };

  const handleRegisterAnother = () => {
    setRegisteredPatient(null);
    setServerError(null);
    setSimilarPatients([]);
    setConfirmedActiveDuplicate(false);
    reset({
      name: "",
      department: "General Medicine",
      age: "",
      notes: "",
    });
  };

  const handleClose = () => {
    setRegisteredPatient(null);
    setServerError(null);
    setSimilarPatients([]);
    setConfirmedActiveDuplicate(false);
    reset();
    onClose();
  };

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={handleClose}
        title={registeredPatient ? "Registration Confirmed" : "Register New Patient"}
        description={
          registeredPatient
            ? "Patient has been queued successfully."
            : "Enter patient details to automatically assign a department token and enqueue in FIFO order."
        }
        maxWidth="lg"
      >
        {registeredPatient ? (
          <div className="py-4 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div>
              <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-medium">
                Assigned Queue Token
              </div>
              <div className="mt-1 text-4xl font-mono font-extrabold text-slate-900 dark:text-white tracking-wider">
                {registeredPatient.tokenNumber}
              </div>
              <div className="mt-2 text-base font-bold text-slate-800 dark:text-slate-200">
                {registeredPatient.name}
              </div>
              <div className="mt-1.5 flex items-center justify-center gap-2">
                <Badge variant="dept">{registeredPatient.department}</Badge>
                <Badge status={registeredPatient.status} />
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-navy-800/80 rounded-xl text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto border border-slate-200 dark:border-navy-700">
              <Sparkles className="w-4 h-4 text-brand-500 inline mr-1.5" />
              Patient placed at position{" "}
              <strong>#{registeredPatient.queuePosition || 1}</strong> in the waiting queue.
            </div>

            <div className="pt-3 flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={handleClose}>
                Done / Close
              </Button>
              <Button variant="primary" size="sm" onClick={handleRegisterAnother} className="bg-brand-600 hover:bg-brand-700 text-white">
                <UserPlus className="w-4 h-4 mr-1.5" />
                Register Another Patient
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Patient Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Patient Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Maya Lin or Carlos Mendez"
                  {...register("name")}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 text-base rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
                />
                {isSearchingSimilar && (
                  <div className="absolute right-3 top-3">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                  </div>
                )}
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.name.message}</p>
              )}
            </div>

            {/* Existing Records Section */}
            {nameValue.trim().length >= 2 && (
              <div className="rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50/70 dark:bg-navy-950/50 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <Users className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <span>Possible existing records</span>
                    {similarPatients.length > 0 && (
                      <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                        {similarPatients.length} found
                      </span>
                    )}
                  </div>
                  {isSearchingSimilar && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      Checking records...
                    </span>
                  )}
                </div>

                {similarityError && (
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>{similarityError}</span>
                  </div>
                )}

                {!isSearchingSimilar && !similarityError && similarPatients.length === 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No matching patient records found in database. Proceed with new registration.
                  </p>
                )}

                {similarPatients.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Matches are recommendations based on name similarity, not proof of identity.
                    </p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {similarPatients.map((match) => (
                        <div
                          key={match.id}
                          className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                            match.isWaiting
                              ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/80"
                              : "bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {match.name}
                              </span>
                              <Badge variant="token" className="text-[10px] py-0.5">
                                {match.tokenNumber}
                              </Badge>
                              <Badge status={match.status} className="text-[10px] py-0" />
                            </div>
                            <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                              <span>{match.department}</span>
                              <span>•</span>
                              <span>{formatDate(match.registrationTime)}</span>
                              <span>•</span>
                              <span className="font-mono">{Math.round(match.similarityScore * 100)}% match</span>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewPatient(match)}
                            className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 h-7 px-2"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Active Waiting Warning and Explicit Confirmation */}
                    {hasActiveWaitingMatch && (
                      <div className="p-3 rounded-xl bg-amber-100/70 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                        <div className="flex items-center gap-2 font-bold">
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>Active Waiting Patient Match Detected</span>
                        </div>
                        <p className="leading-relaxed">
                          A patient with a similar name is currently waiting in the queue. Please verify if this is a different individual before registering.
                        </p>
                        <label className="flex items-center gap-2 pt-1 font-semibold cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={confirmedActiveDuplicate}
                            onChange={(e) => setConfirmedActiveDuplicate(e.target.checked)}
                            className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                          />
                          <span>Confirm this is a different patient and continue registration.</span>
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Department & Age Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Department <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register("department")}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 text-base rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.department.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Age <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 35"
                  min={0}
                  max={130}
                  {...register("age")}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 text-base rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
                />
                {errors.age && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.age.message}</p>
                )}
              </div>
            </div>

            {/* Visit Notes */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Visit Reason / Note <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <span className="text-xs text-slate-400">
                  {notesValue.length}/250
                </span>
              </div>
              <textarea
                rows={2}
                maxLength={250}
                placeholder="Brief reason for consultation (e.g. fever, blood pressure follow-up)"
                {...register("notes")}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 text-base rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60 resize-none"
              />
              {errors.notes && (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.notes.message}</p>
              )}
            </div>

            {/* Footer buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                disabled={hasActiveWaitingMatch && !confirmedActiveDuplicate}
                className="font-semibold bg-brand-600 hover:bg-brand-700 text-white"
              >
                <UserPlus className="w-4 h-4 mr-1.5" />
                Register & Enqueue
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* Existing Record Preview Sub-dialog */}
      {previewPatient && (
        <Dialog
          isOpen={true}
          onClose={() => setPreviewPatient(null)}
          title="Existing Patient Record"
          description="Review details of the identified existing record."
          maxWidth="sm"
        >
          <div className="space-y-4 py-2 text-sm text-slate-700 dark:text-slate-300">
            <div className="p-3 bg-slate-50 dark:bg-navy-800 rounded-xl space-y-2 border border-slate-200 dark:border-navy-700">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase">Token</span>
                <Badge variant="token">{previewPatient.tokenNumber}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase">Patient</span>
                <span className="font-bold text-slate-900 dark:text-white">{previewPatient.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase">Department</span>
                <Badge variant="dept">{previewPatient.department}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase">Status</span>
                <Badge status={previewPatient.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase">Registered</span>
                <span>{formatDate(previewPatient.registrationTime)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setPreviewPatient(null)}
                className="bg-brand-600 hover:bg-brand-700 text-white"
              >
                Return to Form
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
