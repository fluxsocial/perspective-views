export const session = {
  set(key: string, value: Object | Array<any>) {
    const data = JSON.stringify(value);

    sessionStorage.setItem(key, data);
  },
  get(key: string): Object | Array<any> {
    const value = sessionStorage.getItem(key);
    // @ts-ignore
    return JSON.parse(value);
  },
};
