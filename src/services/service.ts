export interface Service<T> {
  create(uid: string, ...set: any): Promise<T>;
  getById(uid: string): Promise<T>;
  update(uid: string, set: any): Promise<T>;
  delete(uid: string): Promise<T>;
}
