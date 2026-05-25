import { motion } from "framer-motion";
import { User, Section } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user: User;
  activeSection: Section;
  onSectionChange: (s: Section) => void;
  onLogout: () => void;
}

const navItems: { id: Section; label: string; icon: string }[] = [
  { id: "notes", label: "Notes", icon: "📝" },
  { id: "contacts", label: "Contacts", icon: "👤" },
  { id: "links", label: "Links", icon: "🔗" },
];

export default function Sidebar({
  user,
  activeSection,
  onSectionChange,
  onLogout,
}: SidebarProps) {
  return (
    <motion.aside
      className="w-56 bg-[#080f08] border-r border-[#1a2e1a] flex flex-col"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-5 border-b border-[#1a2e1a]">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛡️</span>
          <div>
            <p className="text-white font-bold text-sm">SatoSave</p>
            <p className="text-[#39ff14] text-xs tracking-widest uppercase">
              Vault
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              activeSection === item.id
                ? "bg-[#39ff14]/15 text-[#39ff14] border border-[#39ff14]/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </motion.button>
        ))}
      </nav>

      <div className="p-3 border-t border-[#1a2e1a]">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs text-gray-600 truncate">{user.email}</p>
        </div>
        <motion.button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          whileHover={{ x: 3 }}
          whileTap={{ scale: 0.97 }}
        >
          <span>🚪</span>
          Sign out
        </motion.button>
      </div>
    </motion.aside>
  );
}
