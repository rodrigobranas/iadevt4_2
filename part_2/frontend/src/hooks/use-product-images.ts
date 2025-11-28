import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productImagesSchema, type ProductImage } from '@/types/product-image';

const API_BASE = '/api';

type UploadPayload = {
  productId: string;
  files: File[];
};

async function uploadProductImages({ productId, files }: UploadPayload): Promise<ProductImage[]> {
  if (!files.length) {
    throw new Error('Selecione pelo menos uma imagem');
  }

  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));

  const response = await fetch(`${API_BASE}/products/${productId}/images`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || 'Falha ao fazer upload das imagens';
    throw new Error(message);
  }

  const data = await response.json();
  const parsed = productImagesSchema.safeParse(data.data);

  if (!parsed.success) {
    throw new Error('Resposta de imagens inválida');
  }

  return parsed.data;
}

async function fetchProductImages(productId: string): Promise<ProductImage[]> {
  const response = await fetch(`${API_BASE}/products/${productId}/images`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Falha ao carregar imagens');
  }

  const data = await response.json();
  const parsed = productImagesSchema.safeParse(data.data);

  if (!parsed.success) {
    throw new Error('Resposta de imagens inválida');
  }

  return parsed.data;
}

export function useUploadProductImages() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: uploadProductImages,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-images', variables.productId] });
    },
  });

  return mutation;
}

export function useProductImages(productId?: string) {
  return useQuery({
    queryKey: ['product-images', productId],
    queryFn: () => fetchProductImages(productId!),
    enabled: Boolean(productId),
    staleTime: 30_000,
  });
}
