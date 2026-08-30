import { prisma } from "@/lib/prisma";

export interface SessionContext {
  userId: string;
  userName: string;
  userEmail: string;
  role: "ADMIN" | "USER";
  companyId: string;
  companyName: string;
  companyStatus: string;
  isSupplier: boolean;
  isTenant: boolean;
}

export const DEMO_PROFILES = [
  {
    key: "tenant-abc",
    title: "ABC Organizasyon A.Ş. (Kiracı)",
    email: "info@abcorganizasyon.com",
    roleText: "Kurumsal Kiracı",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    key: "supplier-mega",
    title: "Mega Event Ekipmanları Ltd. (Tedarikçi A - 600 Sandalye)",
    email: "iletisim@megaevent.com",
    roleText: "Tedarikçi",
    badgeColor: "bg-emerald-100 text-emerald-800",
  },
  {
    key: "supplier-pro",
    title: "Pro Kiralama & Sahne A.Ş. (Tedarikçi B - 800 Sandalye)",
    email: "info@prokiralama.com",
    roleText: "Tedarikçi",
    badgeColor: "bg-purple-100 text-purple-800",
  },
  {
    key: "supplier-fuartech",
    title: "Fuar Tech Donanım Ltd. (Tedarikçi C - Teknoloji/Fuar)",
    email: "destek@fuartech.com",
    roleText: "Tedarikçi",
    badgeColor: "bg-cyan-100 text-cyan-800",
  },
  {
    key: "admin",
    title: "Sistem Yöneticisi (Admin)",
    email: "admin@kiralapro.com",
    roleText: "Platform Admin",
    badgeColor: "bg-rose-100 text-rose-800",
  },
];

/**
 * Gets the current active session based on cookie/header or defaults to ABC Organizasyon
 */
export async function getCurrentSession(overrideEmail?: string): Promise<SessionContext | null> {
  const targetEmail = overrideEmail || "info@abcorganizasyon.com";

  const user = await prisma.user.findFirst({
    where: { email: targetEmail },
    include: {
      memberships: {
        include: {
          company: {
            include: {
              supplierProfile: true,
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  const firstMembership = user.memberships[0];
  const company = firstMembership?.company;

  return {
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    role: user.role,
    companyId: company?.id ?? "",
    companyName: company?.name ?? "Bireysel / Admin",
    companyStatus: company?.status ?? "VERIFIED",
    isSupplier: Boolean(company?.supplierProfile),
    isTenant: true,
  };
}
