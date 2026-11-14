export type DocumentDefinition = {id: number | string; slug: string; name: string; type: string; is_required?: number | boolean; need_expired_date?: number | boolean};
import {validateDocumentFile} from '../../../utils/documentUpload';
export type DocumentFile = {uri: string; name: string; type: string; size?: number | null};
export type DocumentDraft = {file?: DocumentFile; expiry?: string};
export function documentDate(value: unknown): string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : '';
}
export function localDocumentDate(date = new Date()): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}
export function existingDocument(records: any[], definition: DocumentDefinition) {
  return records.find(record => String(record.document_id ?? record.document?.id) === String(definition.id) || record.document?.slug === definition.slug);
}
export function documentUpdates(definitions: DocumentDefinition[], records: any[], drafts: Record<string, DocumentDraft>, today = localDocumentDate()) {
  return Object.entries(drafts).map(([slug, draft]) => {
    const definition = definitions.find(item => item.slug === slug);
    if (!definition) throw new Error('This document is no longer available. Refresh the list.');
    const original = existingDocument(records, definition);
    if (!draft.file && !original?.document_image_url) throw new Error(`Please select a file for ${definition.name}.`);
    if (draft.file) {
      validateDocumentFile(draft.file);
    }
    const expiry = draft.expiry ?? documentDate(original?.expired_at);
    if (Number(definition.need_expired_date) === 1 && !expiry) throw new Error(`Choose the expiry date for ${definition.name}.`);
    if (expiry && (!/^\d{4}-\d{2}-\d{2}$/.test(expiry) || Number.isNaN(Date.parse(expiry)) || expiry < today)) throw new Error(`Choose a valid future expiry date for ${definition.name}.`);
    return {slug, file: draft.file, expired_at: expiry || undefined};
  });
}
