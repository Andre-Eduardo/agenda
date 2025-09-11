export type Sort<O extends string[]> = Partial<Record<O[number], 'asc' | 'desc' | undefined>>;

export type Pagination<O extends string[]> = {
    limit: number;
    cursor?: string;
    sort: Sort<O>;
};

export type PaginatedList<T> = {
    data: T[];
    totalCount: number;
    nextCursor: string | null;
};
