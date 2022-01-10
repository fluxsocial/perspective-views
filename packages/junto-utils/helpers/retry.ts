export default async function retry(fn: () => void, count = 5) {
  try {
    return await fn();
  } catch (e) {
    if (count > 0) {
      return await retry(fn, count - 1);
    }

    return []
  }
}