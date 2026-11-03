import Image, { type ImageProps } from "next/image";
import { publicImageSource } from "@/lib/public/image-source";

export default function PublicImage(props: ImageProps) {
  const source = typeof props.src === "string" ? publicImageSource(props.src) : props.src;
  const proxied = typeof source === "string" && source.startsWith("/api/public/image?");
  return <Image {...props} alt={props.alt} src={source} unoptimized={proxied || props.unoptimized} />;
}
