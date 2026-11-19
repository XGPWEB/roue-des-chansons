import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Roue from "@/components/Roue";
import { getRoue, roues } from "@/data/roues";

export const dynamicParams = false;

export function generateStaticParams() {
  return roues.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: getRoue(slug)?.titre ?? "Roue" };
}

export default async function PageRoue({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const roue = getRoue(slug);
  if (!roue) notFound();
  return <Roue roue={roue} />;
}
