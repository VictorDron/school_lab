import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  useAddChild,
  useUpdateChild,
  useDeleteChild,
  useUpdateChildHealth,
  useUpdateChildTransport,
} from '@/hooks/useLeads';
import { nationalities } from '@/constants/nationalities';
import type { CreateChildData, Lead, LeadChild } from '@/types/crm';

export function useLeadChildrenTab({ lead }: { lead: Lead }) {
  const [showForm, setShowForm] = useState(false);
  const [editingChild, setEditingChild] = useState<LeadChild | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedChildId, setExpandedChildId] = useState<string | null>(null);
  const [editingHealthChildId, setEditingHealthChildId] = useState<string | null>(null);
  const [editingTransportChildId, setEditingTransportChildId] = useState<string | null>(null);
  const [healthForm, setHealthForm] = useState<Record<string, any>>({});
  const [transportForm, setTransportForm] = useState<Record<string, any>>({});

  const addMutation = useAddChild();
  const updateMutation = useUpdateChild();
  const deleteMutation = useDeleteChild();
  const updateHealthMutation = useUpdateChildHealth();
  const updateTransportMutation = useUpdateChildTransport();

  const form = useForm<CreateChildData>();
  const { reset } = form;

  const nationalityOptions = useMemo(
    () =>
      nationalities
        .map((n) => ({ value: n.en, label: n.pt }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    []
  );

  const onSubmit = (data: CreateChildData) => {
    if (editingChild) {
      updateMutation.mutate(
        { leadId: lead.id, childId: editingChild.id, data },
        {
          onSuccess: () => {
            reset();
            setEditingChild(null);
            setShowForm(false);
          },
        }
      );
    } else {
      addMutation.mutate(
        { leadId: lead.id, data },
        {
          onSuccess: () => {
            reset();
            setShowForm(false);
          },
        }
      );
    }
  };

  const handleEdit = (child: LeadChild) => {
    setEditingChild(child);
    reset({
      fullName: child.fullName,
      dateOfBirth: child.dateOfBirth?.split('T')[0] || '',
      gender: child.gender,
      nationality: child.nationality || '',
      desiredGrade: child.desiredGrade || '',
      currentSchool: child.currentSchool || '',
      specialNeeds: child.specialNeeds || '',
      primaryLanguage: child.primaryLanguage || '',
    });
    setShowForm(true);
  };

  const handleDelete = (childId: string) => {
    deleteMutation.mutate(
      { leadId: lead.id, childId },
      { onSuccess: () => setDeletingId(null) }
    );
  };

  const handleCancel = () => {
    reset();
    setEditingChild(null);
    setShowForm(false);
  };

  const children = lead.children || [];
  const educationHistory = lead.educationHistory || [];
  const getChildEducationHistory = (childId: string) =>
    educationHistory.filter((edu) => edu.childId === childId);

  return {
    derived: {
      children,
      educationHistory,
      nationalityOptions,
      getChildEducationHistory,
    },
    ui: {
      showForm,
      editingChild,
      deletingId,
      expandedChildId,
      editingHealthChildId,
      editingTransportChildId,
      healthForm,
      transportForm,
    },
    setters: {
      setShowForm,
      setDeletingId,
      setExpandedChildId,
      setEditingHealthChildId,
      setEditingTransportChildId,
      setHealthForm,
      setTransportForm,
    },
    form,
    handlers: {
      onSubmit,
      handleEdit,
      handleDelete,
      handleCancel,
    },
    mutations: {
      add: addMutation,
      update: updateMutation,
      delete: deleteMutation,
      updateHealth: updateHealthMutation,
      updateTransport: updateTransportMutation,
    },
  };
}

export type LeadChildrenTabState = ReturnType<typeof useLeadChildrenTab>;
