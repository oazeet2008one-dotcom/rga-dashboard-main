import { useState } from 'react';
import { toast } from 'sonner';
import { showApiError, showSuccess } from '@/lib/errorHandler';
import { AxiosResponse } from 'axios';
import { PaginatedResponse } from '@/types/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CrudOptions<T> {
    api: {
        getAll: (params?: any) => Promise<AxiosResponse<PaginatedResponse<T>>>;
        create: (data: any) => Promise<AxiosResponse<T>>;
        update: (id: string, data: any) => Promise<AxiosResponse<T>>;
        delete: (id: string) => Promise<AxiosResponse<any>>;
    };
    entityName: string;
    defaultFormData: any;
    validateForm?: (data: any, editingItem: T | null) => Record<string, string>; // Returns errors object
    queryKey: string[]; // Required for React Query caching
}

export function useCrudOperations<T extends { id: string; name?: string }>({
    api,
    entityName,
    defaultFormData,
    validateForm,
    queryKey,
}: CrudOptions<T>) {
    const queryClient = useQueryClient();

    // Pagination & Search State
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    // Dialog State
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<T | null>(null);

    // Form State
    const [formData, setFormData] = useState(defaultFormData);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // 1. Fetching Data with React Query
    const {
        data: responseData,
        isLoading,
        isFetching,
        refetch
    } = useQuery({
        queryKey: [...queryKey, page, limit, searchTerm],
        queryFn: async () => {
            const res = await api.getAll({
                page,
                limit,
                search: searchTerm || undefined
            });
            return res.data;
        },
        keepPreviousData: true, // Prevents UI flash during pagination/search
        staleTime: 30000, // Data stays fresh for 30s
    });

    const items = responseData?.data || [];
    const meta = responseData?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 };

    // 2. Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => api.create(data),
        onSuccess: (res) => {
            showSuccess(`${entityName} created successfully`, `${res.data.name || 'Item'} has been added`);
            queryClient.invalidateQueries({ queryKey });
            closeDialogs();
        },
        onError: (err: any) => showApiError(err, `Failed to create ${entityName}`),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => api.update(id, data),
        onSuccess: (res) => {
            showSuccess(`${entityName} updated successfully`, `${res.data.name || 'Item'} has been updated`);
            queryClient.invalidateQueries({ queryKey });
            closeDialogs();
        },
        onError: (err: any) => showApiError(err, `Failed to update ${entityName}`),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(id),
        onSuccess: (_, variables) => {
            // variables is the ID, but we want the name? 
            // We can just say "Item has been removed" or access it via context if needed.
            showSuccess(`${entityName} deleted successfully`, `Item has been removed`);
            queryClient.invalidateQueries({ queryKey });
        },
        onError: (err: any) => showApiError(err, `Failed to delete ${entityName}`),
    });

    // Handlers
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm) {
            const errors = validateForm(formData, null);
            if (Object.keys(errors).length > 0) {
                setFormErrors(errors);
                toast.error('Validation failed');
                return;
            }
        }
        createMutation.mutate(formData);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        if (validateForm) {
            const errors = validateForm(formData, editingItem);
            if (Object.keys(errors).length > 0) {
                setFormErrors(errors);
                toast.error('Validation failed');
                return;
            }
        }
        updateMutation.mutate({ id: editingItem.id, data: formData });
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
        deleteMutation.mutate(id);
    };

    const openEditDialog = (item: T, mapItemToForm: (item: T) => any) => {
        setEditingItem(item);
        setFormData(mapItemToForm(item));
        setFormErrors({});
        setIsEditDialogOpen(true);
    };

    const closeDialogs = () => {
        setFormData(defaultFormData);
        setFormErrors({});
        setIsCreateDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditingItem(null);
    };

    const handleFieldChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
        if (formErrors[field]) {
            setFormErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    return {
        items,
        meta, // New!
        isLoading,
        isFetching, // New!
        searchTerm,
        setSearchTerm,
        page, // New!
        setPage, // New!
        limit, // New!
        setLimit, // New!
        isCreateDialogOpen,
        setIsCreateDialogOpen,
        isEditDialogOpen,
        setIsEditDialogOpen,
        editingItem,
        isSubmitting: createMutation.isLoading || updateMutation.isLoading,
        formData,
        setFormData,
        formErrors,
        setFormErrors,
        refetch, // Renamed from fetchItems
        handleCreate,
        handleUpdate,
        handleDelete,
        openEditDialog,
        closeDialogs,
        handleFieldChange,
    };
}
