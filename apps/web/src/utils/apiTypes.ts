export interface PaginatedResult<T> {
  items: T[];
  cursor: string | null;
  total: number;
}
