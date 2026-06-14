// WhatsApp number used for sales inquiries (E.164 without +).
export const SALES_WHATSAPP = "250786989552";

export function contactSalesUrl(productName: string): string {
  const msg = `Hello! I am interested in this product, ${productName}. Can we discuss about it?`;
  return `https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(msg)}`;
}
