"use client";

import Image from "next/image";
import Link from "next/link";
import SpiderWebIcon from "~/../app/icon.png";

export default function HomeIcon() {
  return (
    <Link href="/">
      <Image src={SpiderWebIcon} alt="spiderweb icon" height={48} width={48} />
    </Link>
  );
}
