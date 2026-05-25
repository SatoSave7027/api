import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authApi, clearTokens, loadTokens, getAccessToken, setTokens } from "@/lib/api";
import { User, Section } from "@/lib/types";
import LoginScreen from "@/screens/LoginScreen";
import NotesScreen from "@/screens/NotesScreen";
import ContactsScreen from "@/screens/ContactsScreen";
import LinksScreen from "@/screens/LinksScreen";
import Sidebar from "@/components/Sidebar";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [section, setSection] = useState<Section>("notes");

  const fetchUser = useCallback(async () => {
    try {
      const res = await authApi.me();
      setUser(res.data);
    } catch {
      setUser(null);
      clearTokens();
    }
  }, []);

  useEffect(() => {
    loadTokens();
    const token = getAccessToken();
    if (token) {
      fetchUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchUser]);

  const handleLogin = async (access: string, refresh: string) => {
    setTokens(access, refresh);
    await fetchUser();
  };

  const handleLogout = async () => {
    const rt = localStorage.getItem("refresh_token");
    if (rt) {
      try {
        await authApi.logout(rt);
      } catch {}
    }
    clearTokens();
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#080f08]">
        <motion.div
          className="w-8 h-8 border-2 border-[#39ff14] border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen flex bg-[#080f08] overflow-hidden">
      <Sidebar
        user={user}
        activeSection={section}
        onSectionChange={setSection}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {section === "notes" && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <NotesScreen />
            </motion.div>
          )}
          {section === "contacts" && (
            <motion.div
              key="contacts"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ContactsScreen />
            </motion.div>
          )}
          {section === "links" && (
            <motion.div
              key="links"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <LinksScreen />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
