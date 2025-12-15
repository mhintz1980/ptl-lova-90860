/**
 * Base class for all domain entities.
 * Provides identity-based equality and immutable id.
 */
export abstract class Entity<TId = string> {
    constructor(public readonly id: TId) { }

    equals(other: Entity<TId>): boolean {
        if (other === null || other === undefined) {
            return false;
        }
        if (!(other instanceof Entity)) {
            return false;
        }
        return this.id === other.id;
    }
}
