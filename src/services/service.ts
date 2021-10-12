export interface Service<T> {
  getById(uid: string): Promise<T>;
  create(uid: string, set: any): Promise<T>;
  update(uid: string, set: any): Promise<T>;
  delete(uid: string): Promise<T>;
}
