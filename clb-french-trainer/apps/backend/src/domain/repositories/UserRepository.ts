import type { User } from '../entities/User';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  create(user: User): Promise<void>;
}
