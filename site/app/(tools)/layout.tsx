import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function RootGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-[1370px] px-4 py-6">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
