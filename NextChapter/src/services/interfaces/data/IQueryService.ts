/**
 * Query service for complex data operations
 * Supports both SQL-like and NoSQL query patterns
 */

import { Result } from '@services/interfaces/common/result';
import { BaseEntity, PaginatedResult } from '@services/interfaces/common/types';

// Query builder interface
export interface IQueryBuilder<T> {
  where(field: string, operator: QueryOperator, value: any): IQueryBuilder<T>;
  whereIn(field: string, values: any[]): IQueryBuilder<T>;
  whereBetween(field: string, min: any, max: any): IQueryBuilder<T>;
  whereNull(field: string): IQueryBuilder<T>;
  whereNotNull(field: string): IQueryBuilder<T>;
  
  and(fn: (query: IQueryBuilder<T>) => void): IQueryBuilder<T>;
  or(fn: (query: IQueryBuilder<T>) => void): IQueryBuilder<T>;
  
  orderBy(field: string, direction?: 'asc' | 'desc'): IQueryBuilder<T>;
  limit(count: number): IQueryBuilder<T>;
  offset(count: number): IQueryBuilder<T>;
  
  select(...fields: string[]): IQueryBuilder<T>;
  include(...relations: string[]): IQueryBuilder<T>;
  
  // Execution methods
  get(): Promise<Result<T[]>>;
  first(): Promise<Result<T | null>>;
  count(): Promise<Result<number>>;
  exists(): Promise<Result<boolean>>;
  paginate(page: number, perPage: number): Promise<Result<PaginatedResult<T>>>;
}

export type QueryOperator = 
  | '=' 
  | '!=' 
  | '>' 
  | '>=' 
  | '<' 
  | '<=' 
  | 'like' 
  | 'in' 
  | 'notIn'
  | 'between'
  | 'isNull'
  | 'isNotNull';

// Query service interface
export interface IQueryService<T extends BaseEntity> {
  query(): IQueryBuilder<T>;
  
  // Raw query support (for complex queries)
  raw<R = any>(query: string, params?: any[]): Promise<Result<R>>;
  
  // Aggregation queries
  sum(field: string, filter?: Partial<T>): Promise<Result<number>>;
  avg(field: string, filter?: Partial<T>): Promise<Result<number>>;
  min(field: string, filter?: Partial<T>): Promise<Result<any>>;
  max(field: string, filter?: Partial<T>): Promise<Result<any>>;
  
  // Grouping
  groupBy<K extends keyof T>(
    field: K,
    filter?: Partial<T>
  ): Promise<Result<Map<T[K], T[]>>>;
  
  // Full-text search
  search(query: string, fields: string[]): Promise<Result<T[]>>;
}

// Observable queries for real-time updates
export interface IObservableQuery<T> {
  subscribe(
    onNext: (data: T[]) => void,
    onError?: (error: Error) => void
  ): () => void; // Returns unsubscribe function
}

export interface IReactiveQueryService<T extends BaseEntity> extends IQueryService<T> {
  observe(): IObservableQueryBuilder<T>;
}

export interface IObservableQueryBuilder<T> extends IQueryBuilder<T> {
  // Override execution methods to return observables
  get(): IObservableQuery<T[]>;
  first(): IObservableQuery<T | null>;
  count(): IObservableQuery<number>;
}