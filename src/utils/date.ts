export const formatDate = (date: string) => {
  const dateFormat = new Date(date);
  return dateFormat.toLocaleString();
}