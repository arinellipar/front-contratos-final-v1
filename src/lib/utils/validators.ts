/**
 * @fileoverview Funções de validação de dados
 * @module @/lib/utils/validators
 */

/**
 * Validate CPF
 * @description Valida CPF brasileiro
 */
export const isValidCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, "");

  if (cleaned.length !== 11) return false;

  // Verifica sequências repetidas
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  // Validação do primeiro dígito
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit === 10 || digit === 11) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;

  // Validação do segundo dígito
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit === 10 || digit === 11) digit = 0;
  if (digit !== parseInt(cleaned.charAt(10))) return false;

  return true;
};

/**
 * Validate CNPJ
 * @description Valida CNPJ brasileiro
 */
export const isValidCNPJ = (cnpj: string): boolean => {
  const cleaned = cnpj.replace(/\D/g, "");

  if (cleaned.length !== 14) return false;

  // Verifica sequências repetidas
  if (/^(\d)\1{13}$/.test(cleaned)) return false;

  // Validação do primeiro dígito
  let length = cleaned.length - 2;
  let numbers = cleaned.substring(0, length);
  const digits = cleaned.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  // Validação do segundo dígito
  length = length + 1;
  numbers = cleaned.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
};

/**
 * Validate email
 * @description Valida email com regex otimizado
 */
export const isValidEmail = (email: string): boolean => {
  const regex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return regex.test(email);
};

/**
 * Validate phone
 * @description Valida telefone brasileiro
 */
export const isValidPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length === 10 || cleaned.length === 11;
};

/**
 * Validate CEP
 * @description Valida CEP brasileiro
 */
export const isValidCEP = (cep: string): boolean => {
  const cleaned = cep.replace(/\D/g, "");
  return cleaned.length === 8 && !/^(\d)\1{7}$/.test(cleaned);
};

/**
 * Validate URL
 * @description Valida URL completa
 */
export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate date
 * @description Valida se string é data válida
 */
export const isValidDate = (date: string): boolean => {
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
};

/**
 * Validate password strength
 * @description Valida força da senha
 */
export const validatePasswordStrength = (
  password: string
): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push("Senha deve ter pelo menos 8 caracteres");
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Adicione letras minúsculas");
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Adicione letras maiúsculas");
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push("Adicione números");
  }

  return {
    isValid: score >= 4,
    score,
    feedback,
  };
};

/**
 * Validate credit card
 * @description Valida número de cartão de crédito (Luhn)
 */
export const isValidCreditCard = (cardNumber: string): boolean => {
  const cleaned = cardNumber.replace(/\D/g, "");

  if (cleaned.length < 13 || cleaned.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i));

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Validate file extension
 * @description Valida extensão de arquivo
 */
export const isValidFileExtension = (
  fileName: string,
  allowedExtensions: string[]
): boolean => {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  return allowedExtensions.includes(extension);
};

/**
 * Validate file size
 * @description Valida tamanho de arquivo
 */
export const isValidFileSize = (
  fileSize: number,
  maxSizeMB: number
): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSize <= maxSizeBytes;
};

/**
 * Validate image dimensions
 * @description Valida dimensões de imagem
 */
export const validateImageDimensions = async (
  file: File,
  constraints: {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
  }
): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const { minWidth, maxWidth, minHeight, maxHeight } = constraints;

      let isValid = true;

      if (minWidth && img.width < minWidth) isValid = false;
      if (maxWidth && img.width > maxWidth) isValid = false;
      if (minHeight && img.height < minHeight) isValid = false;
      if (maxHeight && img.height > maxHeight) isValid = false;

      resolve(isValid);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };

    img.src = url;
  });
};

/**
 * Validate JSON
 * @description Valida se string é JSON válido
 */
export const isValidJSON = (json: string): boolean => {
  try {
    JSON.parse(json);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate UUID
 * @description Valida UUID v4
 */
export const isValidUUID = (uuid: string): boolean => {
  const regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
};

/**
 * Validate hex color
 * @description Valida cor hexadecimal
 */
export const isValidHexColor = (color: string): boolean => {
  const regex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return regex.test(color);
};

/**
 * Validate IPv4
 * @description Valida endereço IPv4
 */
export const isValidIPv4 = (ip: string): boolean => {
  const regex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return regex.test(ip);
};
