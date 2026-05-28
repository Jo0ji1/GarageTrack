import type { MaintenanceCategoryId, MaintenanceDraft } from '../domain/models';

export interface VálidationError {
  field: string;
  message: string;
}

export interface DraftVálidationResult {
  valid: boolean;
  errors: VálidationError[];
  /** Draft normalizado (com valores limpos e canônicos). Só presente se valid. */
  normalized?: MaintenanceDraft;
}

const NON_NEGATIVE_INT = /^\d+$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Válida e normaliza um `MaintenanceDraft` antes da persistência.
 * Garante invariantes do domínio sem depender de libs externas.
 */
export function válidateMaintenanceDraft(draft: MaintenanceDraft): DraftVálidationResult {
  const errors: VálidationError[] = [];

  const title = draft.title?.trim() ?? '';
  if (title.length < 3) {
    errors.push({ field: 'title', message: 'Descreva o serviço (mín. 3 letras).' });
  }
  if (title.length > 120) {
    errors.push({ field: 'title', message: 'Título muito longo (máx. 120 caracteres).' });
  }

  const categoryId = draft.categoryId as MaintenanceCategoryId;
  if (!categoryId) {
    errors.push({ field: 'categoryId', message: 'Selecione uma categoria.' });
  }

  if (!ISO_DATE.test(draft.serviceDate ?? '')) {
    errors.push({ field: 'serviceDate', message: 'Data inválida. Use formato YYYY-MM-DD.' });
  } else {
    const date = new Date(draft.serviceDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (date.getTime() > today.getTime()) {
      errors.push({ field: 'serviceDate', message: 'Data não pode estar no futuro.' });
    }
  }

  if (draft.mileage === undefined || draft.mileage === null) {
    errors.push({ field: 'mileage', message: 'Informe a quilometragem.' });
  } else if (!NON_NEGATIVE_INT.test(String(draft.mileage)) || draft.mileage < 0) {
    errors.push({ field: 'mileage', message: 'Quilometragem deve ser inteira e ≥ 0.' });
  } else if (draft.mileage > 9_999_999) {
    errors.push({ field: 'mileage', message: 'Quilometragem absurda — verifique.' });
  }

  if (draft.costCents === undefined || draft.costCents === null) {
    errors.push({ field: 'costCents', message: 'Informe o custo (use 0 se gratuito).' });
  } else if (!Number.isFinite(draft.costCents) || draft.costCents < 0) {
    errors.push({ field: 'costCents', message: 'Custo deve ser um número ≥ 0.' });
  } else if (draft.costCents > 100_000_000) {
    errors.push({ field: 'costCents', message: 'Custo absurdo — verifique.' });
  }

  if (draft.notes && draft.notes.length > 2000) {
    errors.push({ field: 'notes', message: 'Anotações muito longas (máx. 2000 caracteres).' });
  }

  if (draft.parts?.brand && draft.parts.brand.length > 60) {
    errors.push({ field: 'parts.brand', message: 'Marca muito longa (máx. 60).' });
  }

  if (draft.parts?.specification && draft.parts.specification.length > 60) {
    errors.push({ field: 'parts.specification', message: 'Especificação muito longa (máx. 60).' });
  }

  if (draft.latitude !== undefined && draft.latitude !== null) {
    if (!Number.isFinite(draft.latitude) || draft.latitude < -90 || draft.latitude > 90) {
      errors.push({ field: 'latitude', message: 'Latitude fora do intervalo válido.' });
    }
  }
  if (draft.longitude !== undefined && draft.longitude !== null) {
    if (!Number.isFinite(draft.longitude) || draft.longitude < -180 || draft.longitude > 180) {
      errors.push({ field: 'longitude', message: 'Longitude fora do intervalo válido.' });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    normalized: {
      ...draft,
      title,
      notes: draft.notes?.trim() ?? '',
      parts: {
        brand: draft.parts?.brand?.trim() || undefined,
        specification: draft.parts?.specification?.trim() || undefined,
        serialNumber: draft.parts?.serialNumber?.trim() || undefined,
      },
    },
  };
}
