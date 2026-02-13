import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { userService } from '@/services/user-service';
import { Plus, Trash2, Edit2, Users as UsersIcon, ShieldCheck, UserCog, User as UserIcon } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/SearchInput';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FormDialog } from '@/components/ui/FormDialog';
import { useCrudOperations } from '@/hooks/useCrudOperations';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MetricGrid } from '@/features/dashboard/components/MetricGrid';

import { User } from '@/types/api';

const DEFAULT_FORM_DATA = {
  email: '',
  name: '',
  password: '',
  role: 'CLIENT',
};

export default function Users() {
  const {
    items: users,
    meta,
    isLoading,
    isFetching,
    searchTerm,
    setSearchTerm,
    page,
    setPage,
    limit,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isSubmitting,
    formData,
    formErrors,
    handleCreate,
    handleUpdate,
    handleDelete,
    openEditDialog,
    closeDialogs,
    handleFieldChange,
  } = useCrudOperations<User>({
    api: userService,
    entityName: 'User',
    defaultFormData: DEFAULT_FORM_DATA,
    queryKey: ['users'],
    validateForm: (data, editingItem) => {
      const errors: Record<string, string> = {};
      const isEdit = !!editingItem;

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!data.email.trim()) errors.email = 'Email is required';
      else if (!emailRegex.test(data.email)) errors.email = 'Please enter a valid email address';

      // Name validation
      if (!data.name.trim()) errors.name = 'Name is required';
      else if (data.name.length < 2) errors.name = 'Name must be at least 2 characters';
      else if (data.name.length > 100) errors.name = 'Name must be less than 100 characters';

      // Password validation
      if (!isEdit) {
        if (!data.password) errors.password = 'Password is required';
        else if (data.password.length < 6) errors.password = 'Password must be at least 6 characters';
      } else if (data.password && data.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }

      // Role validation
      if (!data.role) errors.role = 'Role is required';
      else if (!['ADMIN', 'MANAGER', 'CLIENT'].includes(data.role)) errors.role = 'Role must be one of: ADMIN, MANAGER, CLIENT';

      return errors;
    },
  });

  const [roleFilter, setRoleFilter] = React.useState<string>('all');

  const filteredUsers = React.useMemo(() => {
    let result = users || [];
    // Client-side filtering for Role only (Search is now server-side via hook)
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }
    return result;
  }, [users, roleFilter]);

  const stats = React.useMemo(() => {
    // Note: These stats are now only for the CURRENT PAGE. 
    // Ideally, backend should return global stats, but for now this is consistent with previous behavior
    const safeUsers = users || [];
    return [
      {
        title: 'Total Users ',
        value: safeUsers.length,
        icon: <UsersIcon className="h-4 w-4" />,
        iconClassName: 'bg-blue-100 text-blue-600',
        description: `Total: ${meta?.total || 0}`
      },
      {
        title: 'Admins',
        value: safeUsers.filter(u => u.role === 'ADMIN').length,
        icon: <ShieldCheck className="h-4 w-4" />,
        iconClassName: 'bg-red-100 text-red-600',
      },
      {
        title: 'Managers',
        value: safeUsers.filter(u => u.role === 'MANAGER').length,
        icon: <UserCog className="h-4 w-4" />,
        iconClassName: 'bg-amber-100 text-amber-600',
      },
      {
        title: 'Clients',
        value: safeUsers.filter(u => u.role === 'CLIENT').length,
        icon: <UserIcon className="h-4 w-4" />,
        iconClassName: 'bg-green-100 text-green-600',
      },
    ];
  }, [users, meta]);

  const getInitials = (name: string | undefined | null) => {
    if (!name) return '??';
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const renderUserForm = (isEdit: boolean = false) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleFieldChange('email', e.target.value)}
          placeholder="user@example.com"
          disabled={isEdit}
          className={formErrors.email ? 'border-destructive' : ''}
        />
        {formErrors.email && <p className="text-sm text-destructive">{formErrors.email}</p>}
        {isEdit && <p className="text-xs text-muted-foreground">Email cannot be changed</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          placeholder="Enter full name"
          className={formErrors.name ? 'border-destructive' : ''}
        />
        {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          Password {isEdit ? '(Optional)' : <span className="text-destructive">*</span>}
        </Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => handleFieldChange('password', e.target.value)}
          placeholder={isEdit ? 'Leave blank to keep current password' : 'Enter password'}
          className={formErrors.password ? 'border-destructive' : ''}
        />
        {formErrors.password && <p className="text-sm text-destructive">{formErrors.password}</p>}
        {!isEdit && <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role <span className="text-destructive">*</span></Label>
        <Select
          value={formData.role}
          onValueChange={(value) => handleFieldChange('role', value)}
        >
          <SelectTrigger className={formErrors.role ? 'border-destructive' : ''}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="MANAGER">Manager</SelectItem>
            <SelectItem value="CLIENT">Client</SelectItem>
          </SelectContent>
        </Select>
        {formErrors.role && <p className="text-sm text-destructive">{formErrors.role}</p>}
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Users</h1>
              <p className="text-muted-foreground">
                Manage user accounts and permissions across your workspace.
              </p>
            </div>
          </div>

          <MetricGrid metrics={stats} isLoading={isLoading} columns={4} />

          <FormDialog
            open={isCreateDialogOpen}
            onOpenChange={(open) => !open && closeDialogs()}
            title="Add New User"
            description="Create a new user account"
            onSubmit={handleCreate}
            isSubmitting={isSubmitting}
            submitLabel="Add User"
          >
            {renderUserForm(false)}
          </FormDialog>

          <FormDialog
            open={isEditDialogOpen}
            onOpenChange={(open) => !open && closeDialogs()}
            title="Edit User"
            description="Update user information"
            onSubmit={handleUpdate}
            isSubmitting={isSubmitting}
            submitLabel="Save Changes"
          >
            {renderUserForm(true)}
          </FormDialog>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  All Users
                  {isFetching && !isLoading && <LoadingSpinner text="" className="h-4 w-4" />}
                </CardTitle>
                <CardDescription>View and manage all user accounts</CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="flex-1">
                  <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search by name or email..."
                  />
                </div>
                <div className="w-full sm:w-44">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="CLIENT">Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoading ? (
                <LoadingSpinner text="" />
              ) : filteredUsers.length === 0 ? (
                <EmptyState
                  hasSearch={!!searchTerm || roleFilter !== 'all'}
                  searchMessage="No users found matching your filters"
                  emptyMessage="No users yet. Add your first user!"
                />
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Created At</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                                  <AvatarFallback className="text-xs bg-muted">
                                    {getInitials(user.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{user.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <StatusBadge status={user.role} />
                            </TableCell>
                            <TableCell>
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  onClick={() => openEditDialog(user, (u) => ({
                                    email: u.email,
                                    name: u.name,
                                    password: '',
                                    role: u.role,
                                  }))}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(user.id, user.name)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, meta?.total || 0)} of {meta?.total || 0} entries
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                        disabled={page * limit >= (meta?.total || 0)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
