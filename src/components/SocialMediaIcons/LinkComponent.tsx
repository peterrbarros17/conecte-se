import Link from "next/link";

const LinkComponent = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactElement;
}) => {
  return (
    <Link
      href={href}
      target="_blank"
      className="bg-[var(--grey)] w-10 h-10 rounded-full p-2 flex items-center justify-center gap-4 hover:text-[var(--green)] text-[var(--green)] transition-all duration-150 ease-in"
    >
      {children}
    </Link>
  );
};

export default LinkComponent;
