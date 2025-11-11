"use client";

import { Building2 } from "lucide-react";

interface BankLogoProps {
  institutionName: string;
  institutionLogo?: string | null;
  size?: "sm" | "md" | "lg";
}

export function BankLogo({
  institutionName,
  institutionLogo,
  size = "md",
}: BankLogoProps) {
  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-16 w-16",
    lg: "h-20 w-20",
  };

  const iconSizes = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  // Generate a consistent color based on institution name
  const getColorFromName = (name: string) => {
    const colors = [
      "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-600",
      "from-green-500/20 to-green-600/10 border-green-500/30 text-green-600",
      "from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-600",
      "from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-600",
      "from-red-500/20 to-red-600/10 border-red-500/30 text-red-600",
      "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 text-indigo-600",
      "from-pink-500/20 to-pink-600/10 border-pink-500/30 text-pink-600",
      "from-teal-500/20 to-teal-600/10 border-teal-500/30 text-teal-600",
    ];

    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Get initials from institution name
  const getInitials = (name: string) => {
    const words = name.split(" ").filter((word) => word.length > 0);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  // Try to load logo from Clearbit (works for many US banks)
  const getClearbitLogo = (name: string) => {
    // Map common banks to their domains
    const bankDomains: Record<string, string> = {
      "chase": "chase.com",
      "bank of america": "bankofamerica.com",
      "wells fargo": "wellsfargo.com",
      "citibank": "citi.com",
      "us bank": "usbank.com",
      "pnc": "pnc.com",
      "capital one": "capitalone.com",
      "td bank": "td.com",
      "truist": "truist.com",
      "fifth third": "53.com",
      "ally": "ally.com",
      "discover": "discover.com",
      "american express": "americanexpress.com",
      "navy federal": "navyfederal.org",
      "usaa": "usaa.com",
      "charles schwab": "schwab.com",
    };

    const nameLower = name.toLowerCase();
    for (const [key, domain] of Object.entries(bankDomains)) {
      if (nameLower.includes(key)) {
        return `https://logo.clearbit.com/${domain}`;
      }
    }
    return null;
  };

  const colorClass = getColorFromName(institutionName);
  const initials = getInitials(institutionName);
  const clearbitLogo = getClearbitLogo(institutionName);

  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center rounded-xl bg-gradient-to-br border overflow-hidden flex-shrink-0 ${colorClass}`}
    >
      {institutionLogo ? (
        // Plaid logo (base64)
        <img
          src={`data:image/png;base64,${institutionLogo}`}
          alt={institutionName}
          className="h-full w-full object-contain p-2"
          onError={(e) => {
            // If Plaid logo fails, hide the img
            e.currentTarget.style.display = "none";
          }}
        />
      ) : clearbitLogo ? (
        // Try Clearbit logo
        <img
          src={clearbitLogo}
          alt={institutionName}
          className="h-full w-full object-contain p-2"
          onError={(e) => {
            // If Clearbit fails, hide img and show initials
            e.currentTarget.style.display = "none";
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.innerHTML = `<span class="text-lg font-bold">${initials}</span>`;
            }
          }}
        />
      ) : (
        // Fallback to initials
        <span className="text-lg font-bold">{initials}</span>
      )}
    </div>
  );
}
