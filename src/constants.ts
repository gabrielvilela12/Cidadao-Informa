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
  /** UF normalizada do local do protocolo. */
  state_code?: string | null;
  date: string;
  status: Status;
  establishment_id?: string | null;
  campaign_id?: string | null;
  /** Custo público em reais registrado ao concluir a correção. */
  resolution_cost?: number | null;
  category: string;
  description?: string;
  requester?: string;
  phone?: string;
  /** Timestamp ISO de abertura, usado no cálculo de SLA. */
  created_at?: string;
  /** Posicao confirmada pelo solicitante. null = sem localizacao confirmada. */
  latitude?: number | null;
  /** Posicao confirmada pelo solicitante. null = sem localizacao confirmada. */
  longitude?: number | null;
  /** Fotos compactadas e persistidas junto ao protocolo. */
  image_urls?: string[];
  /** Simulacoes ilustrativas, geradas por IA a partir das fotos originais. */
  corrected_image_urls?: string[];
  correction_status?: 'idle' | 'processing' | 'success' | 'failed';
  correction_error?: string | null;
  correction_generated_at?: string | null;
  /** Plano textual usado pela IA para produzir a simulação corrigida. */
  correction_report?: string | null;
  ai_priority?: 'baixa' | 'media' | 'alta' | 'critica' | null;
  ai_status?: 'pending' | 'success' | 'failed';
  /** Quantidade de relatos vinculados ao mesmo local. */
  location_group_count?: number;
  /** A partir de 2 relatos da mesma causa e local, os protocolos compartilham status. */
  location_grouped?: boolean;
  /** Verdadeiro quando existem mais de 10 relatos da mesma causa no local. */
  location_alert?: boolean;
  /** Protocolo mais antigo, usado como principal do agrupamento. */
  primary_protocol_id?: string;
  /** Pessoas e protocolos do grupo; enviado somente no detalhe administrativo. */
  location_reports?: LocationReport[];
}

export interface LocationReport {
  protocol_id: string;
  requester: string;
  phone?: string | null;
  created_at: string;
  category: string;
  status: string;
}
