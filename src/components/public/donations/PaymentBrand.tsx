import Image from "next/image";
import type { PaymentMethod } from "@/lib/payments/types";

/** Category artwork; operators are chosen on the secure hosted checkout. */
export default function PaymentBrand({ method }: { method: PaymentMethod }) {
  const brands = method === "CARD"
    ? [{ name: "Visa", file: "visa" }, { name: "Mastercard", file: "mastercard" }]
    : method === "MOBILE_MONEY"
      ? [{ name: "MTN", file: "mtn" }, { name: "Moov Money", file: "moov" }, { name: "Celtiis", file: "celtiis" }]
      : [];
  return <span className="flex h-14 items-center justify-center gap-1.5 sm:gap-3">
    {brands.map(brand => <Image key={brand.file} src={`/images/payments/${brand.file}.svg`} alt={brand.name} width={44} height={44} unoptimized className="h-9 w-9 rounded-lg object-contain sm:h-11 sm:w-11" />)}
  </span>;
}
