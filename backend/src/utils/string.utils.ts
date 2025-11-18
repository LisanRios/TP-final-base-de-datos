export const normalizeTerm = (s: string) =>
    s?.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
