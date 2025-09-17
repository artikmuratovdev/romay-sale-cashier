function money(
  n: number | undefined | null,
  sign: 'neutral' | 'debt' | 'pos' = 'neutral'
) {
  if (n === null || n === undefined || isNaN(n)) {
    n = 0
  }

  const text = n.toLocaleString('uz-UZ')
  const cls =
    sign === 'debt' && text !== '0'
      ? 'text-rose-600'
      : sign === 'pos' || text === '0'
        ? 'text-emerald-600'
        : 'text-[#18181B]'
  return <span className={cls}>{text}</span>
}

export default money
