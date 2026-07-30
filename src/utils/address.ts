/**
 * Normalizacao e validacao de endereco.
 *
 * Motivacao: a base de producao acumulou registros como
 *   "Rua Arnaldo Victaliano, 881 - Jardim Castelo Branco, Ribeirao Preto - Selecionar"
 *   "av ,  - "
 *   "222, 2-2, 2-2"
 * porque o formulario montava a string por template sem validar campo algum e
 * sem impedir que o placeholder do seletor de estado fosse persistido.
 */

export interface AddressParts {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
}

export const BRAZILIAN_UFS: ReadonlyArray<{ code: string; name: string }> = [
    { code: 'AC', name: 'Acre' },
    { code: 'AL', name: 'Alagoas' },
    { code: 'AP', name: 'Amapá' },
    { code: 'AM', name: 'Amazonas' },
    { code: 'BA', name: 'Bahia' },
    { code: 'CE', name: 'Ceará' },
    { code: 'DF', name: 'Distrito Federal' },
    { code: 'ES', name: 'Espírito Santo' },
    { code: 'GO', name: 'Goiás' },
    { code: 'MA', name: 'Maranhão' },
    { code: 'MT', name: 'Mato Grosso' },
    { code: 'MS', name: 'Mato Grosso do Sul' },
    { code: 'MG', name: 'Minas Gerais' },
    { code: 'PA', name: 'Pará' },
    { code: 'PB', name: 'Paraíba' },
    { code: 'PR', name: 'Paraná' },
    { code: 'PE', name: 'Pernambuco' },
    { code: 'PI', name: 'Piauí' },
    { code: 'RJ', name: 'Rio de Janeiro' },
    { code: 'RN', name: 'Rio Grande do Norte' },
    { code: 'RS', name: 'Rio Grande do Sul' },
    { code: 'RO', name: 'Rondônia' },
    { code: 'RR', name: 'Roraima' },
    { code: 'SC', name: 'Santa Catarina' },
    { code: 'SP', name: 'São Paulo' },
    { code: 'SE', name: 'Sergipe' },
    { code: 'TO', name: 'Tocantins' },
];

function stripAccents(value: string): string {
    // Remove marcas de acentuacao combinantes (faixa Unicode U+0300-U+036F).
    return value.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function comparable(value: string): string {
    return stripAccents(value).trim().toLocaleLowerCase('pt-BR');
}

/**
 * Converte sigla ou nome completo do estado para a sigla de 2 letras.
 * Retorna null para qualquer coisa que nao seja uma UF brasileira real -
 * inclusive placeholders como "Selecionar".
 */
export function normalizeUf(input: string | null | undefined): string | null {
    if (!input) return null;
    const value = comparable(input);
    if (!value) return null;

    const byCode = BRAZILIAN_UFS.find((uf) => comparable(uf.code) === value);
    if (byCode) return byCode.code;

    const byName = BRAZILIAN_UFS.find((uf) => comparable(uf.name) === value);
    if (byName) return byName.code;

    return null;
}

/**
 * Monta o endereco exibido, omitindo partes ausentes em vez de deixar
 * separadores orfaos. O estado entra sempre normalizado como sigla.
 */
export function buildFullAddress(parts: AddressParts): string {
    const street = parts.street.trim();
    const number = parts.number.trim();
    const neighborhood = parts.neighborhood.trim();
    const city = parts.city.trim();
    const uf = normalizeUf(parts.state);

    const streetAndNumber = [street, number].filter(Boolean).join(', ');
    const beforeCity = [streetAndNumber, neighborhood].filter(Boolean).join(' - ');
    const cityAndUf = [city, uf].filter(Boolean).join(' - ');

    return [beforeCity, cityAndUf].filter(Boolean).join(', ');
}

/**
 * Extrai o bairro do endereco no formato canonico produzido por
 * buildFullAddress: "Rua X, 100 - Bairro, Cidade - UF".
 *
 * Retorna null quando o endereco nao tem bairro identificavel. Antes os filtros
 * usavam `address.split('-')[0]`, que devolve "Rua X, 100" - por isso as listas
 * rotuladas como "bairros" apareciam cheias de enderecos de rua.
 */
export function extractNeighborhood(address: string | null | undefined): string | null {
    if (!address) return null;
    const match = address.match(/\s-\s([^,]+),/);
    const value = match?.[1]?.trim();
    return value ? value : null;
}

/** Bairros distintos presentes na lista, em ordem alfabetica. */
export function listNeighborhoods(addresses: Array<string | null | undefined>): string[] {
    const found = new Set<string>();
    for (const address of addresses) {
        const neighborhood = extractNeighborhood(address);
        if (neighborhood) found.add(neighborhood);
    }
    return Array.from(found).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export interface AddressValidationError {
    field: keyof AddressParts;
    message: string;
}

/**
 * Valida os campos obrigatorios do endereco. Retorna o primeiro erro
 * encontrado, ou null quando o endereco esta utilizavel.
 */
export function validateAddress(parts: AddressParts): AddressValidationError | null {
    if (parts.street.trim().length < 3) {
        return { field: 'street', message: 'Informe a rua ou avenida da ocorrência.' };
    }

    if (!parts.number.trim()) {
        return { field: 'number', message: 'Informe o número. Use "S/N" se o local não tiver numeração.' };
    }

    if (parts.city.trim().length < 2) {
        return { field: 'city', message: 'Informe a cidade da ocorrência.' };
    }

    if (!normalizeUf(parts.state)) {
        return { field: 'state', message: 'Informe um estado válido (ex.: SP ou São Paulo).' };
    }

    return null;
}
