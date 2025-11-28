import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useProducts } from '@/hooks/use-products';
import { useUploadProductImages } from '@/hooks/use-product-images';
import type { UpdateProduct, Product } from '@/types/product';
import { updateProductSchema } from '@/types/product';

interface EditProductDialogProps {
  product: Product;
  children: React.ReactNode;
}

export function EditProductDialog({ product, children }: EditProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { updateProduct, isUpdating, updateError } = useProducts();
  const uploadImages = useUploadProductImages();

  const form = useForm<UpdateProduct>({
    resolver: zodResolver(updateProductSchema),
    defaultValues: {
      name: product.name,
      description: product.description,
      price: product.price,
      sku: product.sku,
    },
  });

  // Reset form when product changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        name: product.name,
        description: product.description,
        price: product.price,
        sku: product.sku,
      });
    }
  }, [product, open, form]);

  useEffect(() => {
    if (!open) {
      setFiles([]);
      setUploadError(null);
    }
  }, [open]);

  const onSubmit = (data: UpdateProduct) => {
    setUploadError(null);

    updateProduct(
      { id: product.id, data },
      {
        onSuccess: () => {
          if (!files.length) {
            setOpen(false);
            setFiles([]);
            return;
          }

          uploadImages.mutate(
            { productId: product.id, files },
            {
              onSuccess: () => {
                setOpen(false);
                setFiles([]);
              },
              onError: (error) => {
                const message =
                  error instanceof Error ? error.message : 'Erro ao enviar imagens';
                setUploadError(message);
              },
            }
          );
        },
      }
    );
  };

  const isSubmitting = isUpdating || uploadImages.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Produto</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do produto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição do produto"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input placeholder="SKU do produto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <FormLabel>Imagens (opcional)</FormLabel>
              <Input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const selected = Array.from(event.target.files || []);
                  setFiles(selected);
                  setUploadError(null);
                }}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                {files.length
                  ? `${files.length} arquivo(s) selecionado(s) — até 5 arquivos, 5MB cada (jpg/png/webp)`
                  : 'Selecione até 5 arquivos, máximo 5MB cada (jpg, png, webp)'}
              </p>
            </div>
            {updateError && (
              <div className="text-sm text-destructive">
                Erro ao atualizar produto: {updateError.message}
              </div>
            )}
            {uploadError && (
              <div className="text-sm text-destructive">Erro no upload: {uploadError}</div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
