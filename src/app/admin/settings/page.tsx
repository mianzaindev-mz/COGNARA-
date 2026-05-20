import type { Metadata } from "next";
import { AdminSettingsClient } from "./client-page";

export const metadata: Metadata = { title: "Settings — Admin — COGNARA™" };

export default function AdminSettingsPage() {
  return <AdminSettingsClient />;
}
