// Egyptian pound marker used where a currency icon sits inside amount fields.
export function EgpIcon({ className = '' }: { className?: string }) {
  return (
    <span className={`${className} inline-block font-black leading-none whitespace-nowrap`} style={{ width: 'auto', height: 'auto', fontSize: '11px' }}>
      ج.م
    </span>
  );
}
