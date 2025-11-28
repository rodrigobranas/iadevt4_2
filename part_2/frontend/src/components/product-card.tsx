import type { Product } from '@/types/product';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { EditProductDialog } from '@/components/edit-product-dialog';
import { useProducts } from '@/hooks/use-products';
import { useProductImages } from '@/hooks/use-product-images';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageOff, Pencil, Trash2 } from 'lucide-react';

const formatPriceBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    value
  );

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { deleteProduct, isDeleting } = useProducts();
  const { data: images = [], isLoading: isLoadingImages } = useProductImages(product.id);

  const coverUrl = images[0]?.url;

  const handleDelete = () => {
    deleteProduct(product.id);
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <div className="aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
        {isLoadingImages ? (
          <Skeleton className="w-full h-full" />
        ) : coverUrl ? (
          <img
            src={coverUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
            <ImageOff className="h-6 w-6" />
            <span className="text-xs">Sem imagem</span>
          </div>
        )}
      </div>
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {product.name}
          </CardTitle>
          <Badge variant="secondary" className="shrink-0">
            {product.sku}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
          {product.description}
        </p>
        <div className="text-lg font-bold text-primary">
          {formatPriceBRL(product.price)}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-0">
        <EditProductDialog product={product}>
          <Button variant="outline" size="icon" title="Editar">
            <Pencil className="h-4 w-4" />
          </Button>
        </EditProductDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              title="Excluir"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o
                produto <strong>{product.name}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
