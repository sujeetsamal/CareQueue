"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api, ApiClientError } from "@/lib/api";
import { Patient, QueueStats, RegisterPatientInput } from "@/types/patient";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar, NavTab } from "@/components/layout/Sidebar";
import { StatCard } from "@/components/dashboard/StatCard";
import { CurrentPatientCard } from "@/components/dashboard/CurrentPatientCard";
import { WaitingQueueTable } from "@/components/dashboard/WaitingQueueTable";
import { RecentCallsStackPanel } from "@/components/dashboard/RecentCallsStackPanel";
import { PatientRegistryTable } from "@/components/patients/PatientRegistryTable";
import { DsaExplanationView } from "@/components/dashboard/DsaExplanationView";
import { RegisterPatientDialog } from "@/components/patients/RegisterPatientDialog";
import { ConfirmActionDialog } from "@/components/ui/ConfirmActionDialog";
import {
  Users,
  PhoneCall,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from "lucide-react";

export default function CareQueueDashboard() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<NavTab>("overview");

  // Core Data State
  const [waitingQueue, setWaitingQueue] = useState<Patient[]>([]);
  const [recentCalls, setRecentCalls] = useState<Patient[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<QueueStats>({
    waitingCount: 0,
    calledTodayCount: 0,
    completedTodayCount: 0,
    averageWaitTimeMinutes: null,
  });

  // UI & Network States
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isCallingNext, setIsCallingNext] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Dialog States
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    action: async () => {},
  });

  // Show auto-dismissing toast notification
  const showToast = useCallback(
    (text: string, type: "success" | "error" | "info" = "success") => {
      setToastMessage({ text, type });
      setTimeout(() => setToastMessage(null), 4000);
    },
    []
  );

  // Fetch all dashboard data from backend
  const fetchData = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setIsRefreshing(true);
      setErrorMessage(null);

      try {
        const [healthRes, queueRes, recentRes, statsRes, patientsRes] =
          await Promise.all([
            api.checkHealth(),
            api.getWaitingQueue(),
            api.getRecentCalls(),
            api.getDashboardStats(),
            api.getPatients(),
          ]);

        setIsConnected(healthRes.status === "UP");
        setWaitingQueue(queueRes);
        setRecentCalls(recentRes);
        setStats(statsRes);
        setAllPatients(patientsRes);
      } catch (err: unknown) {
        setIsConnected(false);
        const error = err as Error;
        setErrorMessage(
          error.message ||
            "Unable to reach the CareQueue Spring Boot backend at " +
              (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api")
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  // Initial data load on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derive currently called patient (top of recent calls if status == CALLED)
  const currentCalledPatient =
    recentCalls.length > 0 && recentCalls[0].status === "CALLED"
      ? recentCalls[0]
      : null;

  // Operation: Call Next Patient
  const handleCallNext = async () => {
    setIsCallingNext(true);
    try {
      const called = await api.callNextPatient();
      showToast(
        `Called ${called.name} (Token ${called.tokenNumber}) for ${called.department}!`,
        "success"
      );

      // Optional browser speech synthesis announcement
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const text = `Now calling token ${called.tokenNumber}. ${called.name}, for ${called.department}.`;
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
      }

      await fetchData(true);
    } catch (err: unknown) {
      const error = err as ApiClientError;
      showToast(error.message || "Failed to call next patient.", "error");
    } finally {
      setIsCallingNext(false);
    }
  };

  // Operation: Repeat Last Call
  const handleRepeatCall = async () => {
    setIsActionLoading(true);
    try {
      const repeated = await api.repeatLastCall();
      showToast(
        `Repeated announcement for Token ${repeated.tokenNumber} (${repeated.name})`,
        "info"
      );

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const text = `Repeating call: token ${repeated.tokenNumber}. ${repeated.name}, please proceed to ${repeated.department}.`;
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: unknown) {
      const error = err as ApiClientError;
      showToast(error.message || "No calls to repeat.", "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Operation: Mark Consultation Completed (with confirmation)
  const promptCompletePatient = (patientId: string) => {
    const target = allPatients.find((p) => p.id === patientId) || currentCalledPatient;
    const name = target ? target.name : "the patient";
    const token = target ? target.tokenNumber : "";

    setConfirmDialog({
      isOpen: true,
      title: "Confirm Consultation Completion",
      message: `Mark consultation completed for ${name} (${token})? This patient will be removed from active status and saved to historical records.`,
      confirmText: "Mark Completed",
      isDestructive: false,
      action: async () => {
        try {
          await api.completePatient(patientId);
          showToast(`Consultation completed for ${name}.`, "success");
          await fetchData(true);
        } catch (err: unknown) {
          const error = err as ApiClientError;
          showToast(error.message || "Failed to complete patient.", "error");
        }
      },
    });
  };

  // Operation: Cancel Waiting Patient (with confirmation)
  const promptCancelPatient = (patient: Patient) => {
    setConfirmDialog({
      isOpen: true,
      title: "Cancel Waiting Queue Entry",
      message: `Are you sure you want to cancel the waiting entry for ${patient.name} (Token: ${patient.tokenNumber})? This will remove them from the queue.`,
      confirmText: "Cancel Queue Entry",
      isDestructive: true,
      action: async () => {
        try {
          await api.cancelWaitingPatient(patient.id);
          showToast(`Cancelled entry for ${patient.name}.`, "info");
          await fetchData(true);
        } catch (err: unknown) {
          const error = err as ApiClientError;
          showToast(error.message || "Failed to cancel entry.", "error");
        }
      },
    });
  };

  // Operation: Register Patient API Submit
  const handleRegisterSubmit = async (values: RegisterPatientInput): Promise<Patient> => {
    const registered = await api.registerPatient({
      name: values.name,
      department: values.department,
      age: values.age,
      notes: values.notes,
    });
    showToast(
      `Registered ${registered.name} with Token ${registered.tokenNumber}!`,
      "success"
    );
    await fetchData(true);
    return registered;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Header */}
      <TopBar
        isConnected={isConnected}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onRefresh={() => fetchData()}
        isRefreshing={isRefreshing}
      />

      {/* Disconnection Banner */}
      {!isConnected && (
        <div className="bg-rose-600 text-white px-4 py-2.5 text-xs font-medium flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              <strong>Backend Disconnected:</strong> {errorMessage || "Cannot reach Spring Boot server. Check database and server status."}
            </span>
          </div>
          <button
            onClick={() => fetchData()}
            disabled={isRefreshing}
            className="underline hover:text-amber-200 ml-4 shrink-0 flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Retry Connection
          </button>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-900 text-white border-emerald-700"
              : toastMessage.type === "error"
              ? "bg-rose-900 text-white border-rose-700"
              : "bg-navy-900 text-white border-slate-700"
          }`}
        >
          {toastMessage.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toastMessage.type === "error" && <AlertTriangle className="w-4 h-4 text-rose-400" />}
          {toastMessage.type === "info" && <Clock className="w-4 h-4 text-teal-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          waitingCount={waitingQueue.length}
          recentCount={recentCalls.length}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {isLoading ? (
            <div className="min-h-[400px] flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <p className="text-sm font-medium">Connecting to CareQueue backend...</p>
            </div>
          ) : (
            <>
              {/* Tab 1: Overview Dashboard */}
              {currentTab === "overview" && (
                <div className="space-y-6">
                  {/* Stats Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      title="Patients Waiting"
                      value={stats.waitingCount}
                      subtitle="In FIFO LinkedPatientQueue"
                      icon={Users}
                      variant="amber"
                    />
                    <StatCard
                      title="Called Today"
                      value={stats.calledTodayCount}
                      subtitle="Pushed to RecentCallsStack"
                      icon={PhoneCall}
                      variant="brand"
                    />
                    <StatCard
                      title="Completed Today"
                      value={stats.completedTodayCount}
                      subtitle="Finished consultations"
                      icon={CheckCircle2}
                      variant="emerald"
                    />
                    <StatCard
                      title="Avg. Wait Time"
                      value={
                        stats.averageWaitTimeMinutes !== null
                          ? `${stats.averageWaitTimeMinutes}m`
                          : "—"
                      }
                      subtitle="Calculated from timestamps"
                      icon={Clock}
                      variant="slate"
                    />
                  </div>

                  {/* Current Call Hero Card */}
                  <CurrentPatientCard
                    currentCall={currentCalledPatient}
                    onComplete={promptCompletePatient}
                    onRepeatCall={handleRepeatCall}
                    isActionLoading={isActionLoading}
                  />

                  {/* 2-Column Split: Left Waiting Queue (FIFO) + Right Recent Calls (LIFO Stack) */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <WaitingQueueTable
                        queue={waitingQueue}
                        onCallNext={handleCallNext}
                        onCancelPatient={promptCancelPatient}
                        isCallingNext={isCallingNext}
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <RecentCallsStackPanel
                        recentCalls={recentCalls}
                        onRepeatCall={handleRepeatCall}
                        isRepeating={isActionLoading}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Waiting Queue Full View */}
              {currentTab === "queue" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-xl font-bold tracking-tight text-slate-900">
                        Waiting Queue Management
                      </h1>
                      <p className="text-xs text-slate-500">
                        Patients waiting in strict First-In, First-Out (FIFO) order.
                      </p>
                    </div>
                  </div>
                  <WaitingQueueTable
                    queue={waitingQueue}
                    onCallNext={handleCallNext}
                    onCancelPatient={promptCancelPatient}
                    isCallingNext={isCallingNext}
                  />
                </div>
              )}

              {/* Tab 3: Recent Calls Stack Full View */}
              {currentTab === "recent" && (
                <div className="space-y-4">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">
                      Recent Calls History
                    </h1>
                    <p className="text-xs text-slate-500">
                      Last-In, First-Out (LIFO) stack demonstrating call announcements.
                    </p>
                  </div>
                  <div className="max-w-2xl">
                    <RecentCallsStackPanel
                      recentCalls={recentCalls}
                      onRepeatCall={handleRepeatCall}
                      isRepeating={isActionLoading}
                    />
                  </div>
                </div>
              )}

              {/* Tab 4: Patient Registry Full View */}
              {currentTab === "registry" && (
                <div className="space-y-4">
                  <PatientRegistryTable patients={allPatients} onRefresh={fetchData} />
                </div>
              )}

              {/* Tab 5: DSA Architecture Explanation */}
              {currentTab === "dsa" && <DsaExplanationView />}
            </>
          )}
        </main>
      </div>

      {/* Register Patient Modal Dialog */}
      <RegisterPatientDialog
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onPatientRegistered={() => fetchData(true)}
        onSubmitApi={handleRegisterSubmit}
      />

      {/* Confirmation Action Modal Dialog */}
      <ConfirmActionDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={async () => {
          setIsActionLoading(true);
          try {
            await confirmDialog.action();
          } finally {
            setIsActionLoading(false);
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          }
        }}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        isDestructive={confirmDialog.isDestructive}
        isLoading={isActionLoading}
      />
    </div>
  );
}
