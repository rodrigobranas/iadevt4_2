import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useProducts } from '@/hooks/use-products';
import { ProductCard } from '@/components/product-card';
import { AddProductDialog } from '@/components/add-product-dialog';
import { Plus, RefreshCw } from 'lucide-react';

export function ProductsPage() {
  const { products, isLoading, isError, error, refetch } = useProducts();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Produtos</h2>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Produto
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="h-full flex flex-col">
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="space-y-4 flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Produtos</h2>
          <Button onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
        </div>
        <Card className="p-8 text-center">
          <CardContent className="space-y-4">
            <h3 className="text-xl font-semibold text-destructive">
              Erro ao carregar produtos
            </h3>
            <p className="text-muted-foreground">
              {error?.message || 'Ocorreu um erro inesperado. Tente novamente.'}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Produtos</h2>
          <AddProductDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Produto
            </Button>
          </AddProductDialog>
        </div>
        <Card className="p-8 text-center">
          <CardContent className="space-y-4">
            <h3 className="text-xl font-semibold">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground">
              Comece adicionando seu primeiro produto à loja.
            </p>
            <AddProductDialog>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Produto
              </Button>
            </AddProductDialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Produtos</h2>
        <AddProductDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Produto
          </Button>
        </AddProductDialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
