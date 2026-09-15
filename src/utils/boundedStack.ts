/**
 * Pilha LIFO com tamanho limitado.
 *
 * O ultimo item inserido por push e sempre o primeiro devolvido por pop.
 * Quando o limite e atingido, o snapshot mais antigo e descartado para evitar
 * crescimento indefinido no navegador.
 */
export class BoundedStack<T> {
  private readonly items: T[] = [];

  constructor(private readonly capacity = 20) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new Error('A capacidade da pilha deve ser um inteiro positivo.');
    }
  }

  push(item: T): void {
    if (this.items.length === this.capacity) {
      this.items.shift();
    }
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  clear(): void {
    this.items.length = 0;
  }

  get size(): number {
    return this.items.length;
  }
}
