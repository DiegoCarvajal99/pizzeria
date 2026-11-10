export const INITIAL_PROVEEDORES = [
  { id: "prov-distripapa", nombre: "Distripapa", telefono: "+573001234567", notas: "Papas y tubérculos" },
  { id: "prov-mercado", nombre: "Mercado", telefono: "+573002345678", notas: "Verduras frescas" },
  { id: "prov-ara", nombre: "Ara", telefono: "", notas: "Lácteos y abarrotes" },
  { id: "prov-d1", nombre: "D1", telefono: "", notas: "Desechables y aseo" },
  { id: "prov-paula", nombre: "Paula", telefono: "+573003456789", notas: "Embutidos y carnes" },
  { id: "prov-sub", nombre: "Sub", telefono: "+573004567890", notas: "Cajas y empaques" }
];

export const INITIAL_PRODUCTOS = [
  // Distripapa
  { id: "prod-1", nombre: "Papa pastusa", unidad: "bulto", stock: 1, stockMinimo: 2, proveedorId: "prov-distripapa", proveedorNombre: "Distripapa", categoria: "Verduras" },
  { id: "prod-2", nombre: "Papa criolla", unidad: "kg", stock: 5, stockMinimo: 3, proveedorId: "prov-distripapa", proveedorNombre: "Distripapa", categoria: "Verduras" },
  { id: "prod-3", nombre: "Papas a la francesa", unidad: "bolsa", stock: 3, stockMinimo: 4, proveedorId: "prov-distripapa", proveedorNombre: "Distripapa", categoria: "Congelados" },

  // Mercado
  { id: "prod-4", nombre: "Tomate", unidad: "kg", stock: 4, stockMinimo: 5, proveedorId: "prov-mercado", proveedorNombre: "Mercado", categoria: "Verduras" },
  { id: "prod-5", nombre: "Cebolla cabezona", unidad: "kg", stock: 6, stockMinimo: 4, proveedorId: "prov-mercado", proveedorNombre: "Mercado", categoria: "Verduras" },
  { id: "prod-6", nombre: "Pimentón", unidad: "kg", stock: 2, stockMinimo: 3, proveedorId: "prov-mercado", proveedorNombre: "Mercado", categoria: "Verduras" },
  { id: "prod-7", nombre: "Champiñones", unidad: "lb", stock: 1, stockMinimo: 3, proveedorId: "prov-mercado", proveedorNombre: "Mercado", categoria: "Verduras" },
  { id: "prod-8", nombre: "Albahaca", unidad: "manojo", stock: 0, stockMinimo: 2, proveedorId: "prov-mercado", proveedorNombre: "Mercado", categoria: "Hierbas" },

  // Ara
  { id: "prod-9", nombre: "Queso mozzarella", unidad: "bloque", stock: 2, stockMinimo: 4, proveedorId: "prov-ara", proveedorNombre: "Ara", categoria: "Lácteos" },
  { id: "prod-10", nombre: "Jamón", unidad: "kg", stock: 5, stockMinimo: 3, proveedorId: "prov-ara", proveedorNombre: "Ara", categoria: "Carnes" },
  { id: "prod-11", nombre: "Aceite", unidad: "litro", stock: 3, stockMinimo: 4, proveedorId: "prov-ara", proveedorNombre: "Ara", categoria: "Abarrotes" },

  // D1
  { id: "prod-12", nombre: "Servilletas", unidad: "paquete", stock: 4, stockMinimo: 5, proveedorId: "prov-d1", proveedorNombre: "D1", categoria: "Desechables" },
  { id: "prod-13", nombre: "Bolsas para basura", unidad: "paquete", stock: 2, stockMinimo: 3, proveedorId: "prov-d1", proveedorNombre: "D1", categoria: "Aseo" },

  // Paula
  { id: "prod-14", nombre: "Pepperoni", unidad: "kg", stock: 1, stockMinimo: 3, proveedorId: "prov-paula", proveedorNombre: "Paula", categoria: "Carnes" },
  { id: "prod-15", nombre: "Tocineta", unidad: "kg", stock: 2, stockMinimo: 2, proveedorId: "prov-paula", proveedorNombre: "Paula", categoria: "Carnes" },

  // Sub
  { id: "prod-16", nombre: "Cajas de pizza", unidad: "paquete", stock: 5, stockMinimo: 10, proveedorId: "prov-sub", proveedorNombre: "Sub", categoria: "Empaques" },
  { id: "prod-17", nombre: "Vasos desechables", unidad: "paquete", stock: 3, stockMinimo: 2, proveedorId: "prov-sub", proveedorNombre: "Sub", categoria: "Desechables" }
];

export const UNIDADES_DISPONIBLES = [
  "kg", "lb", "unidad", "paquete", "bolsa", "caja", "litro", "galón", "bloque", "bulto", "lata", "manojo"
];

