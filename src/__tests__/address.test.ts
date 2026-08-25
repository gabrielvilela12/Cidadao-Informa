import { describe, expect, it } from 'vitest';
import { buildFullAddress, validateAddress } from '../utils/address';

describe('endereço da solicitação', () => {
  it('aceita endereço sem número', () => {
    const address = {
      street: 'Praça da Sé',
      number: '',
      neighborhood: 'Sé',
      city: 'São Paulo',
      state: 'SP',
    };

    expect(validateAddress(address)).toBeNull();
    expect(buildFullAddress(address)).toBe('Praça da Sé - Sé, São Paulo - SP');
  });

  it('continua exigindo rua, cidade e estado válidos', () => {
    expect(validateAddress({
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
    })).toEqual({ field: 'street', message: 'Informe a rua ou avenida da ocorrência.' });
  });
});
