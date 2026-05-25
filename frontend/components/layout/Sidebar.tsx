"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DocumentTextIcon,
  UserGroupIcon,
  LinkIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard/notes", label: "Notes", icon: DocumentTextIcon },
  { href: "/dashboard/contacts", label: "Contacts", icon: UserGroupIcon },
  { href: "/dashboard/links", label: "Links", icon: LinkIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <motion.aside
      className="w-64 min-h-screen bg-[#080f08] border-r border-[#1a2e1a] flex flex-col"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="p-6 border-b border-[#1a2e1a]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#39ff14]/20 border border-[#39ff14]/40 flex items-center justify-center">
            <ShieldCheckIcon className="w-5 h-5 text-[#39ff14]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">
              SatoSave
            </h1>
            <p className="text-xs text-[#39ff14] tracking-widest uppercase">
              Vault
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-[#39ff14]/15 text-[#39ff14] border border-[#39ff14]/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.97 }}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-[#39ff14]"
                    layoutId="activeIndicator"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#1a2e1a]">
        <div className="px-4 py-3 mb-2">
          <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">
            Signed in as
          </p>
          <p className="text-sm text-gray-300 truncate">{user?.email}</p>
        </div>
        <motion.button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.97 }}
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span className="font-medium">Sign out</span>
        </motion.button>
      </div>
    </motion.aside>
  );
}
