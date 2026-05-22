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
  description?: string;
  requester?: string;
  phone?: string;
  ai_priority?: 'baixa' | 'media' | 'alta' | 'critica' | null;
  ai_status?: 'pending' | 'success' | 'failed';
}
