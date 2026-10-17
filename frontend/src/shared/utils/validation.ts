export const isRequired = (label: string) => (value: string) =>
  value.length === 0 ? `请填写${label}` : null;
