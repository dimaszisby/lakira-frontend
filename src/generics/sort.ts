export type SortOrder = "ASC" | "DESC";
export type SortParam<K extends string> = K | `-${K}`;
export type ParsedSort<K extends string> = { field: K; dir: SortOrder };
