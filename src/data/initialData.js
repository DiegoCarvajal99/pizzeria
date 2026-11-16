export const INITIAL_PROVEEDORES = [];

export const INITIAL_PRODUCTOS = [];

export const UNIDADES_DISPONIBLES = [
  "KG", "LB", "UNIDAD", "PAQUETE", "BOLSA", "CAJA", "LITRO", "GALÓN", "BLOQUE", "BULTO", "LATA", "MANOJO"
];

// Datos históricos creados previamente para el cliente Liaco Pizzería
export const LIACO_HISTORICO_PROVEEDORES = [
  { id: "prov-distripapa", nombre: "DISTRIPAPA", telefono: "+573001234567", notas: "PAPAS Y TUBÉRCULOS" },
  { id: "prov-mercado", nombre: "MERCADO", telefono: "+573002345678", notas: "VERDURAS FRESCAS" },
  { id: "prov-ara", nombre: "ARA", telefono: "", notas: "LÁCTEOS Y ABARROTES" },
  { id: "prov-d1", nombre: "D1", telefono: "", notas: "DESECHABLES Y ASEO" },
  { id: "prov-paula", nombre: "PAULA", telefono: "+573003456789", notas: "EMBUTIDOS Y CARNES" },
  { id: "prov-sub", nombre: "SUB", telefono: "+573004567890", notas: "CAJAS Y EMPAQUES" }
];

export const LIACO_HISTORICO_PRODUCTOS = [
  // Distripapa
  { id: "prod-1", nombre: "PAPA PASTUSA", unidad: "BULTO", stock: 1, stockMinimo: 2, proveedorId: "prov-distripapa", proveedorNombre: "DISTRIPAPA", categoria: "VERDURAS" },
  { id: "prod-2", nombre: "PAPA CRIOLLA", unidad: "KG", stock: 5, stockMinimo: 3, proveedorId: "prov-distripapa", proveedorNombre: "DISTRIPAPA", categoria: "VERDURAS" },
  { id: "prod-3", nombre: "PAPAS A LA FRANCESA", unidad: "BOLSA", stock: 3, stockMinimo: 4, proveedorId: "prov-distripapa", proveedorNombre: "DISTRIPAPA", categoria: "CONGELADOS" },

  // Mercado
  { id: "prod-4", nombre: "TOMATE", unidad: "KG", stock: 4, stockMinimo: 5, proveedorId: "prov-mercado", proveedorNombre: "MERCADO", categoria: "VERDURAS" },
  { id: "prod-5", nombre: "CEBOLLA CABEZONA", unidad: "KG", stock: 6, stockMinimo: 4, proveedorId: "prov-mercado", proveedorNombre: "MERCADO", categoria: "VERDURAS" },
  { id: "prod-6", nombre: "PIMENTÓN", unidad: "KG", stock: 2, stockMinimo: 3, proveedorId: "prov-mercado", proveedorNombre: "MERCADO", categoria: "VERDURAS" },
  { id: "prod-7", nombre: "CHAMPIÑONES", unidad: "LB", stock: 1, stockMinimo: 3, proveedorId: "prov-mercado", proveedorNombre: "MERCADO", categoria: "VERDURAS" },
  { id: "prod-8", nombre: "ALBAHACA", unidad: "MANOJO", stock: 0, stockMinimo: 2, proveedorId: "prov-mercado", proveedorNombre: "MERCADO", categoria: "HIERBAS" },

  // Ara
  { id: "prod-9", nombre: "QUESO MOZZARELLA", unidad: "BLOQUE", stock: 2, stockMinimo: 4, proveedorId: "prov-ara", proveedorNombre: "ARA", categoria: "LÁCTEOS" },
  { id: "prod-10", nombre: "JAMÓN", unidad: "KG", stock: 5, stockMinimo: 3, proveedorId: "prov-ara", proveedorNombre: "ARA", categoria: "CARNES" },
  { id: "prod-11", nombre: "ACEITE", unidad: "LITRO", stock: 3, stockMinimo: 4, proveedorId: "prov-ara", proveedorNombre: "ARA", categoria: "ABARROTES" },

  // D1
  { id: "prod-12", nombre: "SERVILLETTAS", unidad: "PAQUETE", stock: 4, stockMinimo: 5, proveedorId: "prov-d1", proveedorNombre: "D1", categoria: "DESECHABLES" },
  { id: "prod-13", nombre: "BOLSAS PARA BASURA", unidad: "PAQUETE", stock: 2, stockMinimo: 3, proveedorId: "prov-d1", proveedorNombre: "D1", categoria: "ASEO" },

  // Paula
  { id: "prod-14", nombre: "PEPPERONI", unidad: "KG", stock: 1, stockMinimo: 3, proveedorId: "prov-paula", proveedorNombre: "PAULA", categoria: "CARNES" },
  { id: "prod-15", nombre: "TOCINETA", unidad: "KG", stock: 2, stockMinimo: 2, proveedorId: "prov-paula", proveedorNombre: "PAULA", categoria: "CARNES" },

  // Sub
  { id: "prod-16", nombre: "CAJAS DE PIZZA", unidad: "PAQUETE", stock: 5, stockMinimo: 10, proveedorId: "prov-sub", proveedorNombre: "SUB", categoria: "EMPAQUES" },
  { id: "prod-17", nombre: "VASOS DESECHABLES", unidad: "PAQUETE", stock: 3, stockMinimo: 2, proveedorId: "prov-sub", proveedorNombre: "SUB", categoria: "DESECHABLES" }
];
