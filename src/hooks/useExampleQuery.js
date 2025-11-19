import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Example React Query hooks template
 *
 * This shows best practices for API integration with React Query.
 * Copy and modify for your API endpoints (useDiscogs, usePrice, etc.)
 */

// ============================================
// SERVICE LAYER (move to src/services/)
// ============================================
const exampleService = {
  /**
   * Fetch single item
   */
  getItem: async (id) => {
    const response = await fetch(`/api/items/${id}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  /**
   * Fetch list of items
   */
  getItems: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`/api/items?${params}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  /**
   * Create item
   */
  createItem: async (data) => {
    const response = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  /**
   * Update item
   */
  updateItem: async ({ id, data }) => {
    const response = await fetch(`/api/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  /**
   * Delete item
   */
  deleteItem: async (id) => {
    const response = await fetch(`/api/items/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
};

// ============================================
// QUERY HOOKS (for GET requests)
// ============================================

/**
 * Fetch single item by ID
 */
export function useItem(id) {
  return useQuery({
    queryKey: ['items', id], // Unique identifier for this query
    queryFn: () => exampleService.getItem(id),
    enabled: !!id, // Only run if id exists
    staleTime: 1000 * 60 * 5, // Data fresh for 5 minutes
    cacheTime: 1000 * 60 * 30, // Cache for 30 minutes
    retry: 3, // Retry 3 times on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Don't refetch on window focus (adjust as needed)
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

/**
 * Fetch list of items with filters
 */
export function useItems(filters = {}) {
  return useQuery({
    queryKey: ['items', filters], // Include filters in key
    queryFn: () => exampleService.getItems(filters),
    staleTime: 1000 * 60, // 1 minute
    keepPreviousData: true, // Keep showing old data while fetching new
  });
}

// ============================================
// MUTATION HOOKS (for POST/PUT/DELETE)
// ============================================

/**
 * Create new item
 */
export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: exampleService.createItem,
    onSuccess: (newItem) => {
      // Invalidate and refetch items list
      queryClient.invalidateQueries(['items']);

      // Or optimistically add to cache
      queryClient.setQueryData(['items', newItem.id], newItem);
    },
    onError: (error) => {
      console.error('Failed to create item:', error);
    },
  });
}

/**
 * Update existing item
 */
export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: exampleService.updateItem,
    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['items', id]);

      // Snapshot previous value
      const previousItem = queryClient.getQueryData(['items', id]);

      // Optimistically update
      queryClient.setQueryData(['items', id], (old) => ({
        ...old,
        ...data,
      }));

      // Return context with snapshot
      return { previousItem };
    },
    // On error, rollback
    onError: (err, variables, context) => {
      if (context?.previousItem) {
        queryClient.setQueryData(['items', variables.id], context.previousItem);
      }
    },
    // Always refetch after error or success
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries(['items', variables.id]);
    },
  });
}

/**
 * Delete item
 */
export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: exampleService.deleteItem,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries(['items', deletedId]);
      // Invalidate list
      queryClient.invalidateQueries(['items']);
    },
  });
}

// ============================================
// USAGE IN COMPONENTS
// ============================================

/*
import { useItem, useCreateItem, useUpdateItem } from './hooks/useExampleQuery';

function ItemDetail({ id }) {
  // Query
  const { data: item, isLoading, error, refetch } = useItem(id);

  // Mutation
  const updateItem = useUpdateItem();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const handleUpdate = () => {
    updateItem.mutate(
      { id, data: { name: 'Updated' } },
      {
        onSuccess: () => {
          console.log('Updated!');
        },
      }
    );
  };

  return (
    <div>
      <h2>{item.name}</h2>
      <button onClick={handleUpdate} disabled={updateItem.isLoading}>
        {updateItem.isLoading ? 'Updating...' : 'Update'}
      </button>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}

function ItemList() {
  const { data: items, isLoading } = useItems({ status: 'active' });
  const createItem = useCreateItem();

  const handleCreate = () => {
    createItem.mutate(
      { name: 'New Item' },
      {
        onSuccess: () => {
          console.log('Created!');
        },
      }
    );
  };

  return (
    <div>
      <button onClick={handleCreate}>Add Item</button>
      {items?.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
*/
