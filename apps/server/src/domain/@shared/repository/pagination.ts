export type Sort<O extends string[]> = {
  key: O[number];
  direction: "asc" | "desc";
};

export type Pagination<O extends string[]> = {
  limit: number;
  page?: number | null;
  sort?: Array<Sort<O>>;
};

export type PaginatedList<T> = {
  data: T[];
  totalCount: number;
};
