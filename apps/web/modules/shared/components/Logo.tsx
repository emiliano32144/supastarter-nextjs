import { cn } from "@ui/lib";

export function Logo({
	withLabel = true,
	className,
}: {
	className?: string;
	withLabel?: boolean;
}) {
	return (
		<span
			className={cn(
				"flex items-center font-semibold text-foreground leading-none",
				className,
			)}
		>
			<svg
				className="size-8 text-primary"
				viewBox="0 0 40 40"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				{/* Cuerpo de las tijeras */}
				<circle cx="13" cy="27" r="5" stroke="currentColor" strokeWidth="2.2" fill="none" />
				<circle cx="27" cy="27" r="5" stroke="currentColor" strokeWidth="2.2" fill="none" />
				{/* Brazos superiores cruzados */}
				<line x1="17" y1="24" x2="23" y2="10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
				<line x1="23" y1="24" x2="17" y2="10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
				{/* Pivot central */}
				<circle cx="20" cy="17" r="1.8" fill="currentColor" />
			</svg>
			{withLabel && (
				<span className="ml-2 font-extrabold text-xl tracking-tight text-primary">
					filo
				</span>
			)}
		</span>
	);
}
