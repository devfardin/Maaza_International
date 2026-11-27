'use client';
// Super admin only: soft-deleted records, with permanent removal.
import DeletedItemsAdmin from '@/components/admin/DeletedItemsAdmin';

export default function AdminDeletedPage() {
  return <DeletedItemsAdmin />;
}
