export const formatEuro = (amount: number): string => {
  return `${amount.toFixed(2).replace('.', ',')}€`
}

export const handleNumberChange = (
  value: string,
  setter: (val: string) => void,
  allowNegative: boolean = false
) => {
  // Permitir números decimales y negativos si está permitido
  const regex = allowNegative 
    ? /^-?\d*\.?\d*$/ 
    : /^\d*\.?\d*$/
  
  if (value === '' || regex.test(value)) {
    setter(value)
  }
}