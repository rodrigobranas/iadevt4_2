import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Product, CreateProduct, UpdateProduct } from '@/types/product';
import { productsSchema, createProductSchema, productSchema } from '@/types/product';

const API_BASE = '/api';

async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${API_BASE}/products`);

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.data) {
    throw new Error('Invalid response format');
  }

  const validatedData = productsSchema.safeParse(data.data);

  if (!validatedData.success) {
    console.error('Validation error:', validatedData.error);
    throw new Error('Invalid product data received');
  }

  return validatedData.data;
}

async function createProduct(product: CreateProduct): Promise<Product> {
  const response = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Failed to create product: ${response.statusText}`
    );
  }

  const data = await response.json();

  if (!data.data) {
    throw new Error('Invalid response format');
  }

  const validatedData = createProductSchema.omit({}).safeParse(data.data);

  if (!validatedData.success) {
    console.error('Validation error:', validatedData.error);
    throw new Error('Invalid product data received');
  }

  return data.data;
}

async function updateProduct({ id, data }: { id: string; data: UpdateProduct }): Promise<Product> {
  const response = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Failed to update product: ${response.statusText}`
    );
  }

  const responseData = await response.json();

  if (!responseData.data) {
    throw new Error('Invalid response format');
  }

  const validatedData = productSchema.safeParse(responseData.data);

  if (!validatedData.success) {
    console.error('Validation error:', validatedData.error);
    throw new Error('Invalid product data received');
  }

  return validatedData.data;
}

async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Failed to delete product: ${response.statusText}`
    );
  }
}

export function useProducts() {
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 30_000,
    retry: 1,
  });

  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return {
    products: productsQuery.data || [],
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    error: productsQuery.error,
    refetch: productsQuery.refetch,
    createProduct: createProductMutation.mutate,
    isCreating: createProductMutation.isPending,
    createError: createProductMutation.error,
    updateProduct: updateProductMutation.mutate,
    isUpdating: updateProductMutation.isPending,
    updateError: updateProductMutation.error,
    deleteProduct: deleteProductMutation.mutate,
    isDeleting: deleteProductMutation.isPending,
    deleteError: deleteProductMutation.error,
  };
}

export type UseProductsReturn = ReturnType<typeof useProducts>;
