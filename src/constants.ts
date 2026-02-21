export type Status = 'Aberto' | 'Em Análise' | 'Concluído' | 'Atrasado';

export interface Protocol {
  id: string;
  service: string;
  address: string;
  date: string;
  status: Status;
  category: string;
  requester?: string;
}
