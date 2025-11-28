import { Hono } from 'hono';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { db } from './db';

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
  createdAt: string;
};

export type ProductImage = {
  id: string;
  productId: string;
  url: string;
  position: number;
  createdAt: string;
};

const ProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  sku: z.string().min(1),
});

const productsRouter = new Hono();

const ALLOWED_MIMETYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const uploadsRoot = path.resolve(process.cwd(), 'uploads');
const productUploadsDir = path.join(uploadsRoot, 'products');
fs.mkdirSync(productUploadsDir, { recursive: true });

const insertImageStmt = db.prepare(
  `INSERT INTO product_images (id, productId, url, position, createdAt)
   VALUES (?, ?, ?, ?, ?)`
);

const getProductByIdStmt = db.prepare('SELECT * FROM products WHERE id = ?');

// POST /api/products
productsRouter.post('/products', async (c) => {
  try {
    const body = await c.req.json();
    const validationResult = ProductSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json(
        {
          error: 'Validation error',
          message: validationResult.error.issues.map((e) => e.message).join(', '),
        },
        400
      );
    }

    const { name, description, price, sku } = validationResult.data;
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    try {
      const insertStmt = db.prepare(`
        INSERT INTO products (id, name, description, price, sku, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      insertStmt.run(id, name, description, price, sku, createdAt);

      const product: Product = {
        id,
        name,
        description,
        price,
        sku,
        createdAt,
      };

      return c.json({ data: product }, 201);
    } catch (error: any) {
      if (error.message?.includes('UNIQUE constraint')) {
        return c.json(
          {
            error: 'Validation error',
            message: 'SKU already exists',
          },
          400
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error creating product:', error);
    return c.json(
      {
        error: 'Something went wrong!',
        message: error.message,
      },
      500
    );
  }
});

// GET /api/products
productsRouter.get('/products', async (c) => {
  try {
    const stmt = db.prepare('SELECT * FROM products ORDER BY createdAt DESC');
    const rows = stmt.all() as Product[];

    return c.json({ data: rows }, 200);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return c.json(
      {
        error: 'Something went wrong!',
        message: error.message,
      },
      500
    );
  }
});

// PUT /api/products/:id
productsRouter.put('/products/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const validationResult = ProductSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json(
        {
          error: 'Validation error',
          message: validationResult.error.issues.map((e) => e.message).join(', '),
        },
        400
      );
    }

    const { name, description, price, sku } = validationResult.data;

    const existing = getProductByIdStmt.get(id);

    if (!existing) {
      return c.json({ error: 'Not found', message: 'Product not found' }, 404);
    }

    try {
      const updateStmt = db.prepare(`
        UPDATE products
        SET name = ?, description = ?, price = ?, sku = ?
        WHERE id = ?
      `);
      updateStmt.run(name, description, price, sku, id);

      const getStmt = db.prepare('SELECT * FROM products WHERE id = ?');
      const updatedProduct = getStmt.get(id) as Product;

      return c.json({ data: updatedProduct }, 200);
    } catch (error: any) {
      if (error.message?.includes('UNIQUE constraint')) {
        return c.json(
          {
            error: 'Validation error',
            message: 'SKU already exists',
          },
          400
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error updating product:', error);
    return c.json(
      {
        error: 'Something went wrong!',
        message: error.message,
      },
      500
    );
  }
});

// GET /api/products/:id/images
productsRouter.get('/products/:id/images', (c) => {
  try {
    const productId = c.req.param('id');
    const product = getProductByIdStmt.get(productId);

    if (!product) {
      return c.json({ error: 'Not found', message: 'Product not found' }, 404);
    }

    const rows = db.prepare(
      'SELECT * FROM product_images WHERE productId = ? ORDER BY position ASC, createdAt ASC'
    );
    const images = rows.all(productId) as ProductImage[];

    return c.json({ data: images }, 200);
  } catch (error: any) {
    console.error('Error fetching product images:', error);
    return c.json(
      {
        error: 'Something went wrong!',
        message: error.message,
      },
      500
    );
  }
});

// POST /api/products/:id/images
productsRouter.post('/products/:id/images', async (c) => {
  try {
    const productId = c.req.param('id');
    const product = getProductByIdStmt.get(productId);

    if (!product) {
      return c.json({ error: 'Not found', message: 'Product not found' }, 404);
    }

    const formData = await c.req.formData();
    const files = formData.getAll('images').filter((file): file is File => file instanceof File);

    if (!files.length) {
      return c.json({ error: 'Validation error', message: 'No images provided' }, 400);
    }

    if (files.length > MAX_FILES) {
      return c.json(
        { error: 'Validation error', message: `Maximum of ${MAX_FILES} files per request` },
        400
      );
    }

    for (const file of files) {
      if (file.size === 0) {
        return c.json({ error: 'Validation error', message: 'Empty file is not allowed' }, 400);
      }

      if (file.size > MAX_FILE_SIZE) {
        return c.json({ error: 'File too large', message: 'Max size is 5MB per file' }, 413);
      }

      if (!ALLOWED_MIMETYPES.has(file.type)) {
        return c.json({ error: 'Unsupported media type', message: 'Invalid image type' }, 415);
      }
    }

    const currentMax = db
      .prepare('SELECT MAX(position) as maxPos FROM product_images WHERE productId = ?')
      .get(productId) as { maxPos: number | null };

    let nextPosition = (currentMax?.maxPos ?? -1) + 1;
    const createdAt = new Date().toISOString();
    const createdImages: ProductImage[] = [];

    for (const file of files) {
      const extension = MIME_EXTENSION[file.type];
      const filename = `${crypto.randomUUID()}.${extension}`;
      const filePath = path.join(productUploadsDir, filename);

      await Bun.write(filePath, file);

      const id = crypto.randomUUID();
      const url = `/uploads/products/${filename}`;

      insertImageStmt.run(id, productId, url, nextPosition, createdAt);

      createdImages.push({
        id,
        productId,
        url,
        position: nextPosition,
        createdAt,
      });

      nextPosition += 1;
    }

    return c.json({ data: createdImages }, 201);
  } catch (error: any) {
    console.error('Error uploading product images:', error);
    return c.json(
      {
        error: 'Something went wrong!',
        message: error.message,
      },
      500
    );
  }
});

// DELETE /api/products/:id/images/:imageId
productsRouter.delete('/products/:id/images/:imageId', (c) => {
  try {
    const productId = c.req.param('id');
    const imageId = c.req.param('imageId');

    const product = getProductByIdStmt.get(productId);
    if (!product) {
      return c.json({ error: 'Not found', message: 'Product not found' }, 404);
    }

    const imageStmt = db.prepare('SELECT * FROM product_images WHERE id = ? AND productId = ?');
    const image = imageStmt.get(imageId, productId) as ProductImage | undefined;

    if (!image) {
      return c.json({ error: 'Not found', message: 'Image not found' }, 404);
    }

    const deleteStmt = db.prepare('DELETE FROM product_images WHERE id = ?');
    deleteStmt.run(imageId);

    if (image.url.startsWith('/uploads/products/')) {
      const filename = path.basename(image.url);
      const filePath = path.join(productUploadsDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return c.body(null, 204);
  } catch (error: any) {
    console.error('Error deleting product image:', error);
    return c.json(
      {
        error: 'Something went wrong!',
        message: error.message,
      },
      500
    );
  }
});

// DELETE /api/products/:id
productsRouter.delete('/products/:id', (c) => {
  try {
    const id = c.req.param('id');

    const existing = getProductByIdStmt.get(id);

    if (!existing) {
      return c.json({ error: 'Not found', message: 'Product not found' }, 404);
    }

    const images = db
      .prepare('SELECT * FROM product_images WHERE productId = ?')
      .all(id) as ProductImage[];

    for (const image of images) {
      if (image.url.startsWith('/uploads/products/')) {
        const filename = path.basename(image.url);
        const filePath = path.join(productUploadsDir, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    db.prepare('DELETE FROM product_images WHERE productId = ?').run(id);

    const deleteStmt = db.prepare('DELETE FROM products WHERE id = ?');
    deleteStmt.run(id);

    return c.body(null, 204);
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return c.json(
      {
        error: 'Something went wrong!',
        message: error.message,
      },
      500
    );
  }
});

export default productsRouter;
