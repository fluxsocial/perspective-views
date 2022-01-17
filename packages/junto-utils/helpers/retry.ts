type RetryOptions = {
  defaultValue?: any;
  count?: number;
  sleepDuration?: number;
}

export default async function retry(fn: () => any, {
  defaultValue = null, 
  count = 50, 
  sleepDuration = 1000 
}: RetryOptions) {
  await setTimeout(() => {}, sleepDuration);
  try {
    const val = await fn();
    
    if (!val) {
      if (count > 0) {
        return await retry(fn, { count: count - 1 });
      }
  
      return defaultValue;
    }

    return val;
  } catch (e) {
    if (count > 0) {
      return await retry(fn, { count: count - 1 });
    }

    return defaultValue;
  }
}