import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerPatientSchema, RegisterPatientFormValues } from "@/lib/schemas";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DEPARTMENTS } from "@/lib/utils";
import { Patient, RegisterPatientInput } from "@/types/patient";
import { UserPlus, CheckCircle, AlertCircle, Sparkles } from "lucide-react";

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

  const notesValue = watch("notes") || "";

  const onSubmit = async (values: RegisterPatientFormValues) => {
    setServerError(null);
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
    reset();
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={registeredPatient ? "Registration Confirmed" : "Register New Patient"}
      description={
        registeredPatient
          ? "Patient has been queued successfully."
          : "Enter patient details to automatically assign a queue token and enqueue in FIFO order."
      }
      maxWidth="md"
    >
      {registeredPatient ? (
        <div className="py-2 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500 font-medium">
              Assigned Queue Token
            </div>
            <div className="mt-1 text-3xl font-mono font-black text-navy-950 tracking-wider">
              {registeredPatient.tokenNumber}
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-800">
              {registeredPatient.name}
            </div>
            <div className="mt-1 flex items-center justify-center gap-2">
              <Badge variant="dept">{registeredPatient.department}</Badge>
              <Badge status={registeredPatient.status} />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 max-w-sm mx-auto">
            <Sparkles className="w-4 h-4 text-teal-600 inline mr-1" />
            Patient placed at position{" "}
            <strong>#{registeredPatient.queuePosition || 1}</strong> in the waiting queue.
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" onClick={handleClose}>
              Done / Close
            </Button>
            <Button variant="primary" size="sm" onClick={handleRegisterAnother}>
              <UserPlus className="w-4 h-4 mr-1.5" />
              Register Another Patient
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Patient Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Patient Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Maya Lin or José García"
              {...register("name")}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>
            )}
          </div>

          {/* Department & Age Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                {...register("department")}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {errors.department && (
                <p className="mt-1 text-xs text-rose-600">{errors.department.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Age <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 35"
                min={0}
                max={130}
                {...register("age")}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
              />
              {errors.age && (
                <p className="mt-1 text-xs text-rose-600">{errors.age.message}</p>
              )}
            </div>
          </div>

          {/* Visit Notes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Visit Reason / Note <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {notesValue.length}/250
              </span>
            </div>
            <textarea
              rows={2}
              maxLength={250}
              placeholder="Brief reason for consultation (e.g. fever, blood pressure follow-up)"
              {...register("notes")}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60 resize-none"
            />
            {errors.notes && (
              <p className="mt-1 text-xs text-rose-600">{errors.notes.message}</p>
            )}
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
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
              className="font-semibold"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              Register & Enqueue
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
