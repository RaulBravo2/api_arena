# AMARA store API (Node.js + Express + TypeScript)

API inicial para catálogo, stock y registro de pedidos. Los pagos quedan fuera de esta primera etapa: los pedidos se crean con estado `awaiting_payment` y no se cobra al cliente.

## Desarrollo

```bash
npm install
npm run dev
```

Servidor por defecto: `http://localhost:3001` (puerto configurable con `PORT`).

## Endpoints

- `GET /api/health` — estado del servicio.
- `GET /api/products` — catálogo y stock disponible.
- `GET /api/products/:id` — detalle de un producto.
- `GET /api/orders` — pedidos creados (solo prototipo; sin autenticación).
- `POST /api/orders` — valida stock, reserva unidades y registra pedido pendiente. Body: `{ "customerName": "...", "contact": "...", "items": [{ "productId": "p-01", "size": "S", "quantity": 1 }] }`.

## Importante antes de producción

Los productos, stock y pedidos viven en memoria y se reinician al reiniciar el servidor. El siguiente paso es conectarlos a una base de datos (por ejemplo PostgreSQL) y proteger las rutas de administración/autenticación. No desplegar la ruta de pedidos sin autenticación ni persistencia.
