"use client";

import Image from "next/image";
import { useState } from "react";

type BrandLogoProps = {
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ width, height, className, priority = false }: BrandLogoProps) {
  const [src, setSrc] = useState("/logo.png");

  return (
    <Image
      src={src}
      alt="Jungle Labs"
      width={width}
      height={height}
      className={className}
      priority={priority}
      onError={() => setSrc("/jungle-labs-logo.svg")}
    />
  );
}
