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
  // Navigation State (4 operational tabs: overview, queue, registry, recent)
  const [currentTab, setCurrentTab] = useState<NavTab>("overview");

  // Core Data State
  const [waitingQueue, setWaitingQueue] = useState<Patient[]>([]);
  const [recentCalls, setRecentCalls] = useState<Patient[]>([]);
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
        const [healthRes, queueRes, recentRes, statsRes] =
          await Promise.all([
            api.checkHealth(),
            api.getWaitingQueue(),
            api.getRecentCalls(),
            api.getDashboardStats(),
          ]);

        setIsConnected(healthRes.status === "UP");
        setWaitingQueue(queueRes);
        setRecentCalls(recentRes);
        setStats(statsRes);
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
    try {
      const repeated = await api.repeatLastCall();
      showToast(
        `Re-announced ${repeated.name} (Token ${repeated.tokenNumber})`,
        "info"
      );

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const text = `Repeating call for token ${repeated.tokenNumber}. ${repeated.name}, for ${repeated.department}.`;
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: unknown) {
      const error = err as ApiClientError;
      showToast(error.message || "No calls available to repeat.", "error");
    }
  };

  // Operation: Complete Consultation
  const handleCompletePatient = async (patientId: string) => {
    setIsActionLoading(true);
    try {
      const completed = await api.completePatient(patientId);
      showToast(
        `Completed consultation for ${completed.name} (${completed.tokenNumber}).`,
        "success"
      );
      await fetchData(true);
    } catch (err: unknown) {
      const error = err as ApiClientError;
      showToast(error.message || "Failed to complete patient consultation.", "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  const promptCompletePatient = (patientId: string) => {
    if (!currentCalledPatient) return;
    setConfirmDialog({
      isOpen: true,
      title: "Complete Consultation",
      message: `Mark patient ${currentCalledPatient.name} (Token ${currentCalledPatient.tokenNumber}) as completed?`,
      confirmText: "Complete Consultation",
      isDestructive: false,
      action: async () => {
        await handleCompletePatient(patientId);
      },
    });
  };

  // Operation: Cancel Waiting Patient
  const handleCancelPatient = async (patientId: string) => {
    setIsActionLoading(true);
    try {
      const cancelled = await api.cancelWaitingPatient(patientId);
      showToast(
        `Cancelled queue entry for ${cancelled.name} (${cancelled.tokenNumber}).`,
        "info"
      );
      await fetchData(true);
    } catch (err: unknown) {
      const error = err as ApiClientError;
      showToast(error.message || "Failed to cancel waiting entry.", "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  const promptCancelPatient = (patient: Patient) => {
    setConfirmDialog({
      isOpen: true,
      title: "Cancel Queue Entry",
      message: `Are you sure you want to cancel the queue entry for ${patient.name} (${patient.tokenNumber})? This will remove them from the waiting queue.`,
      confirmText: "Yes, Cancel Patient",
      isDestructive: true,
      action: async () => {
        await handleCancelPatient(patient.id);
      },
    });
  };

  // Registration handler passed to modal
  const handleRegisterSubmit = async (input: RegisterPatientInput) => {
    const result = await api.registerPatient(input);
    showToast(
      `Registered ${result.name} (Token ${result.tokenNumber}) successfully!`,
      "success"
    );
    await fetchData(true);
    return result;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex flex-col transition-colors duration-200">
      {/* Top Application Bar */}
      <TopBar
        isConnected={isConnected}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onRefresh={() => fetchData(false)}
        isRefreshing={isRefreshing}
      />

      {/* Disconnected Backend Warning Banner */}
      {!isConnected && (
        <div className="bg-rose-600 text-white text-xs sm:text-sm px-4 py-2.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-white shrink-0" />
            <span>
              <strong>Backend Disconnected:</strong> {errorMessage || "Cannot reach Spring Boot server. Please check server status."}
            </span>
          </div>
          <button
            onClick={() => fetchData()}
            disabled={isRefreshing}
            className="underline hover:text-rose-100 ml-4 shrink-0 flex items-center gap-1 font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Retry Connection
          </button>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-900 text-white border-emerald-700"
              : toastMessage.type === "error"
              ? "bg-rose-900 text-white border-rose-700"
              : "bg-navy-900 text-white border-slate-700"
          }`}
        >
          {toastMessage.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toastMessage.type === "error" && <AlertTriangle className="w-4 h-4 text-rose-400" />}
          {toastMessage.type === "info" && <Clock className="w-4 h-4 text-brand-400" />}
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
              <Loader2 className="w-8 h-8 animate-spin text-brand-600 dark:text-brand-400" />
              <p className="text-base font-medium">Connecting to CareQueue backend...</p>
            </div>
          ) : (
            <>
              {/* Tab 1: Overview Dashboard */}
              {currentTab === "overview" && (
                <div className="space-y-6">
                  {/* Page Title */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Hospital Operations Dashboard
                      </h1>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Real-time overview of current patient flow, waiting line, and consultation activity.
                      </p>
                    </div>
                  </div>

                  {/* Stats Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      title="Patients Waiting"
                      value={stats.waitingCount}
                      subtitle="Awaiting consultation"
                      icon={Users}
                      variant="amber"
                    />
                    <StatCard
                      title="Called Today"
                      value={stats.calledTodayCount}
                      subtitle="Announced consultations"
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
                      subtitle="Registration to call time"
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

                  {/* 2-Column Split: Left Waiting Queue (FIFO) + Right Recent Calls */}
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
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Waiting Queue Management
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Patients awaiting consultation in strict First-In, First-Out (FIFO) registration sequence.
                    </p>
                  </div>
                  <WaitingQueueTable
                    queue={waitingQueue}
                    onCallNext={handleCallNext}
                    onCancelPatient={promptCancelPatient}
                    isCallingNext={isCallingNext}
                  />
                </div>
              )}

              {/* Tab 3: Patient Registry Full View */}
              {currentTab === "registry" && (
                <div className="space-y-4">
                  <PatientRegistryTable onRefreshNeeded={() => fetchData(true)} />
                </div>
              )}

              {/* Tab 4: Recent Calls Full View */}
              {currentTab === "recent" && (
                <div className="space-y-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Recent Calls History
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Chronological call announcements in reverse-order (newest call at top).
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
            </>
          )}
        </main>
      </div>

      {/* Register Patient Modal Dialog with Similarity Check */}
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
