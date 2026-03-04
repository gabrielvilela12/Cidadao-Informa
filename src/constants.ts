export type Status =
  // Valores do banco (português)
  | 'Aberto'
  | 'Em Análise'
  | 'Concluído'
  | 'Atrasado'
  // Valores legados usados nas páginas (inglês)
  | 'Open'
  | 'InProgress'
  | 'Resolved'
  | 'Closed';

export interface Protocol {
  id: string;
  service: string;
  address: string;
  date: string;
  status: Status;
  category: string;
  requester?: string;
}
