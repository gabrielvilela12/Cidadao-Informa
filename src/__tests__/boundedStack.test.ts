import { describe, expect, it } from 'vitest';
import { BoundedStack } from '../utils/boundedStack';

describe('BoundedStack', () => {
  it('retira primeiro o ultimo snapshot inserido (LIFO)', () => {
    const stack = new BoundedStack<string>(3);

    stack.push('Estado: SP');
    stack.push('Status: atrasado');
    stack.push('Categoria: visual');

    expect(stack.pop()).toBe('Categoria: visual');
    expect(stack.pop()).toBe('Status: atrasado');
    expect(stack.pop()).toBe('Estado: SP');
    expect(stack.pop()).toBeUndefined();
  });

  it('descarta o snapshot mais antigo ao atingir o limite', () => {
    const stack = new BoundedStack<number>(2);

    stack.push(1);
    stack.push(2);
    stack.push(3);

    expect(stack.size).toBe(2);
    expect(stack.pop()).toBe(3);
    expect(stack.pop()).toBe(2);
  });

  it('pode ser esvaziada ao encerrar o contexto da tela', () => {
    const stack = new BoundedStack<string>();
    stack.push('filtro');

    stack.clear();

    expect(stack.size).toBe(0);
    expect(stack.pop()).toBeUndefined();
  });
});
