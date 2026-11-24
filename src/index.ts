import express, { type Request, type Response } from 'express'
import cors from 'cors'
import { randomUUID } from 'node:crypto'

const app = express()
const port = Number(process.env.PORT || 3001)
app.use(cors({ origin: true }))
app.use(express.json({ limit: '1mb' }))

export type Product = {
  id: string
  name: string
  category: string
  price: number
  compareAtPrice?: number
  image: string
  colors: string[]
  sizes: string[]
  stock: number
  badge?: string
  description?: string
}

type OrderItemInput = { productId: string; size: string; quantity: number }
type Order = {
  id: string
  customerName: string
  contact: string
  items: Array<OrderItemInput & { name: string; unitPrice: number }>
  total: number
  status: 'awaiting_payment'
  createdAt: string
}

const products: Product[] = [
  { id: 'p-01', name: 'Vestido Alba', category: 'Vestidos', price: 42990, compareAtPrice: 54990, image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=1000&q=85', colors: ['#c58272', '#262421'], sizes: ['XS', 'S', 'M', 'L'], stock: 8, badge: 'MÁS VENDIDO', description: 'Vestido midi de caída suave, pensado para acompañarte todo el día.' },
  { id: 'p-02', name: 'Blusa Lino', category: 'Blusas', price: 32990, image: 'https://images.unsplash.com/photo-1564257577-6a2b7b0f8b2b?auto=format&fit=crop&w=1000&q=85', colors: ['#e9e1d3', '#97a08e'], sizes: ['XS', 'S', 'M', 'L', 'XL'], stock: 12, description: 'Lino liviano con una silueta relajada y versátil.' },
  { id: 'p-03', name: 'Pantalón Nube', category: 'Pantalones', price: 38990, image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1000&q=85', colors: ['#d4c8b5', '#373634'], sizes: ['XS', 'S', 'M', 'L'], stock: 6, badge: 'NUEVO', description: 'Tiro alto y pierna recta. Un esencial para combinar sin esfuerzo.' },
  { id: 'p-04', name: 'Top Brisa', category: 'Tops', price: 24990, image: 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&w=1000&q=85', colors: ['#d8a79c', '#f0e9df'], sizes: ['XS', 'S', 'M', 'L'], stock: 10, description: 'Un top delicado con textura sutil y detalles cuidados.' },
  { id: 'p-05', name: 'Chaqueta Siena', category: 'Chaquetas', price: 69990, image: 'https://images.unsplash.com/photo-1548624149-fc7c8f4b3e1f?auto=format&fit=crop&w=1000&q=85', colors: ['#766b59', '#b69379'], sizes: ['S', 'M', 'L', 'XL'], stock: 4, badge: 'EDICIÓN LIMITADA', description: 'Una capa ligera para esos días que empiezan frescos.' },
  { id: 'p-06', name: 'Falda Serena', category: 'Faldas', price: 35990, image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=1000&q=85', colors: ['#a77d70', '#2d302c'], sizes: ['XS', 'S', 'M', 'L'], stock: 7, description: 'Falda de movimiento fluido, fácil de llevar de día o de noche.' },
  { id: 'p-07', name: 'Camisa Clara', category: 'Blusas', price: 37990, image: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=1000&q=85', colors: ['#f1eee8', '#aeb6a4'], sizes: ['S', 'M', 'L', 'XL'], stock: 9, description: 'Camisa atemporal en algodón suave con calce ligeramente amplio.' },
  { id: 'p-08', name: 'Vestido Oliva', category: 'Vestidos', price: 47990, image: 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?auto=format&fit=crop&w=1000&q=85', colors: ['#8e9278', '#322f2c'], sizes: ['XS', 'S', 'M', 'L'], stock: 5, badge: 'NUEVO', description: 'Silueta elegante y cómoda, con un tono natural que combina con todo.' },
]
const orders: Order[] = []

app.get('/api/health', (_req: Request, res: Response) => res.json({ status: 'ok', service: 'amara-store-api' }))
app.get('/api/products', (_req: Request, res: Response) => res.json(products))
app.get('/api/products/:id', (req: Request, res: Response) => {
  const product = products.find((item) => item.id === req.params.id)
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' })
  return res.json(product)
})
app.get('/api/orders', (_req: Request, res: Response) => res.json(orders))
app.post('/api/orders', (req: Request, res: Response) => {
  const { customerName, contact, items } = req.body as {
    customerName?: string
    contact?: string
    items?: OrderItemInput[]
  }
  if (!customerName?.trim() || !contact?.trim() || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Indica tu nombre, un medio de contacto y al menos un producto.' })
  }
  if (items.some((item) => !item.productId || !item.size || !Number.isInteger(item.quantity) || item.quantity < 1)) {
    return res.status(400).json({ error: 'Hay un producto o una cantidad inválida en el pedido.' })
  }
  const resolved = items.map((item) => {
    const product = products.find((p) => p.id === item.productId)
    return { input: item, product }
  })
  const unavailable = resolved.find(({ input, product }) => !product || !product.sizes.includes(input.size) || product.stock < input.quantity)
  if (unavailable) return res.status(409).json({ error: 'Una prenda o talla ya no tiene stock suficiente. Actualiza tu bolsa e inténtalo de nuevo.' })

  for (const { input, product } of resolved) product!.stock -= input.quantity
  const order: Order = {
    id: `AM-${randomUUID().slice(0, 8).toUpperCase()}`,
    customerName: customerName.trim(),
    contact: contact.trim(),
    items: resolved.map(({ input, product }) => ({ ...input, name: product!.name, unitPrice: product!.price })),
    total: resolved.reduce((sum, { input, product }) => sum + product!.price * input.quantity, 0),
    status: 'awaiting_payment',
    createdAt: new Date().toISOString(),
  }
  orders.unshift(order)
  return res.status(201).json(order)
})

app.use((err: unknown, _req: Request, res: Response, _next: express.NextFunction) => {
  console.error(err)
  return res.status(500).json({ error: 'Error interno del servidor' })
})

app.listen(port, '0.0.0.0', () => {
  console.log(`AMARA API escuchando en http://0.0.0.0:${port}`)
})
