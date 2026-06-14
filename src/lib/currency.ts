export const formatRWF = (n: number | string | null | undefined) => {
  const v = Number(n ?? 0);
  return `${v.toLocaleString("en-US", { maximumFractionDigits: 0 })} RWF`;
};
