/**
 * Utilidades de Sanitización y Validación de Seguridad Frontend
 * - Previene XSS (Cross-Site Scripting) eliminando etiquetas HTML, scripts, eventos inline y javascript:
 * - Neutraliza patrones de inyección comunes (SQL, NoSQL, caracteres de escape maliciosos)
 * - Valida y restringe formatos estrictos para usuarios, pines y nombres
 */

// Elimina etiquetas HTML y caracteres potencialmente peligrosos de XSS
export function sanitizeText(input, maxLength = 300) {
  if (typeof input !== 'string') return '';
  return input
    .slice(0, maxLength)
    // Elimina etiquetas script y su contenido
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Elimina cualquier etiqueta HTML (<...>)
    .replace(/<[^>]*>/g, '')
    // Elimina eventos inline de JavaScript (onload=, onerror=, etc.)
    .replace(/on\w+\s*=/gi, '')
    // Neutraliza esquemas peligrosos como javascript: o data:
    .replace(/javascript:/gi, '')
    .replace(/data:\s*text\/html/gi, '')
    // Neutraliza intentos de escape para inyección SQL / NoSQL clásica (' " ` ; -- /* */)
    .replace(/['";`\\]/g, '')
    .trim();
}

// Sanitización estricta para nombres de personas, productos y proveedores (letras, números, espacios, acentos, guiones)
export function sanitizeNombre(input, maxLength = 80) {
  if (typeof input !== 'string') return '';
  return input
    .slice(0, maxLength)
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.\-_#/]/g, '')
    .trim();
}

// Sanitización estricta para nombres de usuario (solo letras y números, sin espacios ni caracteres especiales)
export function sanitizeUsuario(input, maxLength = 25) {
  if (typeof input !== 'string') return '';
  return input
    .slice(0, maxLength)
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
}

// Sanitización estricta para PIN numérico (solo dígitos, longitud estándar 4 a 6)
export function sanitizePin(input, maxLength = 6) {
  if (typeof input !== 'string') return '';
  return input.slice(0, maxLength).replace(/\D/g, '');
}

// Sanitización para notas y observaciones (permite puntuación común segura)
export function sanitizeNota(input, maxLength = 250) {
  if (typeof input !== 'string') return '';
  return input
    .slice(0, maxLength)
    .replace(/<[^>]*>/g, '')
    .replace(/['";`\\]/g, '')
    .trim();
}

// Validación estricta de correo electrónico
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email.trim());
}

