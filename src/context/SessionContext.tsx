"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { DEMO_PROFILES } from "@/lib/auth/session";

interface SessionProfile {
  key: string;
  title: string;
  email: string;
  roleText: string;
  badgeColor: string;
  companyId?: string;
}

interface SessionContextType {
  currentProfile: SessionProfile;
  setProfileByKey: (key: string) => void;
  allProfiles: typeof DEMO_PROFILES;
  activeCompanyId: string;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [profileKey, setProfileKey] = useState<string>("tenant-abc");
  const [companyId, setCompanyId] = useState<string>("");

  const currentProfile =
    DEMO_PROFILES.find((p) => p.key === profileKey) || DEMO_PROFILES[0];

  useEffect(() => {
    // Load companies from API to get their IDs
    async function loadCompany() {
      try {
        const res = await fetch("/api/companies");
        if (res.ok) {
          const companies = await res.json();
          if (profileKey === "tenant-abc") {
            const comp = companies.find((c: any) => c.name.includes("ABC Organizasyon"));
            if (comp) setCompanyId(comp.id);
          } else if (profileKey === "supplier-mega") {
            const comp = companies.find((c: any) => c.name.includes("Mega Event"));
            if (comp) setCompanyId(comp.id);
          } else if (profileKey === "supplier-pro") {
            const comp = companies.find((c: any) => c.name.includes("Pro Kiralama"));
            if (comp) setCompanyId(comp.id);
          } else if (profileKey === "supplier-fuartech") {
            const comp = companies.find((c: any) => c.name.includes("Fuar Tech"));
            if (comp) setCompanyId(comp.id);
          } else {
            setCompanyId("");
          }
        }
      } catch (err) {
        console.error("Failed to load company for session", err);
      }
    }
    loadCompany();
  }, [profileKey]);

  const setProfileByKey = (key: string) => {
    setProfileKey(key);
  };

  return (
    <SessionContext.Provider
      value={{
        currentProfile,
        setProfileByKey,
        allProfiles: DEMO_PROFILES,
        activeCompanyId: companyId,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
