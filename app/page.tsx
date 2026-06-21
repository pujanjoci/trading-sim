"use client";

import dynamic from "next/dynamic";

// Dynamically load Dashboard with SSR disabled to prevent hydration mismatches from client state
const Dashboard = dynamic(
  () => import("@/app/components/Dashboard").then((mod) => mod.Dashboard),
  { ssr: false }
);

export default function Home() {
  return (
    <div className="flex flex-col flex-1 h-full min-h-screen">
      <Dashboard />
    </div>
  );
}
