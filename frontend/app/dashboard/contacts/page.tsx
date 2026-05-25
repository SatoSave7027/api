"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Contact } from "@/lib/types";
import { contactsApi } from "@/lib/api";
import ContactCard from "@/components/contacts/ContactCard";
import ContactForm from "@/components/contacts/ContactForm";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import {
  PlusIcon,
  UserGroupIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
} from "@heroicons/react/24/outline";
import { formatDate } from "@/lib/utils";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await contactsApi.list();
      setContacts(res.data);
    } catch {
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleDelete = async (id: string) => {
    try {
      await contactsApi.delete(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch {}
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingContact(null);
    await fetchContacts();
  };

  const openEdit = (contact: Contact) => {
    setEditingContact(contact);
    setShowForm(true);
    setViewingContact(null);
  };

  return (
    <div className="p-6 lg:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Contacts</h1>
          <p className="text-gray-500 mt-1">
            {contacts.length} important{" "}
            {contacts.length === 1 ? "contact" : "contacts"}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingContact(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          New Contact
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-[#0d1a0d] border border-[#1a2e1a] rounded-xl p-5 flex flex-col items-center animate-pulse"
            >
              <div className="w-16 h-16 rounded-full bg-[#1a2e1a] mb-4" />
              <div className="h-4 bg-[#1a2e1a] rounded w-3/4 mb-2" />
              <div className="h-3 bg-[#1a2e1a] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={<UserGroupIcon className="w-20 h-20" />}
          title="No contacts yet"
          description="Add your important contacts to keep them safe and encrypted"
          action={
            <Button onClick={() => setShowForm(true)} size="lg">
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Contact
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <AnimatePresence>
            {contacts.map((contact, i) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                index={i}
                onEdit={openEdit}
                onDelete={handleDelete}
                onClick={setViewingContact}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingContact(null);
        }}
        title={editingContact ? "Edit Contact" : "New Contact"}
      >
        <ContactForm
          contact={editingContact}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingContact(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={!!viewingContact}
        onClose={() => setViewingContact(null)}
        title={viewingContact?.name || ""}
      >
        {viewingContact && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {viewingContact.avatar ? (
                <img
                  src={viewingContact.avatar.url}
                  alt={viewingContact.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#39ff14]/30"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#39ff14]/10 border-2 border-[#1a2e1a] flex items-center justify-center">
                  <UserGroupIcon className="w-7 h-7 text-[#39ff14]/50" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-white">
                  {viewingContact.name}
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Added {formatDate(viewingContact.created_at)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {viewingContact.phone && (
                <div className="flex items-center gap-3 p-3 bg-[#111] rounded-xl border border-[#1a2e1a]">
                  <PhoneIcon className="w-4 h-4 text-[#39ff14]" />
                  <span className="text-gray-300">{viewingContact.phone}</span>
                </div>
              )}
              {viewingContact.telegram_username && (
                <div className="flex items-center gap-3 p-3 bg-[#111] rounded-xl border border-[#1a2e1a]">
                  <ChatBubbleLeftIcon className="w-4 h-4 text-[#39ff14]" />
                  <span className="text-gray-300">
                    @{viewingContact.telegram_username}
                  </span>
                </div>
              )}
              {viewingContact.description && (
                <div className="p-3 bg-[#111] rounded-xl border border-[#1a2e1a]">
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {viewingContact.description}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => openEdit(viewingContact)}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => {
                  handleDelete(viewingContact.id);
                  setViewingContact(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
